import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// Server-side only - API key is not exposed to client
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY environment variable is required");
}

const genAI = new GoogleGenerativeAI(apiKey);

export async function POST(request: NextRequest) {
  try {
    // Get auth token from header
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const token = authHeader.split(" ")[1];

    // Validate token with Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: "Invalid authentication token" },
        { status: 401 }
      );
    }

    const body = await request.json();

    const {
      prompt,
      clientId,
      duration = 7,
      targetCalories = 2000,
      dietType = "balanced",
      restrictions = [],
      goals = "",
    } = body;

    // Validate input
    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    if (prompt.length < 10 || prompt.length > 1000) {
      return NextResponse.json(
        { error: "Prompt must be between 10 and 1000 characters" },
        { status: 400 }
      );
    }

    // Rate limiting check (basic implementation)
    // In production, you'd want to use a more sophisticated rate limiting solution

    // Generate meal plan using Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const enhancedPrompt = `Crée un plan alimentaire JSON français.

${prompt} - ${duration} jours, ${targetCalories} cal/jour, ${dietType}
${restrictions.length > 0 ? `Restrictions: ${restrictions.join(", ")}` : ""}

IMPORTANT:
- MAX 3 ingrédients par repas
- Descriptions courtes
- ingredientsNutrition obligatoire

JSON uniquement:
{
  "name": "Plan ${duration} jours",
  "description": "Plan ${targetCalories} calories",
  "totalDays": ${duration},
  "averageCaloriesPerDay": ${targetCalories},
  "nutritionSummary": {"protein": "25%", "carbohydrates": "45%", "fat": "30%"},
  "days": [
    {
      "day": 1,
      "meals": {
        "breakfast": {
          "name": "Petit-déjeuner",
          "description": "Repas matinal",
          "calories": ${Math.round(targetCalories * 0.25)},
          "protein": ${Math.round(targetCalories * 0.25 * 0.15 / 4)},
          "carbs": ${Math.round(targetCalories * 0.25 * 0.55 / 4)},
          "fat": ${Math.round(targetCalories * 0.25 * 0.30 / 9)},
          "fiber": 5,
          "prepTime": 10,
          "cookTime": 5,
          "ingredients": ["50g avoine", "200ml lait", "1 banane"],
          "ingredientsNutrition": [
            {"name": "avoine", "unit": "g", "caloriesPer100": 389, "proteinPer100": 16.9, "carbsPer100": 66.3, "fatPer100": 6.9, "fiberPer100": 10.6},
            {"name": "lait", "unit": "ml", "caloriesPer100": 42, "proteinPer100": 3.4, "carbsPer100": 4.8, "fatPer100": 1.0, "fiberPer100": 0},
            {"name": "banane", "unit": "piece", "caloriesPer100": 89, "proteinPer100": 1.1, "carbsPer100": 22.8, "fatPer100": 0.3, "fiberPer100": 2.6}
          ],
          "instructions": ["Mélanger", "Servir"],
          "tags": ["petit-déjeuner"]
        },
        "lunch": {
          "name": "Déjeuner",
          "description": "Repas principal",
          "calories": ${Math.round(targetCalories * 0.35)},
          "protein": ${Math.round(targetCalories * 0.35 * 0.20 / 4)},
          "carbs": ${Math.round(targetCalories * 0.35 * 0.50 / 4)},
          "fat": ${Math.round(targetCalories * 0.35 * 0.30 / 9)},
          "fiber": 8,
          "prepTime": 15,
          "cookTime": 10,
          "ingredients": ["100g quinoa", "150g légumes", "15ml huile"],
          "ingredientsNutrition": [
            {"name": "quinoa", "unit": "g", "caloriesPer100": 368, "proteinPer100": 14.1, "carbsPer100": 64.2, "fatPer100": 6.1, "fiberPer100": 7.0},
            {"name": "légumes", "unit": "g", "caloriesPer100": 25, "proteinPer100": 2.0, "carbsPer100": 5.0, "fatPer100": 0.2, "fiberPer100": 3.0},
            {"name": "huile", "unit": "ml", "caloriesPer100": 884, "proteinPer100": 0, "carbsPer100": 0, "fatPer100": 100, "fiberPer100": 0}
          ],
          "instructions": ["Cuire", "Mélanger"],
          "tags": ["déjeuner"]
        },
        "dinner": {
          "name": "Dîner",
          "description": "Repas du soir",
          "calories": ${Math.round(targetCalories * 0.30)},
          "protein": ${Math.round(targetCalories * 0.30 * 0.25 / 4)},
          "carbs": ${Math.round(targetCalories * 0.30 * 0.45 / 4)},
          "fat": ${Math.round(targetCalories * 0.30 * 0.30 / 9)},
          "fiber": 6,
          "prepTime": 10,
          "cookTime": 15,
          "ingredients": ["120g poisson", "200g légumes", "10ml huile"],
          "ingredientsNutrition": [
            {"name": "poisson", "unit": "g", "caloriesPer100": 150, "proteinPer100": 25, "carbsPer100": 0, "fatPer100": 5, "fiberPer100": 0},
            {"name": "légumes", "unit": "g", "caloriesPer100": 25, "proteinPer100": 2.0, "carbsPer100": 5.0, "fatPer100": 0.2, "fiberPer100": 3.0},
            {"name": "huile", "unit": "ml", "caloriesPer100": 884, "proteinPer100": 0, "carbsPer100": 0, "fatPer100": 100, "fiberPer100": 0}
          ],
          "instructions": ["Griller", "Servir"],
          "tags": ["dîner"]
        },
        "snacks": [{"name": "Yaourt", "description": "Collation", "calories": ${Math.round(targetCalories * 0.10)}, "protein": 9, "carbs": 27, "fat": 4, "fiber": 3, "prepTime": 2, "cookTime": 0, "ingredients": ["150g yaourt", "20g noix"], "ingredientsNutrition": [{"name": "yaourt", "unit": "g", "caloriesPer100": 59, "proteinPer100": 10, "carbsPer100": 3.6, "fatPer100": 0.4, "fiberPer100": 0}, {"name": "noix", "unit": "g", "caloriesPer100": 654, "proteinPer100": 15.2, "carbsPer100": 13.7, "fatPer100": 65.2, "fiberPer100": 6.7}], "instructions": ["Mélanger"], "tags": ["collation"]}]
      },
      "totalCalories": ${targetCalories},
      "totalProtein": ${Math.round(targetCalories * 0.20 / 4)},
      "totalCarbs": ${Math.round(targetCalories * 0.50 / 4)},
      "totalFat": ${Math.round(targetCalories * 0.30 / 9)}
    }
  ]
}

