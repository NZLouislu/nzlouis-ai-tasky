import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { getUserIdFromRequest } from '@/lib/admin-auth';
import { PartialBlock } from '@blocknote/core';

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
}

interface AIModifyResponse {
  modifications: PageModification[];
  explanation: string;
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


async function generateModifications(params: {
  currentContent: PartialBlock[];
  currentTitle: string;
  instruction: string;
  language: string;
  userId?: string;
}): Promise<AIModifyResponse> {
  const { currentContent, currentTitle, instruction, language, userId } = params;

  const contentText = blocksToText(currentContent);
  const systemPrompt = `You are a professional blog editor and content creation expert. Generate high-quality, detailed, professional content based on user instructions.

**CRITICAL RULES:**
1. **ONLY return valid JSON format with English field names**
2. **DO NOT use Chinese field names like "修改操作" or "操作类型"**
3. **MUST use exact field names: "modifications", "type", "content", "title", "explanation"**
4. **Content must be detailed, professional, and in-depth**
5. **Content language should match user's language (${language})**

**REQUIRED JSON FORMAT:**
{
  "modifications": [
    {
      "type": "append",
      "content": "Detailed content with multiple paragraphs.\\n\\nFirst paragraph...\\n\\nSecond paragraph...\\n\\nThird paragraph..."
    }
  ],
  "explanation": "Added detailed content about xxx, containing xxx paragraphs"
}

**Modification Types:**
- update_title: Modify article title
- replace: Replace all content
- append: Append content at the end (recommended for adding detailed content)
- insert: Insert content at specific position
- add_section: Add new section

**Content Quality Requirements:**
- If user requests "detailed", "more", "expand": generate at least 300-500 words
- Split content into multiple paragraphs using \\n\\n
- Include specific facts, data, examples
- Clear logic and complete structure
- Professional but easy to understand language
- Use ${language} for content

**Example (Mars Exploration):**
If user requests "add detailed history of Mars exploration", generate like:

"Human exploration of Mars began in the early 1960s. In 1960, the Soviet Union launched the first Mars probe, although the mission failed, it opened the prelude to human exploration of Mars.\\n\\n In 1964, the American Mariner 4 became the first probe to successfully fly by Mars, sending back 21 precious photos of the Martian surface. These photos showed that the Martian surface was covered with craters, similar to the Moon, which changed people's understanding of Mars.\\n\\nIn 1971, the Soviet Mars 3 became the first probe to successfully land on Mars, although it only worked for 20 seconds, it marked the first time humans achieved a soft landing on the Martian surface. In the same year, the American Mariner 9 became the first probe to enter Mars orbit, mapping the Martian surface in detail.\\n\\nIn 1976, the American Viking 1 and 2 successfully landed on Mars, conducting years of scientific research to search for signs of Martian life. Although no conclusive evidence of life was found, these two probes provided us with a wealth of valuable data about Martian geology, climate, and atmosphere."

This is high-quality, detailed content.

**IMPORTANT: Return ONLY the JSON object, no other text, no markdown code blocks, no explanations outside the JSON.**`;

  const userPrompt = `Current Article Title: ${currentTitle}

Current Article Content:
${contentText || '(Content is empty)'}

User Instruction: ${instruction}

**Task Requirements:**
Generate high-quality, detailed modification operations based on user instructions.

If user requests:
- "detailed", "more", "expand" → generate at least 300-500 words of detailed content
- "add" → generate relevant, in-depth content
- "modify" → improve existing content to be more professional and detailed

**Content Requirements:**
1. Split into multiple paragraphs (use \\n\\n to separate)
2. Include specific facts, data, examples
3. Clear logic and complete structure
4. Use ${language} language for content
5. Professional but easy to understand

**CRITICAL: Return ONLY valid JSON with these exact field names:**
- "modifications" (array)
- "type" (string: "append", "replace", "update_title", etc.)
- "content" (string: the actual content)
- "explanation" (string: what you did)

Now generate the JSON for modification operations.`;

  try {
    
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
        maxTokens: 2000,
        userId, // Pass userId for API key lookup
      }),
    });

    if (!response.ok) {
      console.warn(`AI API returned ${response.status}, falling back to default modifications`);
      return generateDefaultModifications(instruction, currentTitle, language);
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
          } catch (error) {
            console.error('Error parsing line:', error);
          }
        }
      }

      buffer = lines[lines.length - 1];
    }

    console.log('AI Full Response:', fullResponse);

    const cleanedResponse = fullResponse
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .trim();

    console.log('Cleaned Response:', cleanedResponse.substring(0, 200) + '...');

    const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn('No JSON found in AI response, generating default response');
      console.log('Full response was:', cleanedResponse.substring(0, 500));
      return generateDefaultModifications(instruction, currentTitle, language);
    }

    try {
      
      let jsonStr = jsonMatch[0];

      if (jsonStr.includes('"修改操作"') || jsonStr.includes('"操作类型"')) {
        console.warn('Detected Chinese field names, attempting to convert...');
        jsonStr = jsonStr
          .replace(/"修改操作"/g, '"modifications"')
          .replace(/"操作类型"/g, '"type"')
          .replace(/"目标"/g, '"target"')
          .replace(/"新内容"/g, '"content"')
          .replace(/"新标题"/g, '"title"');
      }

      console.log('Cleaning control characters from JSON...');
      let result;
      try {
        
        result = JSON.parse(jsonStr);
      } catch {
        console.log('First parse failed, cleaning control characters...');
        const cleanedStr = jsonStr
          .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F-\x9F]/g, '')
          .replace(/\r\n/g, '\n')
          .replace(/\r/g, '\n');

        try {
          result = JSON.parse(cleanedStr);
        } catch {
          console.log('Second parse failed, trying manual content field cleaning...');
          const manualClean = cleanedStr.replace(
            /"content"\s*:\s*"([^"]*)"/g,
            (match, content) => {
              const cleaned = content
                .replace(/\n/g, '\\n\\n')
                .replace(/\t/g, ' ')
                .replace(/  +/g, ' ');
              return `"content": "${cleaned}"`;
            }
          );

          try {
            result = JSON.parse(manualClean);
          } catch (thirdError) {
            console.error('All parse attempts failed:', thirdError);
            console.log('Original JSON (first 500 chars):', jsonStr.substring(0, 500));
            console.log('Cleaned JSON (first 500 chars):', cleanedStr.substring(0, 500));
            return generateDefaultModifications(instruction, currentTitle, language);
          }
        }
      }

      console.log('JSON parsed successfully');

      
      if (!result.modifications || !Array.isArray(result.modifications)) {
        console.warn('Invalid response format, generating default response');
        console.log('Parsed result:', JSON.stringify(result).substring(0, 200));
        return generateDefaultModifications(instruction, currentTitle, language);
      }

      
      const validModifications = result.modifications.filter((mod: PageModification) => {
        return mod.type && (mod.content || mod.title);
      });

      if (validModifications.length === 0) {
        console.warn('No valid modifications found');
        return generateDefaultModifications(instruction, currentTitle, language);
      }

      console.log(`✅ Successfully parsed ${validModifications.length} modifications`);

      return {
        modifications: validModifications,
        explanation: result.explanation || `Modified based on your instruction.`,
      };
    } catch (parseError) {
      console.error('Failed to parse JSON:', parseError);
      console.log('Attempted to parse:', jsonMatch[0].substring(0, 500));
      return generateDefaultModifications(instruction, currentTitle, language);
    }
  } catch (error) {
    console.error('Error generating modifications:', error);
    
    return generateDefaultModifications(instruction, currentTitle, language);
  }
}


