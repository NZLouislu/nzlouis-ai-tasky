import { PartialBlock } from '@blocknote/core';
import { PlanningResult, SearchContext, GenerationResult } from './agentic-types';
import { WritingStyle } from './cache/redis-cache';

export class ContentGenerator {
  public async generate(
    planning: PlanningResult,
    searchContext: SearchContext | null,
    currentContent: PartialBlock[],
    userMessage: string,
    callLLM: (systemPrompt: string, userPrompt: string) => Promise<string>,
    writingStyle?: WritingStyle | null
  ): Promise<GenerationResult> {
    console.log('[Generation] Starting content generation...');
    
    const isChinese = /[\u4e00-\u9fa5]/.test(userMessage);
    console.log(`[Generation] Language detected: ${isChinese ? 'Chinese' : 'English'}`);
    
    try {
      const systemPrompt = this.buildGenerationSystemPrompt(writingStyle, planning.action_plan.estimated_words, isChinese);
      const userPrompt = this.buildGenerationUserPrompt(
        planning,
        searchContext,
        currentContent,
        userMessage,
        writingStyle,
        isChinese
      );

      console.log('[Generation] Calling LLM (Attempt 1 - JSON Mode)...');
      const response = await callLLM(systemPrompt, userPrompt);

      return this.parseGenerationResponse(response);
    } catch (error) {
      console.warn('[Generation] Standard generation failed, trying fallback...', error);
      
      try {
        console.log('[Generation] Calling LLM (Attempt 2 - Plain Text Mode)...');
        const fallbackResult = await this.generateFallbackContent(
          planning,
          searchContext,
          userMessage,
          callLLM,
          isChinese
        );
        return fallbackResult;
      } catch (fallbackError) {
        console.error('[Generation] Fallback generation failed:', fallbackError);
        
        console.log('[Generation] Using safety net content...');
        return this.generateSafetyNetContent(planning, searchContext, userMessage, isChinese);
      }
    }
  }

  private async generateFallbackContent(
    planning: PlanningResult,
    searchContext: SearchContext | null,
    userMessage: string,
    callLLM: (systemPrompt: string, userPrompt: string) => Promise<string>,
    isChinese: boolean
  ): Promise<GenerationResult> {
    const systemPrompt = isChinese 
      ? `你是一位专业的博客写作助手。
任务：根据用户的请求撰写高质量的博客内容。
要求：
1. 直接输出内容文本，不要包含JSON格式或代码块
2. 内容要专业、准确、有深度
3. 使用清晰的段落结构
4. 如果是关于某个主题的段落，请包含具体的事实和数据`
      : `You are a professional blog writing assistant.
Task: Write high-quality blog content based on the user's request.
Requirements:
1. Output ONLY the content text, no JSON or code blocks
2. Content should be professional, accurate, and in-depth
3. Use clear paragraph structure
4. Include specific facts and data when writing about a topic`;

    let content = "";

    try {
      console.log('[Generation] Fallback Attempt A (Direct Content Generation)...');

      const userPrompt = isChinese
        ? `请为博客文章撰写以下内容：

用户请求："${userMessage}"

${searchContext?.summary ? `参考资料：\n${searchContext.summary.slice(0, 1500)}\n\n` : ''}
要求：
- 字数约 ${planning.action_plan.estimated_words} 字
- 内容要专业、有深度
- 使用 ## 作为段落标题（如果需要）
- 直接输出内容，不要包含任何JSON格式`
        : `Please write the following content for a blog article:

User Request: "${userMessage}"

${searchContext?.summary ? `Reference Material:\n${searchContext.summary.slice(0, 1500)}\n\n` : ''}
Requirements:
- Target length: ~${planning.action_plan.estimated_words} words
- Content should be professional and in-depth
- Use ## for section titles if needed
- Output content directly, no JSON format`;

      const response = await callLLM(systemPrompt, userPrompt);
      
      if (response && response.trim().length > 20) {
        content = this.cleanGeneratedContent(response.trim());
        console.log('[Generation] Fallback A succeeded, content length:', content.length);
      }
    } catch (e) {
      console.warn('Fallback A failed:', e);
    }

    if (!content) {
      console.log('[Generation] Fallback Attempt B (Minimal Mode)...');
      try {
        const minimalPrompt = isChinese
          ? `请撰写一段关于"${userMessage}"的专业博客内容，约${planning.action_plan.estimated_words}字。直接输出内容，不要包含JSON。`
          : `Write a professional blog paragraph about: "${userMessage}". Target: ~${planning.action_plan.estimated_words} words. Output content only, no JSON.`;
        
        const response = await callLLM(systemPrompt, minimalPrompt);
        
        if (response && response.trim().length > 20) {
          content = this.cleanGeneratedContent(response.trim());
          console.log('[Generation] Fallback B succeeded, content length:', content.length);
        }
      } catch (e) {
        console.error('Fallback B failed:', e);
      }
    }

    if (!content) {
      throw new Error('Empty response in fallback mode');
    }

    const sectionTitle = this.extractSectionTitle(userMessage, isChinese);
    const formattedContent = content.startsWith('##') ? content : `## ${sectionTitle}\n\n${content}`;

    return {
      modifications: [
        {
          type: 'append',
          content: formattedContent,
          block_range: planning.target_location.block_range || [0, 0],
          metadata: {
            word_count: content.length,
            sources_used: searchContext?.sources?.map((_, i) => i) || []
          }
        }
      ],
      explanation: isChinese 
        ? `已生成关于"${userMessage}"的内容（使用备用模式）。`
        : `Generated content about "${userMessage}" using fallback mode.`,
      changes_summary: {
        words_added: content.length,
        reading_time_increased: Math.ceil(content.length / 200)
      }
    };
  }

