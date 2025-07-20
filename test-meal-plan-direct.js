const { GoogleGenerativeAI } = require("@google/generative-ai");

// Test the AI prompt directly to see if it generates valid JSON
async function testAIPrompt() {
  const apiKey = process.env.GEMINI_API_KEY || "AIzaSyATj4hPHzA0Mc6b989U0Ipq41Cz1Fe88jo";
  if (!apiKey) {
    console.error("❌ No Gemini API key found");
    return;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  // Use the exact same prompt from the API
  const duration = 2;
  const targetCalories = 1800;
  const dietType = "balanced";
  const restrictions = [];
  const prompt = "Plan équilibré pour une semaine";

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

  console.log("🤖 Testing AI prompt generation...");
  console.log("📝 Prompt length:", enhancedPrompt.length);
  
  try {
    const result = await model.generateContent(enhancedPrompt);
    const response = await result.response;
    const text = response.text().trim();
    
    console.log("\n📄 Raw AI Response (first 500 chars):");
    console.log(text.substring(0, 500) + "...");
    
    // Apply the same cleaning logic as the API
    let jsonText = text.trim();
    
    // Remove markdown code blocks if present
    jsonText = jsonText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    
    // Find JSON boundaries
    const jsonStart = jsonText.indexOf("{");
    const jsonEnd = jsonText.lastIndexOf("}");
    
    if (jsonStart === -1 || jsonEnd === -1) {
      console.error("❌ No valid JSON brackets found");
      return;
    }
    
    // Extract JSON content
    jsonText = jsonText.substring(jsonStart, jsonEnd + 1);
    
    // Clean up common JSON issues
    jsonText = jsonText
      .replace(/,\s*}/g, '}')  // Remove trailing commas before closing braces
      .replace(/,\s*]/g, ']')  // Remove trailing commas before closing brackets
      .replace(/\/\*[^*]*\*\//g, '')  // Remove /* comments */
      .replace(/\/\/.*$/gm, '');  // Remove // comments
    
    console.log("\n🧹 Cleaned JSON (first 500 chars):");
    console.log(jsonText.substring(0, 500) + "...");
    
    // Try to parse JSON
    const parsedData = JSON.parse(jsonText);
    
    console.log("\n✅ JSON parsing successful!");
    console.log("📊 Structure validation:");
    console.log("- Name:", parsedData.name);
    console.log("- Total Days:", parsedData.totalDays);
    console.log("- Days Array Length:", parsedData.days?.length);
    console.log("- Expected Days:", duration);
    console.log("- Match:", parsedData.days?.length === duration ? "✅" : "❌");
    
    // Validate structure
    if (parsedData.days && Array.isArray(parsedData.days)) {
      parsedData.days.forEach((day, index) => {
        console.log(`\n📅 Day ${index + 1} validation:`);
        console.log("- Has meals:", !!day.meals ? "✅" : "❌");
        console.log("- Has breakfast:", !!day.meals?.breakfast ? "✅" : "❌");
        console.log("- Has lunch:", !!day.meals?.lunch ? "✅" : "❌");
        console.log("- Has dinner:", !!day.meals?.dinner ? "✅" : "❌");
        
        // Check ingredientsNutrition in breakfast
        if (day.meals?.breakfast?.ingredientsNutrition) {
          console.log("- Breakfast has ingredientsNutrition:", Array.isArray(day.meals.breakfast.ingredientsNutrition) ? "✅" : "❌");
          console.log("- Breakfast ingredients count:", day.meals.breakfast.ingredientsNutrition.length);
        } else {
          console.log("- Breakfast has ingredientsNutrition: ❌");
        }
      });
    }
    
    console.log("\n🎉 Test completed successfully!");
    
  } catch (error) {
    console.error("❌ Error testing AI prompt:", error.message);
    if (error.message.includes("JSON")) {
      console.log("\n🔍 This indicates the AI generated invalid JSON structure");
    }
  }
}

// Run the test
testAIPrompt().catch(console.error);