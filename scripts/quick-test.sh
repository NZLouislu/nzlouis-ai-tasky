#!/bin/bash

# Quick test script for model API
# Make sure dev server is running on localhost:3000

echo "🧪 Testing Model API"
echo "===================="
echo ""

# Test OpenRouter model (the one that was failing)
echo "Testing OpenRouter model..."
curl -X POST http://localhost:3000/api/test-model \
  -H "Content-Type: application/json" \
  -d '{"modelId":"tngtech/deepseek-r1t2-chimera:free"}' \
  2>/dev/null | jq '.'

echo ""
echo "✅ If you see success:true above, the fix is working!"
echo ""
echo "📝 To test all models, visit: http://localhost:3000/test-models"
