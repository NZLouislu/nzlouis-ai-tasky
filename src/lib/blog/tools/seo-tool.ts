/**
 * SEO Analysis Tool
 * Provides SEO scoring and suggestions for blog content
 */

export interface SEOAnalysis {
  title: {
    length: number;
    optimal: boolean;
    suggestion: string | null;
  };
  headings: {
    hasH2: boolean;
    count: number;
    suggestion: string | null;
  };
  keywords: {
    density: number;
    suggestions: string[];
  };
  overallScore: number;
}

/**
 * 检查 SEO 质量
 */
export async function checkSEO(
  content: string,
  title: string
): Promise<SEOAnalysis> {
  const titleLength = title.length;
  const titleOptimal = titleLength >= 30 && titleLength <= 60;

  // 检查 H2 标题
  const hasH2 = content.includes('"level":2') || content.includes('level: 2');
  const headingCount = countHeadings(content);

  // 计算关键词密度
  const keywordDensity = calculateKeywordDensity(content, title);

  // 计算总分
  let score = 0;
  if (titleOptimal) score += 4;
  else if (titleLength > 0) score += 2;

  if (hasH2) score += 3;
  if (headingCount >= 3) score += 2;
  if (keywordDensity > 1 && keywordDensity < 5) score += 1;

  return {
    title: {
      length: titleLength,
      optimal: titleOptimal,
      suggestion: titleLength < 30 ? '标题过短，建议30-60字' : null,
    },
    headings: {
      hasH2,
      count: headingCount,
      suggestion: !hasH2 ? '缺少H2子标题，影响SEO' : null,
    },
    keywords: {
      density: keywordDensity,
      suggestions: [],
    },
    overallScore: score,
  };
}

/**
 * 计算标题数量
 */
function countHeadings(content: string): number {
  const h2Matches = content.match(/"level":2/g) || [];
  const h3Matches = content.match(/"level":3/g) || [];
  return h2Matches.length + h3Matches.length;
}

/**
 * 计算关键词密度（简化版）
 */
function calculateKeywordDensity(content: string, title: string): number {
  // 提取标题中的关键词
  const titleWords = title.match(/[\u4e00-\u9fa5]{2,}/g) || [];
  if (titleWords.length === 0) return 0;

  // 计算关键词在内容中出现的频率
  const mainKeyword = titleWords[0];
  const matches = content.match(new RegExp(mainKeyword, 'g')) || [];

  // 计算密度（出现次数 / 总字数 * 100）
  const totalChars = content.length;
  return totalChars > 0 ? (matches.length / (totalChars / 100)) * 100 : 0;
}
