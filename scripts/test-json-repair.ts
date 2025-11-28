
const invalidJson = `{
  "type": "replace",
  "content": "## Section Title
  
  This is a paragraph with
  multiple lines."
}`;

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

try {
  console.log('Testing invalid JSON parsing...');
  try {
    JSON.parse(invalidJson);
    console.error('❌ JSON.parse should have failed but passed!');
  } catch (e) {
    console.log('✅ JSON.parse failed as expected:', e.message);
  }

  console.log('Repairing JSON...');
  const repaired = repairJsonString(invalidJson);
  console.log('Repaired string length:', repaired.length);
  
  const parsed = JSON.parse(repaired);
  console.log('✅ Successfully parsed repaired JSON!');
  console.log('Content preview:', parsed.content.substring(0, 50));
  
} catch (error) {
  console.error('❌ Test failed:', error);
}