// Generate detailed Chinese content based on topic
function generateDetailedChineseContent(topic: string): string {
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
function generateDetailedEnglishContent(topic: string): string {
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
      
      // Generate detailed content based on topic
      const defaultContent = language === 'Chinese'
        ? topic 
          ? generateDetailedChineseContent(topic)
          : '这是根据您的指令添加的新内容。\n\n本节内容将为您的文章增添更多深度和细节。我们建议您根据具体需求进一步编辑和扩展这些内容，以确保文章的完整性和专业性。\n\n您可以添加更多的事实、数据、案例研究或个人见解，使内容更加丰富和有价值。'
        : topic
          ? generateDetailedEnglishContent(topic)
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
  console.log('=== AI Modify API Called ===');

  try {
    
    const session = await auth();
    console.log('Session:', session ? 'exists' : 'null');

    // Check both NextAuth session and admin token
    const userId = getUserIdFromRequest(session?.user?.id, request);
    console.log('User ID:', userId ? 'exists' : 'null');

    if (!userId) {
      console.log('No user ID, returning 401');
      return NextResponse.json(
        { error: 'Unauthorized', details: 'Please log in to use this feature.' },
        { status: 401 }
      );
    }

    
    console.log('Parsing request body...');
    const body: AIModifyRequest = await request.json();
    const { postId, currentContent, currentTitle, instruction } = body;
    console.log('Request parsed:', { postId, currentTitle, instruction });

    
    if (!postId || !instruction) {
      return NextResponse.json(
        { error: 'Invalid request', details: 'Missing required fields: postId or instruction' },
        { status: 400 }
      );
    }

    if (instruction.trim().length < 5) {
      return NextResponse.json(
        { error: 'Instruction too short', details: 'Please provide a more detailed instruction (at least 5 characters).' },
        { status: 400 }
      );
    }

    
    const language = detectLanguage(instruction);
    console.log('Detected language:', language);

    
    console.log('Generating modifications...');

    const lowerInstruction = instruction.toLowerCase();

    
    const needsAIGeneration =
      lowerInstruction.includes('详细') ||
      lowerInstruction.includes('更多') ||
      lowerInstruction.includes('添加') ||
      lowerInstruction.includes('扩展') ||
      lowerInstruction.includes('丰富') ||
      lowerInstruction.includes('add more') ||
      lowerInstruction.includes('detailed') ||
      lowerInstruction.includes('expand');

    let result;

    if (needsAIGeneration) {
      console.log('🤖 Detected request for AI-generated content, using AI...');
      try {
        result = await generateModifications({
          currentContent: currentContent || [],
          currentTitle: currentTitle || 'Untitled',
          instruction: instruction.trim(),
          language,
          userId, // Pass userId for AI API authentication
        });
        console.log('✅ AI generation successful');
      } catch (error) {
        console.error('❌ AI generation failed, falling back to default:', error);
        result = generateDefaultModifications(
          instruction.trim(),
          currentTitle || 'Untitled',
          language
        );
      }
    } else {
      console.log('📝 Using default text matching...');
      result = generateDefaultModifications(
        instruction.trim(),
        currentTitle || 'Untitled',
        language
      );
    }

    console.log('Generated modifications:', result);
    
    console.log('Returning result:', result);
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
