#!/bin/bash

# Test script for meal plan generation API
# Usage: ./test-meal-plan-api.sh <SUPABASE_ACCESS_TOKEN>

if [ -z "$1" ]; then
    echo "Usage: $0 <SUPABASE_ACCESS_TOKEN>"
    echo ""
    echo "To get a token:"
    echo "1. Start dev server: npm run dev"
    echo "2. Log into the app at http://localhost:3000"
    echo "3. Open browser dev tools > Application > Local Storage"
    echo "4. Find 'sb-<project-id>-auth-token' and copy the access_token value"
    exit 1
fi

TOKEN="$1"
BASE_URL="http://localhost:3000"

echo "🧪 Testing Meal Plan Generation API"
echo "======================================"
echo ""

# Test 1: Basic meal plan generation
echo "Test 1: Basic 3-day meal plan"
echo "------------------------------"

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/generate-meal-plan" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{
        "prompt": "Créez un plan alimentaire équilibré pour une personne active",
        "duration": 3,
        "targetCalories": 2200,
        "dietType": "balanced",
        "restrictions": ["sans gluten"],
        "goals": "Maintenir un poids santé"
    }')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n -1)

echo "HTTP Status: $HTTP_CODE"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Success Response:"
    echo "$BODY" | jq '.'
    
    # Validate structure
    echo ""
    echo "📊 Structure Validation:"
    echo "- Has success field: $(echo "$BODY" | jq -r '.success // "missing"')"
    echo "- Has data field: $(echo "$BODY" | jq -r 'has("data")')"
    echo "- Plan name: $(echo "$BODY" | jq -r '.data.name // "missing"')"
    echo "- Total days: $(echo "$BODY" | jq -r '.data.totalDays // "missing"')"
    echo "- Days array length: $(echo "$BODY" | jq -r '.data.days | length')"
    echo "- First day has meals: $(echo "$BODY" | jq -r '.data.days[0].meals | keys | @csv')"
    echo "- Nutrition summary: $(echo "$BODY" | jq -r '.data.nutritionSummary // "missing"')"
else
    echo "❌ Error Response:"
    echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
fi

echo ""
echo "======================================"

# Test 2: Edge case - minimum prompt length
echo ""
echo "Test 2: Minimum prompt (should fail)"
echo "-----------------------------------"

RESPONSE2=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/generate-meal-plan" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{
        "prompt": "test",
        "duration": 1
    }')

HTTP_CODE2=$(echo "$RESPONSE2" | tail -n1)
BODY2=$(echo "$RESPONSE2" | head -n -1)

echo "HTTP Status: $HTTP_CODE2"
if [ "$HTTP_CODE2" = "400" ]; then
    echo "✅ Correctly rejected short prompt:"
    echo "$BODY2" | jq '.' 2>/dev/null || echo "$BODY2"
else
    echo "❌ Unexpected response to short prompt:"
    echo "$BODY2" | jq '.' 2>/dev/null || echo "$BODY2"
fi

echo ""
echo "======================================"

# Test 3: No authentication
echo ""
echo "Test 3: No authentication (should fail)"
echo "---------------------------------------"

RESPONSE3=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/generate-meal-plan" \
    -H "Content-Type: application/json" \
    -d '{
        "prompt": "Créez un plan alimentaire simple pour 2 jours"
    }')

HTTP_CODE3=$(echo "$RESPONSE3" | tail -n1)
BODY3=$(echo "$RESPONSE3" | head -n -1)

echo "HTTP Status: $HTTP_CODE3"
if [ "$HTTP_CODE3" = "401" ]; then
    echo "✅ Correctly rejected request without auth:"
    echo "$BODY3" | jq '.' 2>/dev/null || echo "$BODY3"
else
    echo "❌ Unexpected response to unauthorized request:"
    echo "$BODY3" | jq '.' 2>/dev/null || echo "$BODY3"
fi

echo ""
echo "🧪 Test Summary"
echo "==============="
echo "Test 1 (Valid request): HTTP $HTTP_CODE"
echo "Test 2 (Short prompt): HTTP $HTTP_CODE2"
echo "Test 3 (No auth): HTTP $HTTP_CODE3"
echo ""
echo "Expected: 200, 400, 401"
echo ""

# If Test 1 was successful, save the response for further analysis
if [ "$HTTP_CODE" = "200" ]; then
    echo "$BODY" > meal-plan-response.json
    echo "💾 Full response saved to meal-plan-response.json"
    echo ""
    echo "🔍 Quick nutrition analysis:"
    echo "Average calories per day: $(echo "$BODY" | jq -r '.data.averageCaloriesPerDay // "not specified"')"
    echo "Protein percentage: $(echo "$BODY" | jq -r '.data.nutritionSummary.protein // "not specified"')"
    echo "Carb percentage: $(echo "$BODY" | jq -r '.data.nutritionSummary.carbohydrates // "not specified"')"
    echo "Fat percentage: $(echo "$BODY" | jq -r '.data.nutritionSummary.fat // "not specified"')"
fi