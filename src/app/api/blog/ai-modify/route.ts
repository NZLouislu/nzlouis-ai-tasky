import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { getUserIdFromRequest } from '@/lib/admin-auth';
import { PartialBlock } from '@blocknote/core';
import { DocumentAnalyzer, DocumentStructure } from '@/lib/blog/document-analyzer';
import { performWebSearch } from '@/lib/search/tavily';

interface PageModification {
  type: 'replace' | 'insert' | 'append' | 'update_title' | 'add_section' | 'delete' | 'replace_paragraph';
  target?: string;
  content?: string;
  title?: string;
  position?: number;
  paragraphIndex?: number;
}

interface AIModifyRequest {
  postId: string;
  currentContent: PartialBlock[];
  currentTitle: string;
  instruction: string;
  modelId?: string; // User's selected model
  chatHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

interface AIModifyResponse {
  modifications: PageModification[];
  explanation: string;
}

interface PlanningResult {
  thought_process: string;
  target_sections: string[];
  needs_search: boolean;
  search_queries: string[];
  action_type: string;
}

function detectLanguage(text: string): string {
  if (/[\u4e00-\u9fa5]/.test(text)) return 'Chinese';
  if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) return 'Japanese';
  if (/[\uac00-\ud7af]/.test(text)) return 'Korean';
  if (/[\u0400-\u04FF]/.test(text)) return 'Russian';
  return 'English';
}

function blocksToText(blocks: PartialBlock[]): string {
  return blocks.map(block => {
    if (typeof block.content === 'string') {
      return block.content;
    }
    if (Array.isArray(block.content)) {
      return block.content.map(item => {
        if (typeof item === 'string') return item;
        if (typeof item === 'object' && 'text' in item) return item.text;
        return '';
      }).join('');
    }
    return '';
  }).filter(text => text.trim()).join('\n\n');
}

