# Meal Plan API Testing Guide

## API Endpoint Information

**URL**: `http://localhost:3000/api/generate-meal-plan`  
**Method**: `POST`  
**Authentication**: Bearer token (Supabase session access_token)

## Getting a Valid Token

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:3000` and log in

3. Open browser developer tools:
   - Chrome/Edge: F12 → Application tab → Local Storage
   - Firefox: F12 → Storage tab → Local Storage

4. Find the key `sb-<project-id>-auth-token` and copy the `access_token` value

## Request Structure

### Headers
```
Content-Type: application/json
Authorization: Bearer <your_access_token>
```

### Request Body
```json
{
  "prompt": "Créez un plan alimentaire équilibré pour une personne active",
  "clientId": "optional-client-uuid",
  "duration": 3,
  "targetCalories": 2200,
  "dietType": "balanced",
  "restrictions": ["sans gluten", "végétarien"],
  "goals": "Maintenir un poids santé"
}
```

### Field Validation
- `prompt`: Required, 10-1000 characters
- `duration`: Optional, default 7 days
- `targetCalories`: Optional, default 2000
- `dietType`: Optional, default "balanced"
- `restrictions`: Optional, array of strings
- `goals`: Optional, string

## Expected Response Structure

### Success Response (200)
```json
{
  "success": true,
  "data": {
    "name": "Plan 3 jours",
    "description": "Description du plan",
    "totalDays": 3,
    "averageCaloriesPerDay": 2200,
    "nutritionSummary": {
      "protein": "25%",
      "carbohydrates": "45%",
      "fat": "30%"
    },
    "days": [
      {
        "day": 1,
        "date": "2024-01-15",
        "meals": {
          "breakfast": {
            "name": "Porridge aux flocons d'avoine",
            "description": "Petit-déjeuner nutritif et énergétique",
            "calories": 400,
            "protein": 15,
            "carbs": 50,
            "fat": 12,
            "fiber": 8,
            "prepTime": 10,
            "cookTime": 5,
            "ingredients": ["80g flocons d'avoine", "250ml lait d'amande", "1 banane"],
            "ingredientsNutrition": [
              {
                "name": "flocons d'avoine",
                "unit": "g",
                "caloriesPer100": 389,
                "proteinPer100": 16.9,
                "carbsPer100": 66.3,
                "fatPer100": 6.9,
                "fiberPer100": 10.6
              }
            ],
            "instructions": [
              "Faire chauffer le lait dans une casserole",
              "Ajouter les flocons d'avoine et mélanger",
              "Cuire 5 minutes en remuant",
              "Servir avec la banane tranchée"
            ],
            "tags": ["petit-déjeuner", "végétarien"]
          },
          "lunch": {
            "name": "Salade de quinoa aux légumes",
            "description": "Déjeuner léger et nutritif"
            // ... same structure as breakfast
          },
          "dinner": {
            "name": "Saumon grillé aux légumes",
            "description": "Dîner riche en protéines"
            // ... same structure as breakfast
          },
          "snacks": [
            {
              "name": "Yaourt aux fruits",
              "description": "Collation protéinée"
              // ... same structure as breakfast
            }
          ]
        },
        "totalCalories": 2200,
        "totalProtein": 150,
        "totalCarbs": 220,
        "totalFat": 85
      }
      // ... more days
    ]
  }
}
```

### Error Responses

#### 401 Unauthorized
```json
{
  "error": "Authentication required"
}
```

#### 400 Bad Request
```json
{
  "error": "Prompt must be between 10 and 1000 characters"
}
```

#### 500 Server Error
```json
{
  "success": false,
  "error": "Failed to generate meal plan"
}
```

## Manual CURL Commands

### Test 1: Valid Request
```bash
curl -X POST "http://localhost:3000/api/generate-meal-plan" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
  -d '{
    "prompt": "Créez un plan alimentaire équilibré pour une personne active",
    "duration": 3,
    "targetCalories": 2200,
    "dietType": "balanced",
    "restrictions": ["sans gluten"],
    "goals": "Maintenir un poids santé"
  }'
```

### Test 2: Short Prompt (Should Fail)
```bash
curl -X POST "http://localhost:3000/api/generate-meal-plan" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
  -d '{
    "prompt": "test"
  }'
```

### Test 3: No Authentication (Should Fail)
```bash
curl -X POST "http://localhost:3000/api/generate-meal-plan" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Créez un plan alimentaire simple pour 2 jours"
  }'
```

### Test 4: Minimal Valid Request
```bash
curl -X POST "http://localhost:3000/api/generate-meal-plan" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
  -d '{
    "prompt": "Plan alimentaire végétarien pour 2 jours avec 1800 calories par jour"
  }'
```

## Automated Test Script

Run the automated test script:
```bash
./test-meal-plan-api.sh YOUR_ACCESS_TOKEN_HERE
```

## What to Verify

1. **Authentication**: Requests without Bearer token should return 401
2. **Validation**: Short prompts should return 400
3. **Structure**: Successful responses should have:
   - `success: true`
   - `data.name` (string)
   - `data.totalDays` (number matching request)
   - `data.days` (array with correct length)
   - Each day has `meals` object with breakfast, lunch, dinner
   - Each meal has required nutritional information
   - `ingredientsNutrition` array with detailed nutritional data

4. **Content Quality**: 
   - Meals should be in French
   - Ingredients should be realistic and specific
   - Instructions should be clear and actionable
   - Nutritional data should be reasonable

5. **Error Handling**: 
   - Invalid JSON should be handled gracefully
   - Missing required fields should return appropriate errors
   - Server errors should not expose sensitive information

## Common Issues to Check

1. **JSON Format**: Ensure AI generates valid JSON without markdown code blocks
2. **Day Count**: Verify generated days match requested duration
3. **Meal Structure**: Each day should have all required meal types
4. **Nutritional Data**: Values should be realistic and consistent
5. **Token Expiry**: Access tokens expire, get fresh token if 401 errors occur

## Frontend Integration Points

The API response gets transformed by `transformMealPlanData()` in `/lib/gemini.ts` before being used in the UI. The transformation:

1. Converts API's object-based meal structure to array format
2. Adds meal type fields ("breakfast", "lunch", "dinner", "snack")
3. Calculates nutrition averages and summaries
4. Generates shopping lists from ingredients
5. Handles both single snacks and arrays of snacks

Check that the transformation preserves all nutritional data and meal details correctly.