  private cleanGeneratedContent(content: string): string {
    return content
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .replace(/^\s*\{[\s\S]*\}\s*$/m, '')
      .trim();
  }

  private extractSectionTitle(userMessage: string, isChinese: boolean): string {
    if (isChinese) {
      const chineseMatch = userMessage.match(/关于(.+?)(?:的|段落|$)/);
      if (chineseMatch) return chineseMatch[1];
      
      const keywords = userMessage
        .replace(/添加|一个|段落|关于|的|请|帮我|写/g, '')
        .trim();
      return keywords || '新内容';
    }
    
    const aboutMatch = userMessage.match(/about\s+(.+?)(?:\s+paragraph|\s+section|$)/i);
    if (aboutMatch) return aboutMatch[1];
    
    const keywords = userMessage
      .replace(/add|a|paragraph|about|section/gi, '')
      .trim();
    
    return keywords || 'New Content';
  }

  private generateSafetyNetContent(
    planning: PlanningResult,
    searchContext: SearchContext | null,
    userMessage: string,
    isChinese: boolean
  ): GenerationResult {
    const sectionTitle = this.extractSectionTitle(userMessage, isChinese);
    let content = "";
    
    // Check if we have useful search results (summary or raw results)
    const hasUsefulSearchData = searchContext && (
      (searchContext.summary && searchContext.summary.length > 50 && !searchContext.summary.includes('unavailable')) ||
      (searchContext.raw_results && searchContext.raw_results.length > 0)
    );
    
    if (hasUsefulSearchData) {
      // Use search summary if available, otherwise compile from raw results
      let summaryText = searchContext.summary || '';
      
      // If summary is too short or generic, try to use raw results
      if (summaryText.length < 100 && searchContext.raw_results && searchContext.raw_results.length > 0) {
        summaryText = searchContext.raw_results
          .slice(0, 3)
          .map(r => r.content?.slice(0, 300) || '')
          .filter(c => c.length > 0)
          .join('\n\n');
      }
      
      const sourcesNote = searchContext.sources?.length > 0
        ? `\n\n*${isChinese ? '来源' : 'Sources'}: ${searchContext.sources.map(s => s.title).join(', ')}*`
        : '';
      content = `## ${sectionTitle}\n\n${summaryText}${sourcesNote}`;
    } else {
      // No search data available - show error message
      content = isChinese 
        ? `## ${sectionTitle}\n\n*抱歉，AI 模型暂时无法生成内容（可能是免费模型的速率限制）。请稍后重试或切换到其他模型。*`
        : `## ${sectionTitle}\n\n*Sorry, the AI model couldn't generate content (possibly due to rate limits on free models). Please try again later or switch to a different model.*`;
    }

    return {
      modifications: [
        {
          type: 'append',
          content: content,
          block_range: planning.target_location.block_range || [0, 0],
          metadata: {
            word_count: content.length,
            sources_used: searchContext?.sources?.map((_, i) => i) || []
          }
        }
      ],
      explanation: searchContext?.summary 
        ? (isChinese ? `已从搜索结果生成关于"${sectionTitle}"的内容。` : `Generated content from search results about "${sectionTitle}".`)
        : (isChinese ? `已创建"${sectionTitle}"章节 - 请审阅并完善内容。` : `Created section "${sectionTitle}" - please review and enhance the content.`),
      changes_summary: {
        words_added: content.length,
        reading_time_increased: Math.ceil(content.length / 200)
      }
    };
  }


