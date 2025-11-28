/**
 * Readability Analysis Tool
 * Analyzes content readability and provides suggestions
 */

export interface ReadabilityAnalysis {
  averageSentenceLength: number;
  grade: 'easy' | 'medium' | 'hard';
  complexWordPercentage: number;
  suggestions: string[];
  overallScore: number;
}

/**
 * 分析可读性
 */
export async function analyzeReadability(
  content: string
): Promise<ReadabilityAnalysis> {
  const sentences = splitIntoSentences(content);
  const avgLength = calculateAvgSentenceLength(sentences);
  const complexWords = calculateComplexWords(content);

  // 确定难度等级
  let grade: 'easy' | 'medium' | 'hard';
  if (avgLength < 20) {
    grade = 'easy';
  } else if (avgLength < 30) {
    grade = 'medium';
  } else {
    grade = 'hard';
  }

  // 生成建议
  const suggestions: string[] = [];
  if (avgLength > 35) {
    suggestions.push('部分句子过长，建议分段');
  }
  if (complexWords > 20) {
    suggestions.push('专业术语较多，建议添加注释');
  }

  // 计算总分 (1-10)
  let score = 10;
  if (avgLength > 30) score -= 2;
  if (avgLength > 40) score -= 2;
  if (complexWords > 20) score -= 2;
  if (complexWords > 30) score -= 2;

  return {
    averageSentenceLength: avgLength,
    grade,
    complexWordPercentage: complexWords,
    suggestions,
    overallScore: Math.max(1, score),
  };
}

/**
 * 将文本分割成句子
 */
function splitIntoSentences(content: string): string[] {
  // 提取文本内容（去除 JSON 结构）
  const textContent = extractTextFromJSON(content);

  return textContent
    .split(/[。！？.!?]+/)
    .filter((s) => s.trim().length > 0)
    .map((s) => s.trim());
}

/**
 * 从 JSON 内容中提取纯文本
 */
function extractTextFromJSON(content: string): string {
  try {
    // 尝试解析 JSON
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) {
      return parsed
        .map((block) => {
          if (block.content) {
            if (Array.isArray(block.content)) {
              return block.content.map((c: any) => c.text || '').join('');
            }
            return block.content;
          }
          return '';
        })
        .join(' ');
    }
  } catch {
    // 如果不是 JSON，直接返回
    return content;
  }
  return content;
}

/**
 * 计算平均句长
 */
function calculateAvgSentenceLength(sentences: string[]): number {
  if (sentences.length === 0) return 0;

  const totalLength = sentences.reduce((sum, s) => sum + s.length, 0);
  return Math.round(totalLength / sentences.length);
}

/**
 * 计算复杂词汇百分比
 * 简化实现：英文单词和专业术语的比例
 */
function calculateComplexWords(content: string): number {
  const textContent = extractTextFromJSON(content);
  const totalChars = textContent.length;

  if (totalChars === 0) return 0;

  // 检测英文单词、数字、专业符号
  const complexPattern = /[A-Za-z0-9]+/g;
  const matches = textContent.match(complexPattern) || [];
  const complexChars = matches.join('').length;

  return Math.round((complexChars / totalChars) * 100);
}