Génère ${duration} jours identiques avec variations de repas:`;

    // Retry logic for incomplete generations
    let generatedPlan;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      attempts++;
      console.log(`🤖 Attempt ${attempts}/${maxAttempts} to generate ${duration}-day meal plan...`);

      try {
        const result = await model.generateContent(enhancedPrompt);
        const response = await result.response;
        const text = response.text().trim();
        
        console.log(`📏 AI Response length: ${text.length} characters`);

        // Clean and extract JSON from response
        let jsonText = text.trim();
        
        // Remove markdown code blocks if present
        jsonText = jsonText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
        
        // Find JSON boundaries
        const jsonStart = jsonText.indexOf("{");
        const jsonEnd = jsonText.lastIndexOf("}");
        
        if (jsonStart === -1 || jsonEnd === -1) {
          console.error(`Attempt ${attempts}: No valid JSON brackets found in response:`, text.substring(0, 200));
          if (attempts === maxAttempts) throw new Error("No JSON found in response after all attempts");
          continue;
        }
        
        // Check if JSON appears to be truncated
        const lastChars = text.substring(text.length - 10);
        if (!lastChars.includes('}') && !lastChars.includes(']')) {
          console.error(`Attempt ${attempts}: Response appears truncated. Last 10 chars: "${lastChars}"`);
          if (attempts === maxAttempts) throw new Error("AI response truncated - try shorter prompt");
          continue;
        }
        
        // Extract JSON content
        jsonText = jsonText.substring(jsonStart, jsonEnd + 1);
        
        // Clean up common JSON issues
        jsonText = jsonText
          .replace(/,\s*}/g, '}')  // Remove trailing commas before closing braces
          .replace(/,\s*]/g, ']')  // Remove trailing commas before closing brackets
          .replace(/\/\*[^*]*\*\//g, '')  // Remove /* comments */
          .replace(/\/\/.*$/gm, '');  // Remove // comments

        try {
          generatedPlan = JSON.parse(jsonText);
        } catch (parseError) {
          console.error(`Attempt ${attempts}: JSON parsing error:`, parseError);
          console.error("Attempted to parse:", jsonText.substring(0, 500));
          if (attempts === maxAttempts) throw new Error("Invalid JSON response from AI after all attempts");
          continue;
        }

        // Enhanced validation
        if (
          !generatedPlan.name ||
          !generatedPlan.days ||
          !Array.isArray(generatedPlan.days) ||
          generatedPlan.days.length !== duration
        ) {
          console.error(`Attempt ${attempts}: Invalid structure:`, {
            hasName: !!generatedPlan.name,
            hasDays: !!generatedPlan.days,
            isArray: Array.isArray(generatedPlan.days),
            daysCount: generatedPlan.days?.length,
            expectedDays: duration
          });
          
          if (attempts === maxAttempts) {
            throw new Error(`Invalid meal plan structure after ${maxAttempts} attempts - AI generated ${generatedPlan.days?.length || 0} days instead of ${duration}`);
          }
          continue;
        }

        // Validate each day has the required structure
        let dayValidationFailed = false;
        for (let i = 0; i < generatedPlan.days.length; i++) {
          const day = generatedPlan.days[i];
          if (!day.meals || !day.meals.breakfast || !day.meals.lunch || !day.meals.dinner) {
            console.error(`Attempt ${attempts}: Day ${i + 1} is missing required meals`);
            dayValidationFailed = true;
            break;
          }
        }

        if (dayValidationFailed) {
          if (attempts === maxAttempts) {
            throw new Error(`Day structure validation failed after ${maxAttempts} attempts`);
          }
          continue;
        }

        // If we reach here, generation was successful
        console.log(`✅ Successfully generated ${duration}-day meal plan on attempt ${attempts}`);
        break;

      } catch (error) {
        console.error(`Attempt ${attempts} failed:`, error);
        if (attempts === maxAttempts) {
          throw error;
        }
        // Wait a bit before retry
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return NextResponse.json({
      success: true,
      data: generatedPlan,
    });
  } catch (error) {
    console.error("Meal plan generation error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate meal plan",
      },
      { status: 500 }
    );
  }
}