  private generateChineseDefaultContent(title: string, userMessage: string): string {
    const topicKeywords = userMessage
      .replace(/添加|一个|段落|关于|的|请|帮我|写/g, '')
      .trim();
    
    return `## ${title}

${topicKeywords}是一个值得深入探讨的主题。以下是一些关键要点：

### 概述

${topicKeywords}涉及多个重要方面，需要从不同角度进行分析和理解。

### 主要特点

- 这个主题具有独特的特征和属性
- 它在相关领域中扮演着重要角色
- 了解这些内容有助于更全面地把握整体情况

*注：此内容为AI生成的框架，建议根据实际需求进行补充和完善。*`;
  }

  private generateEnglishDefaultContent(title: string, userMessage: string): string {
    const topicKeywords = userMessage
      .replace(/add|a|paragraph|about|please|write|section/gi, '')
      .trim();
    
    return `## ${title}

${topicKeywords} is a topic worth exploring in depth. Here are some key points:

### Overview

${topicKeywords} involves several important aspects that require analysis from different perspectives.

### Key Features

- This topic has unique characteristics and attributes
- It plays an important role in related fields
- Understanding these aspects helps provide a comprehensive view

*Note: This is an AI-generated framework. Please review and enhance the content as needed.*`;
  }

  private extractJSON(text: string): string | null {
    const stack: string[] = [];
    let start = -1;
    let inString = false;
    let escape = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];

      if (escape) {
        escape = false;
        continue;
      }

      if (char === '\\') {
        escape = true;
        continue;
      }

      if (char === '"') {
        inString = !inString;
        continue;
      }

      if (inString) continue;

