
import { describe, it, expect } from 'vitest';

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
      // Skip carriage returns inside strings (or handle them)
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

describe('JSON Repair Test', () => {
  it('should repair JSON with unescaped newlines in strings', () => {
    const invalidJson = `{
      "type": "replace",
      "content": "## Section Title
      
      This is a paragraph with
      multiple lines."
    }`;

    // Verify that JSON.parse fails on the invalid JSON
    expect(() => JSON.parse(invalidJson)).toThrow();

    // Repair the JSON
    const repaired = repairJsonString(invalidJson);
    console.log('Repaired JSON:', repaired);

    // Verify that the repaired JSON is valid
    const parsed = JSON.parse(repaired);
    expect(parsed.content).toContain('## Section Title');
    expect(parsed.content).toContain('multiple lines.');
  });

  it('should handle complex content with existing escapes', () => {
    const invalidJson = `{
      "content": "Line 1
Line 2 with \\"quotes\\"
Line 3"
    }`;

    const repaired = repairJsonString(invalidJson);
    const parsed = JSON.parse(repaired);
    expect(parsed.content).toBe('Line 1\nLine 2 with "quotes"\nLine 3');
  });
});
