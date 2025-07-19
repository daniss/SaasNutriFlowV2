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

    // For longer plans (5+ days), generate in chunks to avoid truncation
    if (duration >= 5) {
      const maxDays = 3; // Generate max 3 days per request to avoid truncation
      
      console.log(`📦 Splitting ${duration}-day plan into chunks of ${maxDays} days`);
      
      let allDays = [];
      
      for (let chunk = 0; chunk < Math.ceil(duration / maxDays); chunk++) {
        const startDay = chunk * maxDays + 1;
        const endDay = Math.min(startDay + maxDays - 1, duration);
        const chunkDays = endDay - startDay + 1;
        
        console.log(`🔄 Generating days ${startDay}-${endDay} (${chunkDays} days)`);
        
        const chunkPrompt = `Génère ${chunkDays} jours de plan alimentaire méditerranéen JSON français.

${prompt} - Jours ${startDay} à ${endDay}, ${targetCalories} cal/jour
${restrictions.length > 0 ? `Restrictions: ${restrictions.join(", ")}` : ""}

ULTRA-CONCIS:
- 2 ingrédients max par repas
- 1 instruction max par repas
- ingredientsNutrition obligatoire

JSON direct:
{"days":[
${Array.from({length: chunkDays}, (_, i) => `
{"day":${startDay + i},"meals":{
"breakfast":{"name":"PDJ ${startDay + i}","description":"Repas","calories":${Math.round(targetCalories * 0.25)},"protein":17,"carbs":62,"fat":15,"fiber":5,"prepTime":5,"cookTime":5,"ingredients":["50g avoine","200ml lait"],"ingredientsNutrition":[{"name":"avoine","unit":"g","caloriesPer100":389,"proteinPer100":16.9,"carbsPer100":66.3,"fatPer100":6.9,"fiberPer100":10.6},{"name":"lait","unit":"ml","caloriesPer100":42,"proteinPer100":3.4,"carbsPer100":4.8,"fatPer100":1.0,"fiberPer100":0}],"instructions":["Mélanger"],"tags":["matin"]},
"lunch":{"name":"DEJ ${startDay + i}","description":"Repas","calories":${Math.round(targetCalories * 0.35)},"protein":32,"carbs":79,"fat":21,"fiber":8,"prepTime":10,"cookTime":10,"ingredients":["100g quinoa","150g légumes"],"ingredientsNutrition":[{"name":"quinoa","unit":"g","caloriesPer100":368,"proteinPer100":14.1,"carbsPer100":64.2,"fatPer100":6.1,"fiberPer100":7.0},{"name":"légumes","unit":"g","caloriesPer100":25,"proteinPer100":2.0,"carbsPer100":5.0,"fatPer100":0.2,"fiberPer100":3.0}],"instructions":["Cuire"],"tags":["midi"]},
"dinner":{"name":"DIN ${startDay + i}","description":"Repas","calories":${Math.round(targetCalories * 0.30)},"protein":34,"carbs":61,"fat":18,"fiber":6,"prepTime":10,"cookTime":15,"ingredients":["120g poisson","200g légumes"],"ingredientsNutrition":[{"name":"poisson","unit":"g","caloriesPer100":150,"proteinPer100":25,"carbsPer100":0,"fatPer100":5,"fiberPer100":0},{"name":"légumes","unit":"g","caloriesPer100":25,"proteinPer100":2.0,"carbsPer100":5.0,"fatPer100":0.2,"fiberPer100":3.0}],"instructions":["Griller"],"tags":["soir"]},
"snacks":[{"name":"Snack","description":"Collation","calories":${Math.round(targetCalories * 0.10)},"protein":9,"carbs":27,"fat":4,"fiber":3,"prepTime":2,"cookTime":0,"ingredients":["150g yaourt"],"ingredientsNutrition":[{"name":"yaourt","unit":"g","caloriesPer100":59,"proteinPer100":10,"carbsPer100":3.6,"fatPer100":0.4,"fiberPer100":0}],"instructions":["Servir"],"tags":["snack"]}]
},"totalCalories":${targetCalories},"totalProtein":90,"totalCarbs":225,"totalFat":60}`).join(",")}
]}

Génère EXACTEMENT ce format avec variations d'ingrédients:`;
        
        try {
          const result = await model.generateContent(chunkPrompt);
          const response = await result.response;
          const text = response.text().trim();
          
          console.log(`📏 Chunk ${chunk + 1} response length: ${text.length} characters`);
          
          // Clean and parse chunk
          let jsonText = text.trim();
          jsonText = jsonText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
          
          const jsonStart = jsonText.indexOf("{");
          const jsonEnd = jsonText.lastIndexOf("}");
          
          if (jsonStart === -1 || jsonEnd === -1) {
            throw new Error(`No valid JSON in chunk ${chunk + 1}`);
          }
          
          jsonText = jsonText.substring(jsonStart, jsonEnd + 1);
          jsonText = jsonText
            .replace(/,\s*}/g, '}')
            .replace(/,\s*]/g, ']')
            .replace(/\/\*[^*]*\*\//g, '')
            .replace(/\/\/.*$/gm, '');
          
          const chunkData = JSON.parse(jsonText);
          
          if (chunkData.days && Array.isArray(chunkData.days)) {
            allDays.push(...chunkData.days);
            console.log(`✅ Chunk ${chunk + 1} successful: ${chunkData.days.length} days`);
          } else {
            throw new Error(`Invalid chunk structure ${chunk + 1}`);
          }
          
        } catch (chunkError) {
          console.error(`❌ Chunk ${chunk + 1} failed:`, chunkError.message);
          throw new Error(`Failed to generate chunk ${chunk + 1}: ${chunkError.message}`);
        }
      }
      
      // Assemble final plan
      generatedPlan = {
        name: `Plan ${duration} jours`,
        description: `Plan équilibré ${targetCalories} calories`,
        totalDays: duration,
        averageCaloriesPerDay: targetCalories,
        nutritionSummary: {"protein": "25%", "carbohydrates": "45%", "fat": "30%"},
        days: allDays
      };
      
      console.log(`✅ Combined plan: ${allDays.length} days total`);
      
    } else {
      // For shorter plans (≤4 days), use single request
      const enhancedPrompt = `Plan alimentaire JSON français concis.

${prompt} - ${duration} jours, ${targetCalories} cal/jour
${restrictions.length > 0 ? `Restrictions: ${restrictions.join(", ")}` : ""}

MAX 2 ingrédients/repas. JSON direct:
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
        "breakfast": {"name": "PDJ", "description": "Matin", "calories": ${Math.round(targetCalories * 0.25)}, "protein": 17, "carbs": 62, "fat": 15, "fiber": 5, "prepTime": 5, "cookTime": 5, "ingredients": ["50g avoine", "200ml lait"], "ingredientsNutrition": [{"name": "avoine", "unit": "g", "caloriesPer100": 389, "proteinPer100": 16.9, "carbsPer100": 66.3, "fatPer100": 6.9, "fiberPer100": 10.6}, {"name": "lait", "unit": "ml", "caloriesPer100": 42, "proteinPer100": 3.4, "carbsPer100": 4.8, "fatPer100": 1.0, "fiberPer100": 0}], "instructions": ["Mélanger"], "tags": ["matin"]},
        "lunch": {"name": "DEJ", "description": "Midi", "calories": ${Math.round(targetCalories * 0.35)}, "protein": 32, "carbs": 79, "fat": 21, "fiber": 8, "prepTime": 10, "cookTime": 10, "ingredients": ["100g quinoa", "150g légumes"], "ingredientsNutrition": [{"name": "quinoa", "unit": "g", "caloriesPer100": 368, "proteinPer100": 14.1, "carbsPer100": 64.2, "fatPer100": 6.1, "fiberPer100": 7.0}, {"name": "légumes", "unit": "g", "caloriesPer100": 25, "proteinPer100": 2.0, "carbsPer100": 5.0, "fatPer100": 0.2, "fiberPer100": 3.0}], "instructions": ["Cuire"], "tags": ["midi"]},
        "dinner": {"name": "DIN", "description": "Soir", "calories": ${Math.round(targetCalories * 0.30)}, "protein": 34, "carbs": 61, "fat": 18, "fiber": 6, "prepTime": 10, "cookTime": 15, "ingredients": ["120g poisson", "200g légumes"], "ingredientsNutrition": [{"name": "poisson", "unit": "g", "caloriesPer100": 150, "proteinPer100": 25, "carbsPer100": 0, "fatPer100": 5, "fiberPer100": 0}, {"name": "légumes", "unit": "g", "caloriesPer100": 25, "proteinPer100": 2.0, "carbsPer100": 5.0, "fatPer100": 0.2, "fiberPer100": 3.0}], "instructions": ["Griller"], "tags": ["soir"]},
        "snacks": [{"name": "Snack", "description": "Collation", "calories": ${Math.round(targetCalories * 0.10)}, "protein": 9, "carbs": 27, "fat": 4, "fiber": 3, "prepTime": 2, "cookTime": 0, "ingredients": ["150g yaourt"], "ingredientsNutrition": [{"name": "yaourt", "unit": "g", "caloriesPer100": 59, "proteinPer100": 10, "carbsPer100": 3.6, "fatPer100": 0.4, "fiberPer100": 0}], "instructions": ["Servir"], "tags": ["snack"]}]
      },
      "totalCalories": ${targetCalories},
      "totalProtein": 90,
      "totalCarbs": 225,
      "totalFat": 60
    }
  ]
}

Répète pour ${duration} jours avec variations:`;

      // Single request retry logic for short plans
      let attempts = 0;
      const maxAttempts = 3;

      while (attempts < maxAttempts) {
        attempts++;
        console.log(`🤖 Attempt ${attempts}/${maxAttempts} for short plan...`);

        try {
          const result = await model.generateContent(enhancedPrompt);
          const response = await result.response;
          const text = response.text().trim();
          
          console.log(`📏 Short plan response length: ${text.length} characters`);

          // Clean and extract JSON
          let jsonText = text.trim();
          jsonText = jsonText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
          
          const jsonStart = jsonText.indexOf("{");
          const jsonEnd = jsonText.lastIndexOf("}");
          
          if (jsonStart === -1 || jsonEnd === -1) {
            console.error(`Short plan attempt ${attempts}: No valid JSON found`);
            if (attempts === maxAttempts) throw new Error("No JSON found after all attempts");
            continue;
          }
          
          jsonText = jsonText.substring(jsonStart, jsonEnd + 1);
          jsonText = jsonText
            .replace(/,\s*}/g, '}')
            .replace(/,\s*]/g, ']')
            .replace(/\/\*[^*]*\*\//g, '')
            .replace(/\/\/.*$/gm, '');

          generatedPlan = JSON.parse(jsonText);
          
          // Validate structure
          if (!generatedPlan.name || !generatedPlan.days || !Array.isArray(generatedPlan.days) || generatedPlan.days.length !== duration) {
            console.error(`Short plan attempt ${attempts}: Invalid structure`);
            if (attempts === maxAttempts) throw new Error("Invalid structure after all attempts");
            continue;
          }

          console.log(`✅ Short plan successful on attempt ${attempts}`);
          break;

        } catch (error) {
          console.error(`Short plan attempt ${attempts} failed:`, error.message);
          if (attempts === maxAttempts) throw error;
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
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
