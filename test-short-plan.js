const { GoogleGenerativeAI } = require("@google/generative-ai");

// Test the single request path for short plans (≤4 days)
async function testShortPlan() {
  const apiKey = process.env.GEMINI_API_KEY || "AIzaSyATj4hPHzA0Mc6b989U0Ipq41Cz1Fe88jo";
  if (!apiKey) {
    console.error("❌ No Gemini API key found");
    return;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  // Test parameters for short plan
  const duration = 3;
  const targetCalories = 1800;
  const dietType = "balanced";
  const restrictions = [];
  const prompt = "Plan équilibré pour 3 jours";

  console.log("🧪 Testing short plan generation (single request path)...");
  console.log(`📝 Prompt: "${prompt}"`);
  console.log(`📊 Parameters: ${duration} days, ${targetCalories} calories\n`);

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

  console.log(`📏 Short plan prompt length: ${enhancedPrompt.length} characters`);

  try {
    const result = await model.generateContent(enhancedPrompt);
    const response = await result.response;
    const text = response.text().trim();
    
    console.log(`📄 Response length: ${text.length} characters`);
    console.log("📄 First 200 chars:", text.substring(0, 200));
    console.log("📄 Last 100 chars:", text.substring(text.length - 100));
    
    // Check for truncation
    const lastChars = text.substring(text.length - 10);
    const appearsComplete = lastChars.includes('}') || lastChars.includes(']');
    console.log(`🔍 Appears complete: ${appearsComplete ? '✅' : '❌'}`);
    
    if (!appearsComplete) {
      console.log("❌ Short plan response appears truncated");
      return;
    }
    
    // Clean and parse
    let jsonText = text.trim();
    jsonText = jsonText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    
    const jsonStart = jsonText.indexOf("{");
    const jsonEnd = jsonText.lastIndexOf("}");
    
    if (jsonStart === -1 || jsonEnd === -1) {
      console.log("❌ No JSON boundaries found");
      return;
    }
    
    jsonText = jsonText.substring(jsonStart, jsonEnd + 1);
    jsonText = jsonText
      .replace(/,\s*}/g, '}')
      .replace(/,\s*]/g, ']')
      .replace(/\/\*[^*]*\*\//g, '')
      .replace(/\/\/.*$/gm, '');
    
    console.log(`🧹 Cleaned JSON length: ${jsonText.length} characters`);
    
    const parsedData = JSON.parse(jsonText);
    
    console.log("\n🎯 SHORT PLAN RESULTS:");
    console.log(`✅ Total days generated: ${parsedData.days?.length}`);
    console.log(`✅ Expected days: ${duration}`);
    console.log(`✅ Match: ${parsedData.days?.length === duration ? 'PERFECT' : 'MISMATCH'}`);
    console.log(`✅ Plan name: "${parsedData.name}"`);
    
    // Validate structure
    if (parsedData.days && Array.isArray(parsedData.days)) {
      parsedData.days.forEach((day, index) => {
        const hasAllMeals = day.meals?.breakfast && day.meals?.lunch && day.meals?.dinner;
        const hasNutrition = day.meals?.breakfast?.ingredientsNutrition?.length > 0;
        console.log(`  📅 Day ${index + 1}: Meals=${hasAllMeals ? '✅' : '❌'}, Nutrition=${hasNutrition ? '✅' : '❌'}`);
      });
    }
    
    console.log("\n🎉 SHORT PLAN TEST RESULT:");
    if (parsedData.days?.length === duration && parsedData.days.every(day => 
      day.meals?.breakfast && day.meals?.lunch && day.meals?.dinner
    )) {
      console.log("✅ SUCCESS - Short plan generation works perfectly!");
    } else {
      console.log("❌ FAILED - Short plan generation needs adjustment");
    }
    
  } catch (error) {
    console.error("💥 SHORT PLAN TEST FAILED:", error.message);
    console.log("❌ The short plan solution has issues");
  }
}

// Run the test
testShortPlan().catch(console.error);