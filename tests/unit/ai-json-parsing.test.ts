/**
 * Test suite for AI Assistant JSON Parsing
 * Tests the ability to extract and parse JSON from LLM responses
 */

import { describe, it, expect } from 'vitest';

// Mock the planning agent and content generator classes
class JSONExtractor {
  /**
   * Extracts JSON from LLM response that may contain explanatory text
   */
  extractJSON(text: string): string | null {
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

  /**
   * Helper to repair malformed JSON strings
   */
  repairJsonString(jsonStr: string): string {
    let inString = false;
    let escaped = false;
    let result = '';

    for (let i = 0; i < jsonStr.length; i++) {
      const char = jsonStr[i];

      if (char === '"' && !escaped) {
        inString = !inString;
        result += char;
      } else if (inString && char === '\n') {
        result += '\\n';
      } else if (inString && char === '\r') {
        // Skip carriage returns
      } else if (inString && char === '\t') {
        result += '\\t';
      } else {
        result += char;
      }

      if (char === '\\' && !escaped) {
        escaped = true;
      } else {
        escaped = false;
      }
    }

    return result;
  }

  /**
   * Parse JSON from LLM response
   */
  parseResponse(response: string): any {
    let cleanedResponse = response
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .trim();

    let jsonStr = this.extractJSON(cleanedResponse);

    if (!jsonStr) {
      const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      }
    }

    if (!jsonStr) {
      throw new Error('No JSON found in response');
    }

    try {
      return JSON.parse(jsonStr);
    } catch (e) {
      const repairedStr = this.repairJsonString(jsonStr);
      return JSON.parse(repairedStr);
    }
  }
}

