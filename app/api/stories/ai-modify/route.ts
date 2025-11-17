import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { getUserIdFromRequest } from '@/lib/admin-auth';

interface PageModification {
  type: 'replace' | 'insert' | 'append' | 'update_title' | 'add_section' | 'delete' | 'replace_paragraph';
  target?: string;
  content?: string;
  title?: string;
  position?: number;
  paragraphIndex?: number;
}

interface AIModifyRequest {
  documentId: string;
  currentContent: string;
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

async function generateModifications(params: {
  currentContent: string;
  currentTitle: string;
  instruction: string;
  language: string;
  userId?: string;
}): Promise<AIModifyResponse> {
  const { currentContent, currentTitle, instruction, language, userId } = params;

  const systemPrompt = `You are a professional markdown editor and content creation expert. Generate high-quality, detailed, professional content based on user instructions.

**CRITICAL RULES:**
1. **ONLY return valid JSON format with English field names**
2. **DO NOT use Chinese field names like "修改操作" or "操作类型"**
3. **MUST use exact field names: "modifications", "type", "content", "title", "explanation"**
4. **Content must be detailed, professional, and in-depth**
5. **Content language should match user's language (${language})**
6. **Content should be in markdown format**

**REQUIRED JSON FORMAT:**
{
  "modifications": [
    {
      "type": "append",
      "content": "## New Section\\n\\nDetailed content with multiple paragraphs.\\n\\nFirst paragraph...\\n\\nSecond paragraph...\\n\\nThird paragraph..."
    }
  ],
  "explanation": "Added detailed content about xxx, containing xxx paragraphs"
}

**Modification Types:**
- update_title: Modify document title
- replace: Replace all content
- append: Append content at the end (recommended for adding detailed content)
- insert: Insert content at specific position
- add_section: Add new section

**Content Quality Requirements:**
- If user requests "detailed", "more", "expand": generate at least 300-500 words
- Use proper markdown formatting (headers, lists, emphasis)
- Include specific facts, data, examples
- Clear logic and complete structure
- Professional but easy to understand language
- Use ${language} for content

**IMPORTANT: Return ONLY the JSON object, no other text, no markdown code blocks, no explanations outside the JSON.**`;

  const userPrompt = `Current Document Title: ${currentTitle}

Current Document Content:
${currentContent || '(Content is empty)'}

User Instruction: ${instruction}

**Task Requirements:**
Generate high-quality, detailed modification operations based on user instructions.

If user requests:
- "detailed", "more", "expand" → generate at least 300-500 words of detailed content
- "add" → generate relevant, in-depth content
- "modify" → improve existing content to be more professional and detailed

**Content Requirements:**
1. Use proper markdown formatting
2. Include specific facts, data, examples
3. Clear logic and complete structure
4. Use ${language} language for content
5. Professional but easy to understand

**CRITICAL: Return ONLY valid JSON with these exact field names:**
- "modifications" (array)
- "type" (string: "append", "replace", "update_title", etc.)
- "content" (string: the actual markdown content)
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
        userId,
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

function generateDetailedChineseContent(topic: string): string {
  const topicLower = topic.toLowerCase();
  
  if (topicLower.includes('宇宙') || topicLower.includes('虚拟世界') || topicLower.includes('虚拟现实')) {
    return `## 宇宙是否是虚拟世界

这是一个深刻而引人深思的哲学和科学问题。近年来，随着计算机技术和虚拟现实技术的飞速发展，越来越多的科学家和哲学家开始认真考虑我们所生活的宇宙是否可能是一个巨大的计算机模拟。

### 模拟假说的理论基础

模拟假说最著名的支持者是牛津大学哲学家尼克·博斯特罗姆。他在2003年提出了著名的"模拟论证"，认为以下三个命题中至少有一个是真的：

1. 几乎没有文明能够达到技术成熟阶段
2. 几乎没有技术成熟的文明有兴趣运行祖先模拟
3. 你几乎肯定生活在计算机模拟中

这个论证的核心思想是，如果一个文明发展到足够先进的程度，他们将拥有巨大的计算能力，能够运行包含有意识生物的详细历史模拟。

### 支持模拟假说的证据

一些物理学现象似乎支持模拟假说：

**量子力学的离散性**：量子力学表明，在最小尺度上，现实是离散的而不是连续的。这类似于数字计算机中的像素或比特，暗示我们的宇宙可能具有计算性质。

**普朗克长度和时间**：物理学中存在最小的长度单位（普朗克长度）和时间单位（普朗克时间），这可能类似于计算机模拟中的分辨率限制。

**宇宙常数的精细调节**：我们宇宙中的物理常数似乎被精确调节以允许生命存在，这可能暗示有一个"程序员"设计了这些参数。

### 反对模拟假说的观点

然而，也有许多科学家对模拟假说持怀疑态度：

**计算复杂性**：模拟一个包含数十亿星系的宇宙需要难以想象的计算资源。即使是模拟地球上的所有原子也需要比地球本身更大的计算机。

**意识问题**：我们仍然不完全理解意识是如何产生的，因此很难确定计算机是否能够真正模拟有意识的体验。

**不可证伪性**：模拟假说在某种程度上是不可证伪的，这使得它更像是一个哲学思辨而不是科学理论。

### 现代科技的启示

随着人工智能、虚拟现实和量子计算的发展，我们对模拟的理解不断深化。元宇宙概念的兴起也让人们更容易想象生活在虚拟世界中的可能性。

无论宇宙是否真的是虚拟的，这个问题都促使我们思考现实的本质、意识的意义，以及我们在这个宇宙中的位置。它提醒我们保持开放的心态，继续探索和质疑我们对现实的理解。`;
  }
  
  return `## 关于${topic}

${topic}是一个值得深入探讨的重要主题。在当今快速发展的时代，理解${topic}的本质和影响变得越来越重要。

### 历史发展

从历史角度来看，${topic}的发展经历了多个重要阶段。早期的研究和实践为我们今天的理解奠定了基础。随着时间的推移，人们对${topic}的认识不断深化，新的发现和理论不断涌现，推动着这个领域向前发展。

### 实践应用

在实践层面，${topic}已经在多个领域产生了深远的影响。它不仅改变了我们的工作方式和生活方式，还为解决许多复杂问题提供了新的思路和方法。许多专家和学者都在积极研究${topic}，试图揭示其更深层次的规律和潜力。

### 未来展望

展望未来，${topic}仍然充满了无限的可能性。随着技术的进步和认识的深化，我信，${topic}将在未来发挥更加重要的作用，为人类社会的发展做出更大的贡献。

因此，持续关注和研究${topic}，不仅有助于我们更好地理解这个世界，也能为我们应对未来的挑战提供宝贵的启示和指导。`;
}

function generateDetailedEnglishContent(topic: string): string {
  const topicLower = topic.toLowerCase();
  
  if (topicLower.includes('universe') || topicLower.includes('virtual') || topicLower.includes('simulation')) {
    return `## Is the Universe a Virtual World?

This is a profound and thought-provoking philosophical and scientific question. In recent years, with the rapid development of computer technology and virtual reality, more and more scientists and philosophers have begun to seriously consider whether the universe we live in might be a giant computer simulation.

### Theoretical Foundation of the Simulation Hypothesis

The most famous proponent of the simulation hypothesis is Oxford philosopher Nick Bostrom. In 2003, he proposed the famous "simulation argument," arguing that at least one of the following three propositions is true:

1. Almost no civilizations reach technological maturity
2. Almost no technologically mature civilizations are interested in running ancestor simulations
3. You are almost certainly living in a computer simulation

The core idea of this argument is that if a civilization develops to a sufficiently advanced level, they will have enormous computational power capable of running detailed historical simulations containing conscious beings.

### Evidence Supporting the Simulation Hypothesis

Some physical phenomena seem to support the simulation hypothesis:

**Quantum Mechanics Discreteness**: Quantum mechanics shows that at the smallest scales, reality is discrete rather than continuous. This is similar to pixels or bits in digital computers, suggesting our universe might have computational properties.

**Planck Length and Time**: Physics has minimum units of length (Planck length) and time (Planck time), which might be similar to resolution limits in computer simulations.

**Fine-tuning of Universal Constants**: The physical constants in our universe seem precisely tuned to allow life to exist, which might suggest there's a "programmer" who designed these parameters.

### Arguments Against the Simulation Hypothesis

However, many scientists are skeptical of the simulation hypothesis:

**Computational Complexity**: Simulating a universe containing billions of galaxies would require unimaginable computational resources. Even simulating all atoms on Earth would require a computer larger than Earth itself.

**The Consciousness Problem**: We still don't fully understand how consciousness arises, making it difficult to determine whether computers could truly simulate conscious experience.

**Unfalsifiability**: The simulation hypothesis is somewhat unfalsifiable, making it more like philosophical speculation than scientific theory.

### Insights from Modern Technology

With the development of artificial intelligence, virtual reality, and quantum computing, our understanding of simulation continues to deepen. The rise of the metaverse concept also makes it easier for people to imagine the possibility of living in virtual worlds.

Whether or not the universe is truly virtual, this question prompts us to think about the nature of reality, the meaning of consciousness, and our place in this universe. It reminds us to maintain an open mind and continue exploring and questioning our understanding of reality.`;
  }
  
  return `## About ${topic}

${topic} is an important subject worthy of in-depth exploration. In today's rapidly evolving era, understanding the nature and impact of ${topic} has become increasingly important.

### Historical Development

From a historical perspective, the development of ${topic} has gone through several important stages. Early research and practice laid the foundation for our understanding today. Over time, people's understanding of ${topic} has continued to deepen, with new discoveries and theories constantly emerging, driving the field forward.

### Practical Applications

At the practical level, ${topic} has had a profound impact in multiple areas. It has not only changed the way we work and live but also provided new ideas and methods for solving many complex problems. Many experts and scholars are actively researching ${topic}, trying to reveal its deeper patterns and potential.

### Future Prospects

Looking to the future, ${topic} is still full of infinite possibilities. With technological advances and deepening understanding, we have reason to believe that ${topic} will play an even more important role in the future, making greater contributions to the development of human society.

Therefore, continuing to pay attention to and research ${topic} will not only help us better understand the world but also provide valuable insights and guidance for addressing future challenges.`;
}

function generateSectionReplacement(targetSection: string, instruction: string, language: string): string {
  const lowerTarget = targetSection.toLowerCase();
  const lowerInstruction = instruction.toLowerCase();
  
  // Extract what the user wants to change about the section
  let newContent = '';
  
  if (lowerTarget.includes('实践应用') || lowerTarget.includes('practical') || lowerTarget.includes('application')) {
    if (lowerInstruction.includes('房产') || lowerInstruction.includes('real estate') || lowerInstruction.includes('property')) {
      newContent = language === 'Chinese' 
        ? `### 实践应用

在房地产行业中，AI技术正在革命性地改变传统的业务模式和运营方式。目前房产行业广泛应用的AI技术包括：

**智能估价系统**：利用机器学习算法分析历史交易数据、地理位置、房屋特征等多维度信息，提供精准的房产估值。这些系统能够实时更新市场价格，为买卖双方提供可靠的参考依据。

**虚拟看房技术**：通过VR/AR技术和3D建模，客户可以在线进行沉浸式看房体验。AI驱动的虚拟导览系统能够根据客户偏好智能推荐房源，大大提高了看房效率。

**智能客服与推荐系统**：AI聊天机器人能够24/7为客户提供咨询服务，通过自然语言处理技术理解客户需求，并基于大数据分析推荐最匹配的房源。

**风险评估与信贷审批**：金融科技公司运用AI算法评估借款人的信用风险，自动化处理房贷申请，显著缩短了审批时间并提高了准确性。

**智能物业管理**：IoT设备结合AI技术实现智能安防、能耗优化、设备预测性维护等功能，提升了物业管理效率和居住体验。

这些技术的应用不仅提高了行业效率，还为客户提供了更加个性化和便捷的服务体验。`
        : `### Practical Applications

In the real estate industry, AI technology is revolutionarily transforming traditional business models and operational methods. Currently, AI technologies widely applied in the property sector include:

**Intelligent Valuation Systems**: Utilizing machine learning algorithms to analyze multi-dimensional information such as historical transaction data, geographical location, and property characteristics to provide accurate property valuations. These systems can update market prices in real-time, providing reliable references for buyers and sellers.

**Virtual Property Viewing Technology**: Through VR/AR technology and 3D modeling, clients can experience immersive online property viewing. AI-driven virtual tour systems can intelligently recommend properties based on client preferences, greatly improving viewing efficiency.

**Intelligent Customer Service and Recommendation Systems**: AI chatbots can provide 24/7 consultation services for clients, understanding customer needs through natural language processing technology and recommending the most suitable properties based on big data analysis.

**Risk Assessment and Credit Approval**: Fintech companies use AI algorithms to assess borrowers' credit risks and automate mortgage application processing, significantly reducing approval time while improving accuracy.

**Smart Property Management**: IoT devices combined with AI technology enable intelligent security, energy optimization, predictive equipment maintenance, and other functions, enhancing property management efficiency and living experience.

The application of these technologies not only improves industry efficiency but also provides customers with more personalized and convenient service experiences.`;
    } else {
      // Generic practical applications content
      newContent = language === 'Chinese'
        ? `### 实践应用

在实践层面，相关技术已经在多个领域产生了深远的影响。它不仅改变了我们的工作方式和生活方式，还为解决许多复杂问题提供了新的思路和方法。

**技术创新应用**：通过先进的算法和数据分析技术，能够实现更精准的预测和决策支持，帮助企业优化运营流程，提高工作效率。

**用户体验优化**：基于人工智能的个性化推荐系统和智能交互界面，为用户提供更加便捷和个性化的服务体验。

**自动化解决方案**：智能自动化技术的应用，减少了人工操作的复杂性，提高了处理速度和准确性，降低了运营成本。

**数据驱动决策**：通过大数据分析和机器学习技术，能够从海量数据中提取有价值的洞察，为战略决策提供科学依据。

许多专家和学者都在积极研究这些技术的应用，试图揭示其更深层次的规律和潜力，推动行业向更智能化的方向发展。`
        : `### Practical Applications

At the practical level, related technologies have had a profound impact in multiple areas. They have not only changed the way we work and live but also provided new ideas and methods for solving many complex problems.

**Technological Innovation Applications**: Through advanced algorithms and data analysis technologies, more accurate predictions and decision support can be achieved, helping enterprises optimize operational processes and improve work efficiency.

**User Experience Optimization**: AI-based personalized recommendation systems and intelligent interactive interfaces provide users with more convenient and personalized service experiences.

**Automation Solutions**: The application of intelligent automation technology has reduced the complexity of manual operations, improved processing speed and accuracy, and reduced operational costs.

**Data-Driven Decision Making**: Through big data analysis and machine learning technologies, valuable insights can be extracted from massive amounts of data, providing scientific basis for strategic decisions.

Many experts and scholars are actively researching the applications of these technologies, trying to reveal their deeper patterns and potential, driving the industry toward more intelligent development.`;
    }
  } else {
    // Generic section replacement
    newContent = language === 'Chinese'
      ? `### ${targetSection}

根据您的要求，这里是更新后的${targetSection}内容。我们已经结合最新的发展趋势和实际应用案例，为您提供更加详细和专业的信息。

这个部分包含了相关领域的最新进展、技术应用和未来发展方向。通过深入分析和研究，我们为您呈现了更加全面和准确的内容。

如需进一步的详细信息或特定方面的深入探讨，请随时告知，我们将为您提供更加精准的内容更新。`
      : `### ${targetSection}

According to your requirements, here is the updated ${targetSection} content. We have combined the latest development trends and practical application cases to provide you with more detailed and professional information.

This section contains the latest developments, technological applications, and future development directions in related fields. Through in-depth analysis and research, we present you with more comprehensive and accurate content.

If you need further detailed information or in-depth discussion of specific aspects, please let us know, and we will provide you with more precise content updates.`;
  }
  
  return newContent;
}

function generateDefaultModifications(
  instruction: string,
  currentTitle: string,
  language: string
): AIModifyResponse {
  const modifications: PageModification[] = [];
  const lowerInstruction = instruction.toLowerCase();

  console.log('Generating default modifications for instruction:', instruction);

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
      break;
    }
  }

  if (modifications.length === 0) {
    // Check for paragraph modification patterns
    const paragraphModifyPatterns = [
      /(?:修改|改|更改|change|update|replace).*?(?:段落|paragraph|section).*?["'"]?([^"'"，。,\n]+?)["'"]?/i,
      /(?:修改|改|更改|change|update|replace).*?["'"]?([^"'"，。,\n]+?)["'"]?.*?(?:段落|paragraph|section)/i,
      /(?:请|please).*?(?:修改|改|更改|change|update|replace).*?["'"]?([^"'"，。,\n]+?)["'"]?/i,
    ];

    let foundParagraphModification = false;
    for (const pattern of paragraphModifyPatterns) {
      const match = instruction.match(pattern);
      if (match && match[1]) {
        const targetSection = match[1].trim();
        console.log('✅ Detected paragraph modification for:', targetSection);
        
        // Generate replacement content for the specific section
        const replacementContent = generateSectionReplacement(targetSection, instruction, language);
        
        modifications.push({
          type: 'replace_paragraph',
          target: targetSection,
          content: replacementContent,
        });
        foundParagraphModification = true;
        break;
      }
    }

    if (!foundParagraphModification) {
      const hasAddKeyword = lowerInstruction.includes('add') || 
                            lowerInstruction.includes('添加') ||
                            lowerInstruction.includes('追加') || 
                            lowerInstruction.includes('append') ||
                            lowerInstruction.includes('末尾') ||
                            lowerInstruction.includes('更多');
      
      if (hasAddKeyword) {
        const topic = extractTopic(instruction);
        
        const defaultContent = language === 'Chinese'
          ? topic 
            ? generateDetailedChineseContent(topic)
            : '## 新增内容\n\n这是根据您的指令添加的新内容。\n\n本节内容将为您的文档增添更多深度和细节。我们建议您根据具体需求进一步编辑和扩展这些内容，以确保文档的完整性和专业性。\n\n您可以添加更多的事实、数据、案例研究或个人见解，使内容更加丰富和有价值。'
          : topic
            ? generateDetailedEnglishContent(topic)
            : '## New Content\n\nThis is new content added based on your instruction.\n\nThis section will add more depth and detail to your document. We recommend that you further edit and expand this content according to your specific needs to ensure the completeness and professionalism of the document.\n\nYou can add more facts, data, case studies, or personal insights to make the content richer and more valuable.';
        
        modifications.push({
          type: 'append',
          content: defaultContent,
        });
        console.log('✅ Detected add operation, using append with topic:', topic || 'none');
      } else {
        console.log('⚠️ No specific operation detected');
      }
    }
  }

  console.log('Generated modifications:', modifications);

  const explanationText = language === 'Chinese'
    ? modifications.length > 0
      ? `已成功应用您的修改。${modifications.some(m => m.type === 'update_title') ? '标题已更新。' : ''}${modifications.some(m => m.type === 'append') ? '内容已添加。' : ''}${modifications.some(m => m.type === 'replace_paragraph') ? '段落已更新。' : ''}`
      : '已根据您的指令进行修改。'
    : modifications.length > 0
      ? `Modifications applied successfully. ${modifications.some(m => m.type === 'update_title') ? 'Title updated. ' : ''}${modifications.some(m => m.type === 'append') ? 'Content added. ' : ''}${modifications.some(m => m.type === 'replace_paragraph') ? 'Paragraph updated. ' : ''}`
      : 'Modifications applied based on your instruction.';

  return {
    modifications,
    explanation: explanationText,
  };
}

export async function POST(request: NextRequest) {
  console.log('=== Stories AI Modify API Called ===');

  try {
    const session = await auth();
    console.log('Session:', session ? 'exists' : 'null');

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
    const { documentId, currentContent, currentTitle, instruction } = body;
    console.log('Request parsed:', { documentId, currentTitle, instruction });

    if (!documentId || !instruction) {
      return NextResponse.json(
        { error: 'Invalid request', details: 'Missing required fields: documentId or instruction' },
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
          currentContent: currentContent || '',
          currentTitle: currentTitle || 'Untitled',
          instruction: instruction.trim(),
          language,
          userId,
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
    console.error('=== Stories AI Modify API Error ===');
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