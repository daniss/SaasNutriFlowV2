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

    const enhancedPrompt = `Tu es un nutritionniste expert. Crée un plan alimentaire en français.

DEMANDE: ${prompt}
DURÉE: ${duration} jours
CALORIES: ${targetCalories} par jour
TYPE: ${dietType}
RESTRICTIONS: ${restrictions.length > 0 ? restrictions.join(", ") : "Aucune"}

RÈGLES ABSOLUES:
1. RÉPONSE UNIQUEMENT EN JSON VALIDE - AUCUN TEXTE
2. GÉNÈRE EXACTEMENT ${duration} JOURS
3. CHAQUE REPAS DOIT AVOIR ingredientsNutrition avec les macros

FORMAT JSON OBLIGATOIRE:
{
  "name": "Plan X jours",
  "description": "Description du plan",
  "totalDays": ${duration},
  "averageCaloriesPerDay": ${targetCalories},
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
          "name": "Nom du repas",
          "description": "Description",
          "calories": 400,
          "protein": 15,
          "carbs": 50,
          "fat": 12,
          "fiber": 8,
          "prepTime": 10,
          "cookTime": 5,
          "ingredients": ["80g flocons d'avoine", "250ml lait"],
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
          "instructions": ["Étape 1", "Étape 2"],
          "tags": ["petit-déjeuner"]
        },
        "lunch": { /* même structure */ },
        "dinner": { /* même structure */ },
        "snacks": [{ /* même structure que breakfast */ }]
      },
      "totalCalories": ${targetCalories},
      "totalProtein": 150,
      "totalCarbs": 200,
      "totalFat": 80
    }
  ]
}

GÉNÈRE LE JSON COMPLET MAINTENANT:`;

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