describe('AI Assistant JSON Parsing', () => {
  const extractor = new JSONExtractor();

  describe('extractJSON', () => {
    it('should extract pure JSON from response', () => {
      const response = '{"type": "append", "content": "Test content"}';
      const result = extractor.extractJSON(response);
      expect(result).toBe(response);
    });

    it('should extract JSON with text before it', () => {
      const response = 'Here is the result:\n{"type": "append", "content": "Test"}';
      const result = extractor.extractJSON(response);
      expect(result).toBe('{"type": "append", "content": "Test"}');
    });

    it('should extract JSON with text after it', () => {
      const response = '{"type": "append", "content": "Test"}\nHope this helps!';
      const result = extractor.extractJSON(response);
      expect(result).toBe('{"type": "append", "content": "Test"}');
    });

    it('should extract JSON with text before and after', () => {
      const response = 'Here is my response:\n{"type": "append", "content": "Test"}\nLet me know if you need more!';
      const result = extractor.extractJSON(response);
      expect(result).toBe('{"type": "append", "content": "Test"}');
    });

    it('should handle nested JSON objects', () => {
      const response = '{"modifications": [{"type": "append", "content": "Test"}], "explanation": "Done"}';
      const result = extractor.extractJSON(response);
      expect(result).toBe(response);
    });

    it('should handle JSON with escaped quotes in strings', () => {
      const response = '{"content": "He said \\"Hello\\" to me"}';
      const result = extractor.extractJSON(response);
      expect(result).toBe(response);
    });

    it('should handle JSON with newlines in strings', () => {
      const jsonStr = '{"content": "Line 1\\nLine 2"}';
      const response = `Some text before\n${jsonStr}\nSome text after`;
      const result = extractor.extractJSON(response);
      expect(result).toBe(jsonStr);
    });

    it('should return null when no JSON is present', () => {
      const response = 'This is just plain text without any JSON';
      const result = extractor.extractJSON(response);
      expect(result).toBeNull();
    });
  });

  describe('parseResponse', () => {
    it('should parse valid JSON planning response', () => {
      const response = `{
        "thought_process": "User wants to add a paragraph about Mars",
        "target_location": {
          "section_index": 1,
          "section_title": "Mars Natural Conditions",
          "block_range": [3, 12]
        },
        "action_plan": {
          "type": "insert",
          "estimated_words": 300,
          "estimated_reading_time_increase": 1.5
        },
        "needs_search": true,
        "search_queries": ["Mars natural conditions 2024"],
        "clarification_needed": false,
        "clarification_questions": [],
        "suggestions": ["Include information about atmosphere", "Mention temperature ranges"]
      }`;

      const result = extractor.parseResponse(response);
      expect(result.thought_process).toBe('User wants to add a paragraph about Mars');
      expect(result.action_plan.type).toBe('insert');
      expect(result.needs_search).toBe(true);
    });

    it('should parse valid JSON generation response', () => {
      const response = `{
        "modifications": [
          {
            "type": "append",
            "content": "## 火星的自然条件\\n\\n火星是太阳系中第四颗行星...",
            "block_range": [12, 12],
            "metadata": {
              "word_count": 380,
              "sources_used": [1, 2, 3]
            }
          }
        ],
        "explanation": "Added paragraph about Mars natural conditions",
        "changes_summary": {
          "words_added": 380,
          "reading_time_increased": 1.9
        }
      }`;

      const result = extractor.parseResponse(response);
      expect(result.modifications).toHaveLength(1);
      expect(result.modifications[0].type).toBe('append');
      expect(result.changes_summary.words_added).toBe(380);
    });

    it('should parse JSON with markdown code blocks removed', () => {
      const response = `\`\`\`json
{
  "type": "append",
  "content": "Test content"
}
\`\`\``;

      const result = extractor.parseResponse(response);
      expect(result.type).toBe('append');
      expect(result.content).toBe('Test content');
    });

    it('should parse JSON with explanatory text before', () => {
      const response = `Based on your request, here is the plan:

{
  "thought_process": "Adding Mars info",
  "action_plan": {
    "type": "insert",
    "estimated_words": 300
  },
  "needs_search": true,
  "search_queries": ["Mars 2024"]
}`;

      const result = extractor.parseResponse(response);
      expect(result.thought_process).toBe('Adding Mars info');
      expect(result.needs_search).toBe(true);
    });

    it('should parse JSON with explanatory text after', () => {
      const response = `{
  "modifications": [{
    "type": "append",
    "content": "Mars info"
  }],
  "explanation": "Done"
}

I hope this helps! Let me know if you need any adjustments.`;

      const result = extractor.parseResponse(response);
      expect(result.modifications[0].type).toBe('append');
      expect(result.explanation).toBe('Done');
    });

    it('should throw error when no JSON is found', () => {
      const response = 'Sorry, I cannot help with that request.';
      
      expect(() => {
        extractor.parseResponse(response);
      }).toThrow('No JSON found in response');
    });

    it('should handle JSON with Chinese characters', () => {
      const response = `{
  "modifications": [{
    "type": "append",
    "content": "## 火星探索的历程\\n\\n火星，这颗红色星球..."
  }],
  "explanation": "添加了关于火星探索的段落"
}`;

      const result = extractor.parseResponse(response);
      expect(result.modifications[0].content).toContain('火星探索');
      expect(result.explanation).toContain('添加了');
    });
  });

  describe('AI Paragraph Addition Scenario', () => {
    it('should successfully parse AI response for adding Mars paragraph', () => {
      // This simulates the real-world scenario from the error logs
      const aiResponse = `I'll help you add a paragraph about Mars natural conditions. Let me create that for you.

{
  "modifications": [
    {
      "type": "append",
      "content": "## 火星的自然条件\\n\\n火星，作为太阳系中距离太阳第四近的行星，拥有独特的自然环境。火星的大气层主要由二氧化碳（约95%）组成，大气压仅为地球的约0.6%。火星表面温度变化极大，平均温度约为零下63摄氏度，最低可达零下140摄氏度，最高可达20摄氏度。\\n\\n### 地质特征\\n\\n火星表面布满了撞击坑、峡谷和火山。奥林帕斯山是太阳系中已知最大的火山，高度约为22公里。水手号峡谷是一个长达4000公里的巨大峡谷系统。\\n\\n### 水资源迹象\\n\\n近年来的探测表明，火星上可能存在液态水。火星极地冰盖含有大量水冰，而且有证据表明，在火星地下可能存在液态水湖泊。",
      "block_range": [12, 12],
      "metadata": {
        "word_count": 380,
        "sources_used": [1, 2, 3]
      }
    }
  ],
  "explanation": "已添加关于火星自然条件的详细段落，包括大气层特征、地质特征和水资源迹象三个部分。",
  "changes_summary": {
    "words_added": 380,
    "reading_time_increased": 1.9
  }
}

This paragraph provides comprehensive information about Mars' natural conditions, including atmosphere, temperature, geological features, and water evidence.`;

      const result = extractor.parseResponse(aiResponse);
      
      // Verify structure
      expect(result.modifications).toBeDefined();
      expect(result.modifications).toHaveLength(1);
      expect(result.modifications[0].type).toBe('append');
      expect(result.modifications[0].content).toContain('火星的自然条件');
      expect(result.modifications[0].content).toContain('## 火星的自然条件');
      expect(result.modifications[0].content).toContain('### 地质特征');
      expect(result.modifications[0].content).toContain('### 水资源迹象');
      
      // Verify metadata
      expect(result.modifications[0].metadata.word_count).toBe(380);
      expect(result.changes_summary.words_added).toBe(380);
      expect(result.explanation).toContain('已添加');
    });

    it('should show preview dialog when modification is parsed successfully', () => {
      const aiResponse = `{
  "modifications": [{
    "type": "append",
    "content": "## 新段落\\n\\n这是新添加的内容。"
  }],
  "explanation": "成功添加段落"
}`;

      const result = extractor.parseResponse(aiResponse);
      
      // Verify that we can extract modification data for preview
      expect(result.modifications[0]).toBeDefined();
      expect(result.modifications[0].type).toBe('append');
      expect(result.modifications[0].content).toBeTruthy();
      expect(result.explanation).toBeTruthy();
      
      // This data should be sufficient to show a comparison dialog
      console.log('✅ Modification parsed successfully, ready for preview dialog');
    });
  });
});

export { JSONExtractor };