async function callLLM(
  systemPrompt: string,
  userPrompt: string,
  userId: string | undefined,
  modelId?: string
): Promise<string> {
  const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      maxTokens: 16000,
      userId,
      modelId, // Pass the user's selected model
    }),
  });

  if (!response.ok) {
    throw new Error(`AI API returned ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('No reader available');
  }

  const decoder = new TextDecoder();
  let buffer = '';
  let fullResponse = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');

    for (let i = 0; i < lines.length - 1; i++) {
      const line = lines[i].trim();
      if (line.startsWith('0:')) {
        try {
          const jsonStr = line.substring(2);
          const text = JSON.parse(jsonStr);
          fullResponse += text;
        } catch {
          // Silently skip parsing errors
        }
      }
    }
    buffer = lines[lines.length - 1];
  }

  return fullResponse;
}

function repairJsonString(jsonStr: string): string {
  let inString = false;
  let escaped = false;
  let result = '';

  for (let i = 0; i < jsonStr.length; i++) {
    const char = jsonStr[i];

    if (char === '"' && !escaped) {
      inString = !inString;
      result += char;
    } else if (inString && char === '\n') {
      // If we are inside a string and see a newline, escape it
      result += '\\n';
    } else if (inString && char === '\r') {
      // Skip carriage returns inside strings
    } else if (inString && char === '\t') {
      // Escape tabs
      result += '\\t';
    } else {
      // Normal character
      result += char;
    }

    // Update escaped state
    if (char === '\\' && !escaped) {
      escaped = true;
    } else {
      escaped = false;
    }
  }

  return result;
}

function parseJSON(response: string): any | null {
  const cleanedResponse = response
    .replace(/```json\s*/g, '')
    .replace(/```\s*/g, '')
    .trim();

  const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    // Check if this is a text-only response (suggestions/advice)
    if (cleanedResponse.length > 100 && !cleanedResponse.includes('{')) {
      console.log('⚠️ AI returned text suggestions instead of JSON modifications');
      console.log('Response preview:', cleanedResponse.substring(0, 200) + '...');
      return null; // Return null instead of throwing error
    }
    throw new Error('No JSON found in response');
  }

  try {
    let jsonStr = jsonMatch[0];

    // Attempt to convert Chinese field names if detected
    if (jsonStr.includes('"修改操作"') || jsonStr.includes('"操作类型"')) {
      console.warn('Detected Chinese field names, attempting to convert...');
      jsonStr = jsonStr
        .replace(/"修改操作"/g, '"modifications"')
        .replace(/"操作类型"/g, '"type"')
        .replace(/"内容"/g, '"content"')
        .replace(/"标题"/g, '"title"')
        .replace(/"解释"/g, '"explanation"');
    }

    // First try parsing as is (after basic cleanup)
    try {
      return JSON.parse(jsonStr);
    } catch {
      // If that fails, try the robust repair for unescaped newlines
      console.log('⚠️ Standard JSON parse failed, attempting repair for unescaped newlines...');
      const repairedStr = repairJsonString(jsonStr);
      return JSON.parse(repairedStr);
    }
  } catch (parseError) {
    console.error('Failed to parse JSON:', parseError);
    console.log('Attempted to parse:', jsonMatch[0].substring(0, 500));
    throw parseError;
  }
}

/**
 * Smart instruction processing - handles references to previous AI suggestions
 */
async function processSmartInstruction(params: {
  instruction: string;
  chatHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
  currentContent: PartialBlock[];
  currentTitle: string;
  userId?: string;
  modelId?: string;
}): Promise<string> {
  const { instruction, chatHistory, currentTitle, userId, modelId } = params;
  
  // Detect if user is referring to previous suggestions
  const referencePatterns = [
    /根据.*?建议/i,
    /按照.*?建议/i,
    /应用.*?建议/i,
    /执行.*?建议/i,
    /follow.*?suggest/i,
    /apply.*?suggest/i,
    /based on.*?suggest/i,
    /according to.*?suggest/i,
  ];
  
  const isReferencingPrevious = referencePatterns.some(pattern => pattern.test(instruction));
  
  if (!isReferencingPrevious || !chatHistory || chatHistory.length === 0) {
    return instruction; // Return original instruction
  }
  
  console.log('🔍 Detected reference to previous suggestions, analyzing chat history...');
  
  // Extract the last few AI responses that might contain suggestions
  const recentAIMessages = chatHistory
    .filter(msg => msg.role === 'assistant')
    .slice(-3) // Last 3 AI messages
    .map(msg => msg.content)
    .join('\n\n');
  
  if (!recentAIMessages) {
    console.log('⚠️ No recent AI messages found in chat history');
    return instruction;
  }
  
  // Use LLM to extract actionable instructions from the suggestions
  const extractionPrompt = `You are an instruction extraction expert.

**Context:**
The user previously received suggestions from an AI assistant. Now they want to APPLY those suggestions by modifying the article.

**Previous AI Suggestions:**
${recentAIMessages}

**Current Article Title:** ${currentTitle}

**User's Request:** "${instruction}"

**CRITICAL TASK:**
Convert the AI's suggestions into SPECIFIC, ACTIONABLE modification instructions.

**IMPORTANT:**
- DO NOT just repeat the suggestions
- DO NOT provide analysis or advice
- MUST specify WHAT content to add/modify and WHERE
- MUST be concrete enough to generate actual modifications

**Output Format (JSON):**
{
  "extracted_instruction": "A clear, specific instruction that can be directly executed. Examples:
  - 'Add a new section titled 中国的火星探索 with content about 天问一号 mission, 祝融号 rover, and their achievements'
  - 'Add a new section titled 阿联酋的火星任务 with content about 希望号 probe and its mission to study Mars atmosphere'
  - 'Expand the 火星探索历史 section to include ESA missions like Mars Express and ExoMars'
  "
}

**Rules:**
1. Be EXTREMELY specific about what content to add
2. Include section titles if creating new sections
3. Mention key facts/details to include
4. Use the same language as the suggestions
5. Make it actionable - the system should be able to generate JSON modifications from this`;

  try {
    const response = await callLLM(extractionPrompt, 'Extract the instruction', userId, modelId);
    const result = parseJSON(response);
    
    if (result.extracted_instruction) {
      console.log('✅ Extracted smart instruction:', result.extracted_instruction);
      return result.extracted_instruction;
    }
  } catch (error) {
    console.warn('Failed to extract smart instruction:', error);
  }
  
  return instruction; // Fallback to original
}

async function generateModifications(params: {
  currentContent: PartialBlock[];
  currentTitle: string;
  instruction: string;
  language: string;
  userId?: string;
  documentStructure?: DocumentStructure;
  modelId?: string;
}): Promise<AIModifyResponse> {
  const { currentContent, currentTitle, instruction, language, userId, documentStructure, modelId } = params;

  const contentText = blocksToText(currentContent);
  
  const structureInfo = documentStructure ? `
**Document Structure Analysis:**
- Total Sections: ${documentStructure.sections.length}
- Total Words: ${documentStructure.stats.totalWords}
- Total Paragraphs: ${documentStructure.stats.totalParagraphs}
- Total Headings: ${documentStructure.stats.totalHeadings}
- Reading Time: ${documentStructure.stats.readingTimeMinutes} minutes

**Document Outline:**
${documentStructure.outline.map((node, idx) => `${idx + 1}. ${node.title} (Level ${node.level})`).join('\n')}

**Sections:**
${documentStructure.sections.map((section, idx) => 
  `Section ${idx + 1}: ${section.heading?.title || '(No heading)'} - ${section.wordCount} words`
).join('\n')}
` : '';

  // --- Stage 1: Perception & Planning ---
  console.log('🤔 Stage 1: Planning...');
  
  const planningSystemPrompt = `You are a professional blog editor planner.

**CRITICAL: YOU MUST RETURN VALID JSON FORMAT - NO EXCEPTIONS!**

**Document Structure:**
${structureInfo}

**User Instruction:** "${instruction}"

**Your Task:**
Analyze the user's request and create an actionable modification plan.

**IMPORTANT CASES TO HANDLE:**

1. **If user says "根据建议修改" / "apply suggestions" / "按照建议":**
   - This means they want to APPLY previous suggestions
   - You MUST set action_type to "apply_suggestions"
   - You MUST set needs_search to false (suggestions already exist)
   - Extract target sections from the context

2. **If user asks for "建议" / "suggestions" / "分析" / "analyze":**
   - This is a CONSULTATION request
   - Set action_type to "consultation"
   - The system will handle this differently

3. **Normal modification requests:**
   - Identify target section(s) from H2 headings
   - Determine if search is needed
   - Set appropriate action_type

**REQUIRED JSON FORMAT (COPY EXACTLY):**
\`\`\`json
{
  "thought_process": "Reasoning about what to do...",
  "target_sections": ["Section Title 1", "Section Title 2"],
  "needs_search": true/false,
  "search_queries": ["query 1", "query 2"],
  "action_type": "expand" | "rewrite" | "add_section" | "apply_suggestions" | "consultation" | "other"
}
\`\`\`

**Action Types:**
- "expand": Add more content to existing section
- "rewrite": Completely rewrite a section
- "add_section": Create new section
- "apply_suggestions": User wants to apply previous AI suggestions
- "consultation": User asking for advice (not direct modification)
- "other": General modification

**Search Guidelines:**
- Set needs_search=true if: user mentions "latest", "recent", "search", "最新", "搜索"
- Set needs_search=false if: applying suggestions, general writing improvements

**REMEMBER: ONLY JSON OUTPUT! NO PLAIN TEXT!**`;

  const planningUserPrompt = `Please analyze the request: "${instruction}"`;

  let plan: PlanningResult;
  try {
    const planningResponse = await callLLM(planningSystemPrompt, planningUserPrompt, userId, modelId);
    console.log('Planning Response:', planningResponse);
    const parsedPlan = parseJSON(planningResponse);
    
    if (parsedPlan === null) {
      console.log('💬 AI provided text suggestions instead of actionable plan');
      throw new Error('Text-only response, not a modification plan');
    }
    
    plan = parsedPlan;
  } catch (error) {
    console.warn('Planning failed, falling back to direct generation', error);
    // Fallback plan
    plan = {
      thought_process: "Fallback to direct generation",
      target_sections: [],
      needs_search: false,
      search_queries: [],
      action_type: "other"
    };
  }

  // --- Stage 2: Retrieval ---
  let searchContext = '';
  if (plan.needs_search && plan.search_queries.length > 0) {
    console.log('🔍 Stage 2: Retrieval...', plan.search_queries);
    try {
      // Execute searches in parallel
      const searchResults = await Promise.all(
        plan.search_queries.slice(0, 3).map(q => performWebSearch(q))
      );
      searchContext = searchResults.join('\n\n');
      console.log('✅ Search completed');
    } catch (error) {
      console.error('Search failed:', error);
    }
  } else {
    console.log('⏭️ Stage 2: Skipped (No search needed)');
  }

  // --- Stage 3: Generation ---
  console.log('✍️ Stage 3: Generation...');

  const generationSystemPrompt = `You are a professional blog editor and content creation expert.

**CRITICAL: YOU MUST RETURN VALID JSON FORMAT - NO EXCEPTIONS!**

${structureInfo}

**Plan:**
${JSON.stringify(plan, null, 2)}

**Search Results:**
${searchContext || '(No search results)'}

**ABSOLUTE REQUIREMENTS - FAILURE TO COMPLY WILL BREAK THE SYSTEM:**

1. ⚠️ **NEVER return plain text suggestions or advice**
2. ⚠️ **ALWAYS return a valid JSON object with "modifications" and "explanation" fields**
3. ⚠️ **Even if the user asks for suggestions, you MUST convert them into actionable JSON modifications**
4. ⚠️ **If the user says "根据建议修改" (apply suggestions), you MUST generate actual modifications, not repeat the suggestions**
5. ⚠️ **IMPORTANT: Escape all newlines in content strings as \\n. Do NOT use actual line breaks inside JSON strings.**

**REQUIRED JSON FORMAT (COPY THIS STRUCTURE EXACTLY):**
\`\`\`json
{
  "modifications": [
    {
      "type": "append",
      "content": "Your detailed content here...\\n\\nMore paragraphs..."
    }
  ],
  "explanation": "Brief explanation of what was changed"
}
\`\`\`

**Modification Types You Can Use:**
- \`update_title\`: Change article title → { "type": "update_title", "title": "New Title" }
- \`append\`: Add content at end → { "type": "append", "content": "..." }
- \`add_section\`: Add new H2 section → { "type": "add_section", "content": "## Section Title\\n\\nContent..." }
- \`replace\`: Replace all content → { "type": "replace", "content": "..." }
- \`insert\`: Insert at position → { "type": "insert", "position": 0, "content": "..." }
- \`delete\`: Delete paragraph → { "type": "delete", "paragraphIndex": 0 }
- \`replace_paragraph\`: Replace specific paragraph → { "type": "replace_paragraph", "paragraphIndex": 0, "content": "..." }

**Content Guidelines:**
- Content language: ${language}
- For "detailed" requests: generate 300-500 words minimum
- Use facts/data from search results when available
- For BlockNote: use plain text with \\n\\n for paragraph breaks (NO markdown headers like ## inside content field)
- For new sections: use "add_section" type which will create proper H2 headings

**EXAMPLE - User says "根据你的建议修改文章" (apply your suggestions):**
\`\`\`json
{
  "modifications": [
    {
      "type": "add_section",
      "content": "## 中国的火星探索\\n\\n2021年，中国天问一号任务成功实现绕、落、巡一体化，祝融号火星车在火星表面工作。这是中国深空探测的重要里程碑，也是人类火星探索历史上的重大突破。\\n\\n祝融号火星车配备了多种科学仪器，包括多光谱相机、次表层探测雷达、火星表面成分探测仪等。它在火星乌托邦平原开展了为期数月的科学探测工作，获取了大量宝贵的科学数据。"
    },
    {
      "type": "add_section",
      "content": "## 阿联酋的火星任务\\n\\n2021年，阿联酋希望号火星探测器成功进入火星轨道，成为阿拉伯世界首个深空探测任务。希望号的主要任务是研究火星大气和气候变化，为全球火星研究做出独特贡献。"
    }
  ],
  "explanation": "根据建议添加了中国和阿联酋的火星探索内容，使文章更加全面和国际化"
}
\`\`\`

**REMEMBER: NO PLAIN TEXT RESPONSES! ONLY JSON!**`;

  const isConsultation = /建议|分析|优化|how to|suggest|analyze/i.test(instruction);
  const lengthGuideline = isConsultation 
    ? "If providing suggestions/advice (not direct modifications), keep the response concise (under 1000 words) and structured. Focus on the top 3-5 most important points." 
    : "";

  const generationUserPrompt = `Current Article Title: ${currentTitle}
Current Content (Text):
${contentText.substring(0, 3000)}... (truncated)

User Instruction: ${instruction}

**Task:** Execute the plan and generate modifications.
If search results are provided, USE THEM to enrich the content.
${lengthGuideline}
`;

  try {
    const generationResponse = await callLLM(generationSystemPrompt, generationUserPrompt, userId, modelId);
    console.log('Generation Response:', generationResponse);
    
    const result = parseJSON(generationResponse);
    
    // Check if AI returned text suggestions instead of JSON
    if (result === null) {
      console.log('💬 AI provided text suggestions instead of JSON modifications');
      console.log('Returning suggestions as explanation');
      
      // Return the text suggestions as explanation
      return {
        modifications: [],
        explanation: `📝 AI 建议（Suggestions）:\n\n${generationResponse}\n\n💡 提示：这是 AI 的优化建议。如需应用这些建议，请说"根据你的建议修改文章"。`
      };
    }
    
    // Validate result
    if (!result.modifications || !Array.isArray(result.modifications)) {
      throw new Error('Invalid response format');
    }

    return {
      modifications: result.modifications,
      explanation: result.explanation || plan.thought_process
    };

  } catch (error) {
    console.error('Generation failed:', error);
    return generateDefaultModifications(instruction, currentTitle, language);
  }
}

// Generate detailed Chinese content based on topic
function _generateDetailedChineseContent(topic: string): string {
  const topicLower = topic.toLowerCase();
  
  // Topic-specific detailed content
  if (topicLower.includes('宇宙起源') || topicLower.includes('宇宙起点') || topicLower.includes('大爆炸')) {
    return `## 宇宙起源的探索

宇宙起源是人类最古老也最深刻的问题之一。根据现代宇宙学的主流理论——大爆炸理论，我们的宇宙诞生于约138亿年前的一次奇点爆炸。在那个瞬间，所有的物质、能量、空间和时间都从一个无限小、无限热、无限密的点中迸发而出。

在大爆炸后的最初几分钟内，宇宙经历了极其剧烈的膨胀和冷却过程。温度从数万亿度迅速下降，基本粒子开始形成，质子和中子结合成最初的原子核。这个过程被称为"核合成时期"，奠定了宇宙中氢和氦元素的基础比例。

随着宇宙继续膨胀和冷却，大约在大爆炸后38万年，温度降低到足以让电子与原子核结合，形成中性原子。这一时刻被称为"复合时期"，宇宙从此变得透明，光子得以自由传播。这些古老的光子至今仍在宇宙中传播，被我们观测为宇宙微波背景辐射，这是大爆炸理论最重要的观测证据之一。

在接下来的数亿年里，宇宙中的物质在引力作用下逐渐聚集，形成了第一代恒星和星系。这些早期恒星通过核聚变反应产生了更重的元素，为后来行星和生命的形成提供了必要的物质基础。今天，我们仍在通过各种天文观测手段，不断深化对宇宙起源和演化的理解。`;
  }
  
  if (topicLower.includes('火星') || topicLower.includes('mars')) {
    return `## 火星探索的历程

火星，这颗红色星球，一直是人类太空探索的重点目标。自20世纪60年代以来，人类已经向火星发射了数十个探测器，试图揭开这颗神秘星球的面纱。

早期的火星探索始于1960年代的苏联和美国的竞赛。1964年，美国的水手4号成为第一个成功飞掠火星的探测器，传回了21张珍贵的火星表面照片。这些照片显示火星表面布满了陨石坑，类似于月球，这改变了人们对火星的认识。

1976年，美国的海盗1号和2号成功登陆火星，进行了长达数年的科学研究。这两个着陆器不仅拍摄了大量火星表面的照片，还进行了土壤分析和生命探测实验。虽然没有发现确凿的生命证据，但这些任务为我们提供了关于火星地质、气候和大气的宝贵数据。

进入21世纪后，火星探索进入了新的黄金时代。2004年，美国的机遇号和勇气号火星车成功登陆，它们在火星表面工作了多年，发现了火星曾经存在液态水的确凿证据。2012年，好奇号火星车登陆，配备了更先进的科学仪器，继续寻找火星上可能存在过生命的证据。

最近，2021年登陆的毅力号火星车和机智号直升机开启了火星探索的新篇章。毅力号不仅在寻找古代生命的迹象，还在采集样本，准备在未来的任务中送回地球。而机智号则成为了第一架在地球以外的星球上飞行的航空器，为未来的火星探索开辟了新的可能性。`;
  }
  
  // Generic detailed content
  return `## 关于${topic}

${topic}是一个值得深入探讨的重要主题。在当今快速发展的时代，理解${topic}的本质和影响变得越来越重要。

从历史角度来看，${topic}的发展经历了多个重要阶段。早期的研究和实践为我们今天的理解奠定了基础。随着时间的推移，人们对${topic}的认识不断深化，新的发现和理论不断涌现，推动着这个领域向前发展。

在实践层面，${topic}已经在多个领域产生了深远的影响。它不仅改变了我们的工作方式和生活方式，还为解决许多复杂问题提供了新的思路和方法。许多专家和学者都在积极研究${topic}，试图揭示其更深层次的规律和潜力。

展望未来，${topic}仍然充满了无限的可能性。随着技术的进步和认识的深化，我们有理由相信，${topic}将在未来发挥更加重要的作用，为人类社会的发展做出更大的贡献。

因此，持续关注和研究${topic}，不仅有助于我们更好地理解这个世界，也能为我们应对未来的挑战提供宝贵的启示和指导。`;
}

// Generate detailed English content based on topic
function _generateDetailedEnglishContent(topic: string): string {
  const topicLower = topic.toLowerCase();
  
  if (topicLower.includes('universe') || topicLower.includes('big bang') || topicLower.includes('cosmos')) {
    return `## The Origin of the Universe

The origin of the universe is one of humanity's oldest and most profound questions. According to the mainstream theory of modern cosmology—the Big Bang theory—our universe was born approximately 13.8 billion years ago from a singularity explosion. In that instant, all matter, energy, space, and time burst forth from an infinitely small, infinitely hot, and infinitely dense point.

In the first few minutes after the Big Bang, the universe underwent extremely violent expansion and cooling. The temperature dropped rapidly from trillions of degrees, basic particles began to form, and protons and neutrons combined to form the first atomic nuclei. This process, known as "nucleosynthesis," established the fundamental ratio of hydrogen and helium elements in the universe.

As the universe continued to expand and cool, approximately 380,000 years after the Big Bang, the temperature dropped low enough for electrons to combine with atomic nuclei, forming neutral atoms. This moment, called "recombination," made the universe transparent, allowing photons to travel freely. These ancient photons still travel through the universe today and are observed as the cosmic microwave background radiation, one of the most important observational evidences for the Big Bang theory.

Over the following hundreds of millions of years, matter in the universe gradually gathered under gravity, forming the first generation of stars and galaxies. These early stars produced heavier elements through nuclear fusion reactions, providing the necessary material foundation for the later formation of planets and life. Today, we continue to deepen our understanding of the origin and evolution of the universe through various astronomical observations.`;
  }
  
  return `## About ${topic}

${topic} is an important subject worthy of in-depth exploration. In today's rapidly evolving era, understanding the nature and impact of ${topic} has become increasingly important.

From a historical perspective, the development of ${topic} has gone through several important stages. Early research and practice laid the foundation for our understanding today. Over time, people's understanding of ${topic} has continued to deepen, with new discoveries and theories constantly emerging, driving the field forward.

At the practical level, ${topic} has had a profound impact in multiple areas. It has not only changed the way we work and live but also provided new ideas and methods for solving many complex problems. Many experts and scholars are actively researching ${topic}, trying to reveal its deeper patterns and potential.

Looking to the future, ${topic} is still full of infinite possibilities. With technological advances and deepening understanding, we have reason to believe that ${topic} will play an even more important role in the future, making greater contributions to the development of human society.

Therefore, continuing to pay attention to and research ${topic} will not only help us better understand the world but also provide valuable insights and guidance for addressing future challenges.`;
}

// Generate paragraph content for "add" operations (not full article)
function generateParagraphContent(topic: string, language: string): string {
  const topicLower = topic.toLowerCase();
  
  // SpaceX / Elon Musk / Mars specific content
  if (topicLower.includes('spacex') || topicLower.includes('马斯克') || topicLower.includes('elon') || 
      (topicLower.includes('火星') && (topicLower.includes('计划') || topicLower.includes('探索') || topicLower.includes('plan')))) {
    
    if (language === 'Chinese') {
      return `## SpaceX的火星探索计划

埃隆·马斯克（Elon Musk）创立的SpaceX公司，将人类移民火星作为其终极目标。马斯克多次公开表示，他希望在2050年之前在火星上建立一个自给自足的城市，容纳至少100万人口。

SpaceX的火星计划核心是Starship（星舰）超重型运载火箭系统。这个完全可重复使用的航天器高约120米，直径9米，设计运载能力可达100-150吨。Starship已经完成多次测试飞行，2024年6月实现了首次成功的软着陆回收。

根据马斯克的时间表，SpaceX计划在2026年发射首批无人Starship前往火星，测试着陆技术和生命支持系统。如果成功，2028-2030年将发送更多无人任务，建立燃料生产设施（利用火星大气中的CO2和地下水制造甲烷燃料）。首次载人任务预计在2033年左右进行。

这个宏伟计划面临巨大挑战：火星之旅单程需要6-9个月，宇航员将面临辐射、微重力、心理压力等问题。火星表面温度极低（平均-63°C），大气稀薄（仅为地球的1%），需要建造加压栖息地。但马斯克坚信，成为"多行星物种"是人类文明延续的关键。`;
    } else {
      return `## SpaceX's Mars Exploration Plan

SpaceX, founded by Elon Musk, has made human colonization of Mars its ultimate goal. Musk has publicly stated multiple times that he hopes to establish a self-sustaining city on Mars by 2050, housing at least 1 million people.

The core of SpaceX's Mars plan is the Starship super-heavy launch system. This fully reusable spacecraft stands about 120 meters tall with a 9-meter diameter, designed to carry 100-150 tons of payload. Starship has completed multiple test flights, achieving its first successful soft landing and recovery in June 2024.

According to Musk's timeline, SpaceX plans to launch the first uncrewed Starships to Mars in 2026 to test landing technology and life support systems. If successful, more uncrewed missions will follow in 2028-2030 to establish fuel production facilities (using CO2 from Mars' atmosphere and underground water to produce methane fuel). The first crewed mission is expected around 2033.

This ambitious plan faces enormous challenges: the journey to Mars takes 6-9 months one way, and astronauts will face radiation, microgravity, and psychological stress. Mars' surface temperature is extremely cold (average -63°C), with a thin atmosphere (only 1% of Earth's), requiring pressurized habitats. However, Musk firmly believes that becoming a "multi-planetary species" is key to the continuation of human civilization.`;
    }
  }
  
  // Generic paragraph content for other topics
  if (language === 'Chinese') {
    return `## 关于${topic}

${topic}是一个值得深入探讨的重要主题。在当今快速发展的时代，理解${topic}的本质和影响变得越来越重要。

从历史角度来看，${topic}的发展经历了多个重要阶段。早期的研究和实践为我们今天的理解奠定了基础。随着时间的推移，人们对${topic}的认识不断深化，新的发现和理论不断涌现，推动着这个领域向前发展。

在实践层面，${topic}已经在多个领域产生了深远的影响。它不仅改变了我们的工作方式和生活方式，还为解决许多复杂问题提供了新的思路和方法。`;
  } else {
    return `## About ${topic}

${topic} is an important subject worthy of in-depth exploration. In today's rapidly evolving era, understanding the nature and impact of ${topic} has become increasingly important.

From a historical perspective, the development of ${topic} has gone through several important stages. Early research and practice laid the foundation for our understanding today. Over time, people's understanding of ${topic} has continued to deepen, with new discoveries and theories constantly emerging.

At the practical level, ${topic} has had a profound impact in multiple areas. It has not only changed the way we work and live but also provided new ideas and methods for solving many complex problems.`;
  }
}

function generateDefaultModifications(
  instruction: string,
  currentTitle: string,
  language: string
): AIModifyResponse {
  const modifications: PageModification[] = [];
  const lowerInstruction = instruction.toLowerCase();

  console.log('Generating default modifications for instruction:', instruction);

  // Extract topic from instruction for detailed content generation
  const extractTopic = (text: string): string => {
    const patterns = [
      /关于\s*([^，。,\n]+)/i,
      /about\s+([^,.\n]+)/i,
      /添加.*?([^，。,\n]+?)的.*?内容/i,
      /add.*?content.*?about\s+([^,.\n]+)/i,
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    return '';
  };

  const titlePatterns = [
    /(?:修改|改|更改|change|update).*?(?:title|标题).*?(?:改成|为|成|to|，改成|，为)\s*["'"]?([^"'"，。,\n]+?)["'"]?\s*$/i,
    /(?:title|标题).*?(?:改成|为|成|to|，改成|，为)\s*["'"]?([^"'"，。,\n]+?)["'"]?\s*$/i,
    /将.*?(?:title|标题).*?(?:改成|为|成|to|，改成|，为)\s*["'"]?([^"'"，。,\n]+?)["'"]?\s*$/i,
    /title.*?["'"](.*?)["'"]/i,
    /标题.*?["'"](.*?)["'"]/i,
    /タイトル.*?["'"](.*?)["'"]/i,
  ];

  for (const pattern of titlePatterns) {
    const match = instruction.match(pattern);
    if (match && match[1]) {
      const newTitle = match[1].trim();
      modifications.push({
        type: 'update_title',
        title: newTitle,
      });
      console.log('✅ Detected title change:', newTitle);
      console.log('   Pattern matched:', pattern);
      break;
    }
  }

  const contentPatterns = [
    /(?:修改|改|更改|change|update).*?(?:content|内容).*?(?:改成|为|成|to|，改成|，为)\s*["'"]?([^"'"。\n]+?)["'"]?\s*$/i,
    /(?:content|内容).*?(?:改成|为|成|to|，改成|，为)\s*["'"]?([^"'"。\n]+?)["'"]?\s*$/i,
    /将.*?(?:content|内容).*?(?:改成|为|成|to|，改成|，为)\s*["'"]?([^"'"。\n]+?)["'"]?\s*$/i,
    /content.*?["'"](.*?)["'"]/i,
    /内容.*?["'"](.*?)["'"]/i,
    /コンテンツ.*?["'"](.*?)["'"]/i,
  ];

  for (const pattern of contentPatterns) {
    const match = instruction.match(pattern);
    if (match && match[1]) {
      const newContent = match[1].trim();
      modifications.push({
        type: 'replace',
        content: newContent,
      });
      console.log('✅ Detected content change:', newContent);
      console.log('   Pattern matched:', pattern);
      break;
    }
  }

  const deletePatterns = [
    /删除\s*第?\s*(\d+)\s*段/i,
    /删掉\s*第?\s*(\d+)\s*段/i,
    /delete\s+paragraph\s+(\d+)/i,
    /remove\s+paragraph\s+(\d+)/i,
  ];

  for (const pattern of deletePatterns) {
    const match = instruction.match(pattern);
    if (match && match[1]) {
      const paragraphIndex = parseInt(match[1]) - 1;
      modifications.push({
        type: 'delete',
        paragraphIndex,
      });
      console.log('✅ Detected delete operation for paragraph:', paragraphIndex + 1);
      break;
    }
  }

  const replaceParagraphPatterns = [
    /(?:将|把)\s*第?\s*(\d+)\s*段.*?(?:改为|改成|修改为)\s*[：:]\s*(.+?)$/i,
    /(?:修改|replace)\s*第?\s*(\d+)\s*段.*?(?:为|to|成)\s*[：:]?\s*(.+?)$/i,
  ];

  for (const pattern of replaceParagraphPatterns) {
    const match = instruction.match(pattern);
    if (match && match[1] && match[2]) {
      const paragraphIndex = parseInt(match[1]) - 1;
      const newContent = match[2].trim();
      modifications.push({
        type: 'replace_paragraph',
        paragraphIndex,
        content: newContent,
      });
      console.log('✅ Detected replace paragraph operation:', paragraphIndex + 1, 'with:', newContent.substring(0, 50));
      break;
    }
  }

  const insertPatterns = [
    /在\s*第?\s*(\d+)\s*段\s*(?:插入|添加)\s*(.+?)$/i,
    /insert\s+(?:at|in)\s+paragraph\s+(\d+)\s*[：:]?\s*(.+?)$/i,
  ];

  for (const pattern of insertPatterns) {
    const match = instruction.match(pattern);
    if (match && match[1]) {
      const position = parseInt(match[1]) - 1;
      const topicMatch = match[2]?.match(/(?:关于|about)\s*([^的。,，\n]+)/i);
      const topic = topicMatch ? topicMatch[1].trim() : '';
      
      const defaultContent = language === 'Chinese'
        ? topic 
          ? `关于${topic}的内容：\n\n这是插入的新段落，讨论${topic}的相关内容。`
          : '这是插入的新段落内容。'
        : topic
          ? `About ${topic}:\n\nThis is the inserted paragraph discussing ${topic}.`
          : 'This is the inserted paragraph content.';
      
      modifications.push({
        type: 'insert',
        position,
        content: defaultContent,
      });
      console.log('✅ Detected insert operation at position:', position + 1, 'with topic:', topic || 'none');
      break;
    }
  }

  const addSectionPatterns = [
    /添加.*?(?:章节|section).*?标题.*?[是为]?\s*["'"]?([^"'"，。,\n]+?)["'"]?\s*[，,]?\s*内容.*?[是为]?\s*(.+?)$/i,
    /add.*?section.*?(?:title|heading).*?["'"]?([^"'"，。,\n]+?)["'"]?\s*[，,]?\s*(?:content|about)\s*(.+?)$/i,
  ];

  for (const pattern of addSectionPatterns) {
    const match = instruction.match(pattern);
    if (match && match[1]) {
      const sectionTitle = match[1].trim();
      const contentHint = match[2]?.trim() || '';
      
      const defaultContent = language === 'Chinese'
        ? `## ${sectionTitle}\n\n${contentHint || `这是关于${sectionTitle}的详细内容。`}\n\n本节将深入探讨相关的技术细节和实践经验。`
        : `## ${sectionTitle}\n\n${contentHint || `This section covers ${sectionTitle} in detail.`}\n\nWe will explore the technical details and practical experience.`;
      
      modifications.push({
        type: 'add_section',
        content: defaultContent,
      });
      console.log('✅ Detected add section operation with title:', sectionTitle);
      break;
    }
  }

  if (modifications.length === 0) {
    const hasAddKeyword = lowerInstruction.includes('add') || 
                          lowerInstruction.includes('添加') ||
                          lowerInstruction.includes('追加') || 
                          lowerInstruction.includes('append') ||
                          lowerInstruction.includes('末尾') ||
                          lowerInstruction.includes('更多');
    
    if (hasAddKeyword) {
      const topic = extractTopic(instruction);
      
      // Generate paragraph content (not full article) based on topic
      const defaultContent = topic 
        ? generateParagraphContent(topic, language)
        : language === 'Chinese'
          ? '这是根据您的指令添加的新内容。\n\n本节将为您的文章增加更多深度和细节。我们建议您根据具体需求进一步编辑和扩展此内容，以确保文章的完整性和专业性。\n\n您可以添加更多事实、数据、案例研究或个人见解，使内容更加丰富和有价值。'
          : 'This is new content added based on your instruction.\n\nThis section will add more depth and detail to your article. We recommend that you further edit and expand this content according to your specific needs to ensure the completeness and professionalism of the article.\n\nYou can add more facts, data, case studies, or personal insights to make the content richer and more valuable.';
      
      modifications.push({
        type: 'append',
        content: defaultContent,
      });
      console.log('✅ Detected add operation, using append with topic:', topic || 'none');
    } else {
      console.log('⚠️ No specific operation detected');
    }
  }

  console.log('Generated modifications:', modifications);

  const explanationText = language === 'Chinese'
    ? modifications.length > 0
      ? `已成功应用您的修改。${modifications.some(m => m.type === 'update_title') ? '标题已更新。' : ''}${modifications.some(m => m.type === 'append') ? '内容已添加。' : ''}`
      : '已根据您的指令进行修改。'
    : modifications.length > 0
      ? `Modifications applied successfully. ${modifications.some(m => m.type === 'update_title') ? 'Title updated. ' : ''}${modifications.some(m => m.type === 'append') ? 'Content added. ' : ''}`
      : 'Modifications applied based on your instruction.';

  return {
    modifications,
    explanation: explanationText,
  };
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const userId = getUserIdFromRequest(session?.user?.id, request);

    if (!session && !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: AIModifyRequest = await request.json();
    const { postId, currentContent, currentTitle, instruction } = body;

    if (!postId || !instruction) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    if (instruction.trim().length < 5) {
      return NextResponse.json(
        { error: 'Instruction too short', details: 'Please provide a more detailed instruction (at least 5 characters).' },
        { status: 400 }
      );
    }

    const language = detectLanguage(instruction);
    const analyzer = new DocumentAnalyzer();
    const documentStructure = analyzer.analyze(currentContent || []);

    // Process smart instruction (handles references to previous suggestions)
    const processedInstruction = await processSmartInstruction({
      instruction: instruction.trim(),
      chatHistory: body.chatHistory,
      currentContent: currentContent || [],
      currentTitle: currentTitle || 'Untitled',
      userId,
      modelId: body.modelId,
    });

    console.log('📝 Original instruction:', instruction.trim());
    if (processedInstruction !== instruction.trim()) {
      console.log('✨ Smart instruction:', processedInstruction);
    }

    const result = await generateModifications({
      currentContent: currentContent || [],
      currentTitle: currentTitle || 'Untitled',
      instruction: processedInstruction,
      language,
      userId,
      documentStructure,
      modelId: body.modelId,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('=== AI Modify API Error ===');
    console.error('Error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');

    return NextResponse.json(
      {
        error: 'Failed to generate modifications',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
        stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
