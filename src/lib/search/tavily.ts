export interface TavilyResult {
  title: string;
  url: string;
  content: string;
  score?: number;
}

interface TavilyResponse {
  answer?: string;
  results: TavilyResult[];
}

export async function searchTavily(
  query: string, 
  options: { max_results?: number } = {}
): Promise<TavilyResult[]> {
  const tavilyApiKey = process.env.TAVILY_API_KEY;
  
  if (!tavilyApiKey) {
    console.warn('[Search] Tavily API key not configured, skipping web search');
    return [];
  }

  try {
    console.log('[Search] Performing Tavily search for:', query);
    
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: tavilyApiKey,
        query: query,
        search_depth: 'basic',
        include_answer: true,
        max_results: options.max_results || 5,
      }),
    });

    if (!response.ok) {
      console.error('[Search] Tavily API error:', response.status);
      return [];
    }

    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('[Search] Tavily search failed:', error);
    return [];
  }
}

export async function performWebSearch(query: string): Promise<string> {
  const results = await searchTavily(query);
  
  if (results.length === 0) {
    return '';
  }

  // Format search results
  let searchContext = '\n\n**🔍 Web Search Results:**\n\n';
  
  // Note: We don't have the 'answer' field exposed in searchTavily yet, 
  // but for backward compatibility this is fine. 
  // If we need the answer, we should update searchTavily to return the full response.

  if (results.length > 0) {
    searchContext += '**Sources:**\n';
    results.forEach((result: any, index: number) => {
      searchContext += `${index + 1}. **${result.title}**\n`;
      searchContext += `   ${result.url}\n`;
      searchContext += `   ${result.content}\n\n`;
    });
  }

  return searchContext;
}
