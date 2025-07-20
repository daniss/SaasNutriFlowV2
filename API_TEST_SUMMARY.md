# Meal Plan Generation API Test Summary

## Quick Overview

I've analyzed the meal plan generation API endpoint and created comprehensive testing tools. Here's what I found:

## API Endpoint Details

**Endpoint**: `POST /api/generate-meal-plan`  
**Authentication**: Bearer token (Supabase access_token)  
**Location**: `/home/danis/code/SaasNutriFlowV2/app/api/generate-meal-plan/route.ts`

## Request/Response Structure

### Request Body
```json
{
  "prompt": "Créez un plan alimentaire équilibré", // Required, 10-1000 chars
  "duration": 7,                                   // Optional, default 7
  "targetCalories": 2000,                         // Optional, default 2000
  "dietType": "balanced",                         // Optional, default "balanced"
  "restrictions": ["sans gluten"],                // Optional, default []
  "goals": "Maintenir un poids santé"             // Optional, default ""
}
```

### Response Structure
The API returns a complex JSON structure with:
- Meal plan metadata (name, description, totalDays)
- Nutrition summary (protein/carb/fat percentages)
- Daily meal plans with breakfast, lunch, dinner, and snacks
- Each meal includes detailed nutritional information and ingredients with per-100g nutrition data

## Authentication Method

The API uses **Supabase session tokens**:
1. Frontend calls `supabase.auth.getSession()` to get access_token
2. Sends as `Authorization: Bearer <access_token>`
3. Server validates token with Supabase service role

## Created Testing Files

### 1. `/home/danis/code/SaasNutriFlowV2/test-meal-plan-api.sh`
**Automated test script** that runs 3 test cases:
- Valid meal plan generation request
- Invalid short prompt (should fail with 400)
- No authentication (should fail with 401)

**Usage**: `./test-meal-plan-api.sh <YOUR_ACCESS_TOKEN>`

### 2. `/home/danis/code/SaasNutriFlowV2/MEAL_PLAN_API_TEST.md`
**Comprehensive testing guide** with:
- How to get Supabase access tokens
- Manual curl commands for testing
- Expected response structures
- Validation checklist
- Common issues and troubleshooting

### 3. `/home/danis/code/SaasNutriFlowV2/verify-setup.sh`
**Environment verification script** that checks:
- Node.js/npm versions
- Dependencies installation
- Environment variables configuration
- Development server status
- API endpoint accessibility

## Current Environment Status

✅ **Ready for testing**:
- Node.js v20.18.1 installed
- Dependencies installed
- All required environment variables configured
- Scripts are executable

❌ **Missing**:
- Development server not running
- Need to start with `npm run dev`

## Testing Workflow

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Get an access token**:
   - Navigate to http://localhost:3000
   - Log into the application
   - Open browser dev tools → Application → Local Storage
   - Find `sb-<project-id>-auth-token` and copy the `access_token` value

3. **Run automated tests**:
   ```bash
   ./test-meal-plan-api.sh <YOUR_ACCESS_TOKEN>
   ```

4. **Manual testing** (optional):
   Follow the examples in `MEAL_PLAN_API_TEST.md`

## Key Validation Points

The tests will verify:

1. **Authentication**: Proper Bearer token validation
2. **Input Validation**: Prompt length requirements (10-1000 chars)
3. **Response Structure**: Complete JSON structure with all required fields
4. **Content Quality**: French language, realistic ingredients, detailed nutrition
5. **Error Handling**: Appropriate HTTP status codes and error messages

## Integration with Frontend

The API response is processed by `transformMealPlanData()` in `/lib/gemini.ts` which:
- Converts API format to frontend-expected format
- Handles meal type mapping (breakfast/lunch/dinner/snacks)
- Calculates nutrition averages and generates shopping lists
- Supports both single snacks and arrays of snacks

## AI Generation Features

The API uses Google Gemini 2.0 Flash with:
- Retry logic (up to 3 attempts)
- JSON validation and cleanup
- Enhanced prompting for consistent French output
- Structured nutrition data with per-100g ingredient information
- Comprehensive meal instructions and preparation details

## Files Created for Testing

- `test-meal-plan-api.sh` - Automated test script
- `MEAL_PLAN_API_TEST.md` - Manual testing guide
- `verify-setup.sh` - Environment verification
- `API_TEST_SUMMARY.md` - This summary (optional for cleanup)

All files are in the project root directory and ready to use.