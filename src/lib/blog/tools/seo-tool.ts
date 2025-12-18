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
 * Check SEO quality
 */
export async function checkSEO(
  content: string,
  title: string
): Promise<SEOAnalysis> {
  const titleLength = title.length;
  const titleOptimal = titleLength >= 30 && titleLength <= 60;

  // Check H2 headings
  const hasH2 = content.includes('"level":2') || content.includes('level: 2');
  const headingCount = countHeadings(content);

  // Calculate keyword density
  const keywordDensity = calculateKeywordDensity(content, title);

  // Calculate total score
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
      suggestion: titleLength < 30 ? 'Title too short, recommended 30-60 characters' : null,
    },
    headings: {
      hasH2,
      count: headingCount,
      suggestion: !hasH2 ? 'Missing H2 subheadings, affects SEO' : null,
    },
    keywords: {
      density: keywordDensity,
      suggestions: [],
    },
    overallScore: score,
  };
}

/**
 * Count number of headings
 */
function countHeadings(content: string): number {
  const h2Matches = content.match(/"level":2/g) || [];
  const h3Matches = content.match(/"level":3/g) || [];
  return h2Matches.length + h3Matches.length;
}

/**
 * Calculate keyword density (simplified version)
 */
function calculateKeywordDensity(content: string, title: string): number {
  // Extract keywords from title
  const titleWords = title.match(/[\u4e00-\u9fa5]{2,}/g) || [];
  if (titleWords.length === 0) return 0;

  // Calculate keyword frequency in content
  const mainKeyword = titleWords[0];
  if (!mainKeyword) return 0;
  
  const matches = content.match(new RegExp(mainKeyword, 'g')) || [];

  // Calculate density (occurrences / total characters * 100)
  const totalChars = content.length;
  return totalChars > 0 ? (matches.length / (totalChars / 100)) * 100 : 0;
}
