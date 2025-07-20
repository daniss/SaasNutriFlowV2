const { GoogleGenerativeAI } = require("@google/generative-ai");

// Test the optimized prompt that should avoid truncation
async function testOptimizedPrompt() {
  const apiKey = process.env.GEMINI_API_KEY || "AIzaSyATj4hPHzA0Mc6b989U0Ipq41Cz1Fe88jo";
  if (!apiKey) {
    console.error("❌ No Gemini API key found");
    return;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  // Use the exact same parameters as the problematic case
  const duration = 7;
  const targetCalories = 1800;
  const dietType = "balanced";
  const restrictions = [];
  const prompt = "Plan méditerranéen de 7 jours pour la santé cardiaque avec 1800 calories par jour";

  // Use the new optimized prompt from the API
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

  console.log("🚀 Testing optimized prompt for 7-day Mediterranean plan...");
  console.log("📝 Optimized prompt length:", enhancedPrompt.length);
  console.log("🎯 Target: Avoid truncation, generate valid JSON\n");
  
  try {
    const result = await model.generateContent(enhancedPrompt);
    const response = await result.response;
    const text = response.text().trim();
    
    console.log(`📏 AI Response length: ${text.length} characters`);
    console.log("📄 First 200 chars:", text.substring(0, 200));
    console.log("📄 Last 100 chars:", text.substring(text.length - 100));
    
    // Check for truncation
    const lastChars = text.substring(text.length - 10);
    const appearsComplete = lastChars.includes('}') || lastChars.includes(']');
    console.log(`🔍 Appears complete: ${appearsComplete ? '✅' : '❌'} (last 10 chars: "${lastChars}")`);
    
    if (!appearsComplete) {
      console.log("❌ Response appears truncated - this would cause the JSON parsing error");
      return;
    }
    
    // Apply same cleaning as API
    let jsonText = text.trim();
    jsonText = jsonText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    
    const jsonStart = jsonText.indexOf("{");
    const jsonEnd = jsonText.lastIndexOf("}");
    
    if (jsonStart === -1 || jsonEnd === -1) {
      console.log("❌ No JSON boundaries found");
      return;
    }
    
    jsonText = jsonText.substring(jsonStart, jsonEnd + 1);
    
    // Clean up
    jsonText = jsonText
      .replace(/,\s*}/g, '}')
      .replace(/,\s*]/g, ']')
      .replace(/\/\*[^*]*\*\//g, '')
      .replace(/\/\/.*$/gm, '');
    
    console.log(`🧹 Cleaned JSON length: ${jsonText.length} characters`);
    
    // Parse JSON
    try {
      const parsedData = JSON.parse(jsonText);
      
      console.log("✅ JSON parsing successful!");
      console.log("📊 Validation results:");
      console.log("- Name:", parsedData.name);
      console.log("- Total Days:", parsedData.totalDays);
      console.log("- Days Array Length:", parsedData.days?.length);
      console.log("- Expected Days:", duration);
      console.log("- Structure Match:", parsedData.days?.length === duration ? "✅" : "❌");
      
      // Validate each day
      if (parsedData.days && Array.isArray(parsedData.days)) {
        let allDaysValid = true;
        parsedData.days.forEach((day, index) => {
          const hasAllMeals = day.meals?.breakfast && day.meals?.lunch && day.meals?.dinner;
          const breakfastHasNutrition = day.meals?.breakfast?.ingredientsNutrition?.length > 0;
          
          console.log(`📅 Day ${index + 1}: Meals=${hasAllMeals ? '✅' : '❌'}, Nutrition=${breakfastHasNutrition ? '✅' : '❌'}`);
          
          if (!hasAllMeals || !breakfastHasNutrition) {
            allDaysValid = false;
          }
        });
        
        console.log(`\n🎉 Overall result: ${allDaysValid ? 'SUCCESS' : 'PARTIAL SUCCESS'}`);
        console.log("✅ This should resolve the JSON parsing error!");
        
      } else {
        console.log("❌ Days structure invalid");
      }
      
    } catch (parseError) {
      console.error("❌ JSON parsing still failed:", parseError.message);
      console.log("📝 This indicates the optimization didn't fully work");
    }
    
  } catch (error) {
    console.error("❌ AI generation error:", error.message);
  }
}

testOptimizedPrompt().catch(console.error);