      if (char === '{') {
        if (stack.length === 0) start = i;
        stack.push('{');
      } else if (char === '}') {
        stack.pop();
        if (stack.length === 0 && start !== -1) {
          return text.substring(start, i + 1);
        }
      }
    }

    return null;
  }

  private buildGenerationSystemPrompt(
    writingStyle: WritingStyle | null | undefined, 
    estimatedWords: number = 400,
    isChinese: boolean = false
  ): string {
    let styleGuidance = '';
    
    if (writingStyle) {
      styleGuidance = `\n**User Writing Style Profile:**\n\n`;
      styleGuidance += `- Average Sentence Length: ${writingStyle.averageSentenceLength} characters\n`;
      styleGuidance += `- Formality Level: ${writingStyle.formalityLevel}/10 (${writingStyle.formalityLevel > 7 ? 'Formal' : writingStyle.formalityLevel > 4 ? 'Neutral' : 'Casual'})\n`;
      styleGuidance += `- Preferred Structure: ${writingStyle.preferredStructure}\n`;
      
      if (writingStyle.commonPhrases && writingStyle.commonPhrases.length > 0) {
        styleGuidance += `- Common Phrases: ${writingStyle.commonPhrases.slice(0, 3).join(', ')}\n`;
      }
      
      if (writingStyle.useOfExamples) {
        styleGuidance += `- Frequently uses examples and illustrations\n`;
      }
      
      styleGuidance += `\n**Important:** Match the user's writing style closely.\n\n`;
    }

    const languageNote = isChinese 
      ? `\n**Language:** Generate content in Chinese (中文). The content field must contain Chinese text.\n`
      : '';
    
    const exampleTitle = isChinese ? '火星的自然条件' : 'Mars Natural Conditions';
    const exampleSubtitle = isChinese ? '大气层特征' : 'Atmospheric Features';
    const exampleContent = isChinese 
      ? '这里是具体的段落内容，包含事实和数据...' 
      : 'Paragraph content with specific facts and data...';
    const exampleExplanation = isChinese ? '添加了关于...的380字内容' : 'Added 380 words about...';
    
    return `You are a professional blog content creation assistant.

**CRITICAL INSTRUCTIONS:**
1. You MUST respond with ONLY a valid JSON object.
2. Do not include any text before or after the JSON.
3. The JSON must follow the structure below exactly.
4. Generate ACTUAL content, not placeholders or instructions.
${languageNote}
**Task:** Generate high-quality blog content based on user requirements.
${styleGuidance}
**Generation Requirements:**

1. Accuracy: All facts must be accurate and well-researched
2. Fluency: Natural language, appropriate blog style
3. Structure: Clear logic, appropriate paragraphing
4. Detail: Target word/character count ~${estimatedWords}
5. Timeliness: Use current and relevant information
6. Readability: Suitable for general readers
7. IMPORTANT: Generate REAL content with specific facts, data, and details

**Content Format Rules:**

When generating content in the "content" field, use Markdown heading syntax:
- For main section titles: Use ## (H2). Example: ## ${exampleTitle}
- For subsection titles: Use ### (H3). Example: ### ${exampleSubtitle}
- For paragraphs: Use plain text with \\n\\n to separate paragraphs

**REQUIRED JSON Format:**
{
  "modifications": [
    {
      "type": "append",
      "content": "## ${exampleTitle}\\n\\n${exampleContent}\\n\\n### ${exampleSubtitle}\\n\\n...",
      "block_range": [12, 12],
      "metadata": {
        "word_count": 380,
        "sources_used": []
      }
    }
  ],
  "explanation": "${exampleExplanation}",
  "changes_summary": {
    "words_added": 380,
    "reading_time_increased": 1.9
  }
}`;
  }


  private buildGenerationUserPrompt(
    planning: PlanningResult,
    searchContext: SearchContext | null,
    currentContent: PartialBlock[],
    userMessage: string,
    writingStyle: WritingStyle | null | undefined,
    isChinese: boolean
  ): string {
    let targetContent = 'N/A';
    if (planning.target_location.block_range) {
      const [start, end] = planning.target_location.block_range;
      const targetBlocks = currentContent.slice(start, end + 1);
      targetContent = this.blocksToText(targetBlocks);
    } else if (planning.target_location.section_title) {
      targetContent = planning.target_location.section_title;
    }

    const searchInfo = searchContext?.summary 
      ? (isChinese 
          ? `\n**搜索结果摘要:**\n${searchContext.summary}\n`
          : `\n**Search Results Summary:**\n${searchContext.summary}\n`)
      : '';

    const currentContentText = this.blocksToText(currentContent);
    
    return isChinese
      ? `**用户请求:** ${userMessage}

**当前文章内容:**
${currentContentText}

**目标位置:** ${planning.target_location.section_title || '文章末尾'}
**目标内容:** ${targetContent}

**操作类型:** ${planning.action_plan.type}
**预计字数:** ${planning.action_plan.estimated_words}
${searchInfo}
请根据以上信息生成内容，严格按照JSON格式返回。`
      : `**User Request:** ${userMessage}

**Current Article Content:**
${currentContentText}

**Target Location:** ${planning.target_location.section_title || 'End of article'}
**Target Content:** ${targetContent}

**Action Type:** ${planning.action_plan.type}
**Estimated Words:** ${planning.action_plan.estimated_words}
${searchInfo}
Please generate content based on the above information and return in strict JSON format.`;
  }

  private blocksToText(blocks: PartialBlock[]): string {
    return blocks.map(block => {
      if (!block.content) return '';
      if (Array.isArray(block.content)) {
        return block.content
          .map(item => {
            if (typeof item === 'string') return item;
            if ('text' in item) return item.text;
            return '';
          })
          .join('');
      }
      return '';
    }).join('\n');
  }

  private parseGenerationResponse(response: string): GenerationResult {
    let jsonStr = response.trim();
    
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const extractedJson = this.extractJSON(jsonStr);
    if (extractedJson) {
      jsonStr = extractedJson;
    }

    const parsed = JSON.parse(jsonStr);
    
    return {
      modifications: parsed.modifications || [],
      explanation: parsed.explanation || '',
      changes_summary: parsed.changes_summary || {
        words_added: 0,
        reading_time_increased: 0
      }
    };
  }
}