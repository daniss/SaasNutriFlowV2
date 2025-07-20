const { GoogleGenerativeAI } = require("@google/generative-ai");

// Test the specific problematic prompt
async function testSpecificPrompt() {
  const apiKey = process.env.GEMINI_API_KEY || "AIzaSyATj4hPHzA0Mc6b989U0Ipq41Cz1Fe88jo";
  if (!apiKey) {
    console.error("❌ No Gemini API key found");
    return;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  // Use the exact problematic prompt
  const duration = 7;
  const targetCalories = 1800;
  const dietType = "balanced";
  const restrictions = [];
  const prompt = "Plan méditerranéen de 7 jours pour la santé cardiaque avec 1800 calories par jour";

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

  console.log("🤖 Testing specific problematic prompt...");
  console.log("📝 Prompt:", prompt);
  console.log("📏 Prompt length:", enhancedPrompt.length);
  
  // Test with retry logic like the API
  for (let attempt = 1; attempt <= 3; attempt++) {
    console.log(`\n🔄 Attempt ${attempt}/3:`);
    
    try {
      const result = await model.generateContent(enhancedPrompt);
      const response = await result.response;
      const text = response.text().trim();
      
      console.log(`📄 Raw AI Response length: ${text.length}`);
      console.log("📄 First 300 chars:", text.substring(0, 300));
      console.log("📄 Last 100 chars:", text.substring(text.length - 100));
      
      // Apply the same cleaning logic as the API
      let jsonText = text.trim();
      
      // Remove markdown code blocks if present
      jsonText = jsonText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
      
      // Find JSON boundaries
      const jsonStart = jsonText.indexOf("{");
      const jsonEnd = jsonText.lastIndexOf("}");
      
      console.log(`🔍 JSON boundaries: start=${jsonStart}, end=${jsonEnd}`);
      
      if (jsonStart === -1 || jsonEnd === -1) {
        console.error(`❌ No valid JSON brackets found in attempt ${attempt}`);
        continue;
      }
      
      // Extract JSON content
      jsonText = jsonText.substring(jsonStart, jsonEnd + 1);
      
      console.log(`📏 Extracted JSON length: ${jsonText.length}`);
      console.log("🧹 First 200 chars after extraction:", jsonText.substring(0, 200));
      
      // Clean up common JSON issues
      const originalLength = jsonText.length;
      jsonText = jsonText
        .replace(/,\s*}/g, '}')  // Remove trailing commas before closing braces
        .replace(/,\s*]/g, ']')  // Remove trailing commas before closing brackets
        .replace(/\/\*[^*]*\*\//g, '')  // Remove /* comments */
        .replace(/\/\/.*$/gm, '');  // Remove // comments
      
      console.log(`🧽 Cleaned JSON length: ${jsonText.length} (removed ${originalLength - jsonText.length} chars)`);
      
      // Try to parse JSON
      try {
        const parsedData = JSON.parse(jsonText);
        
        console.log(`✅ JSON parsing successful on attempt ${attempt}!`);
        console.log("📊 Structure validation:");
        console.log("- Name:", parsedData.name);
        console.log("- Total Days:", parsedData.totalDays);
        console.log("- Days Array Length:", parsedData.days?.length);
        console.log("- Expected Days:", duration);
        console.log("- Match:", parsedData.days?.length === duration ? "✅" : "❌");
        
        // Quick structure check
        if (!parsedData.name || !parsedData.days || !Array.isArray(parsedData.days) || parsedData.days.length !== duration) {
          console.log("❌ Structure validation failed");
          continue;
        }
        
        // Check first day structure
        const firstDay = parsedData.days[0];
        if (!firstDay.meals || !firstDay.meals.breakfast || !firstDay.meals.lunch || !firstDay.meals.dinner) {
          console.log("❌ First day meal structure validation failed");
          continue;
        }
        
        console.log("🎉 All validations passed!");
        return parsedData;
        
      } catch (parseError) {
        console.error(`❌ JSON parsing error on attempt ${attempt}:`, parseError.message);
        console.log("📝 Problem area around error:");
        
        // Find the error position and show context
        const errorMatch = parseError.message.match(/position (\d+)/);
        if (errorMatch) {
          const pos = parseInt(errorMatch[1]);
          const start = Math.max(0, pos - 50);
          const end = Math.min(jsonText.length, pos + 50);
          console.log("Context:", jsonText.substring(start, end));
          console.log("Error at position:", pos);
        }
        
        // Show specific problematic characters
        const problematicChars = jsonText.match(/[^\x20-\x7E\n\r\t]/g);
        if (problematicChars) {
          console.log("🚨 Non-ASCII characters found:", problematicChars.slice(0, 10));
        }
      }
      
    } catch (error) {
      console.error(`❌ Generation error on attempt ${attempt}:`, error.message);
    }
    
    // Wait before retry
    if (attempt < 3) {
      console.log("⏳ Waiting 1 second before retry...");
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  console.log("\n💥 All attempts failed - this matches the reported error");
}

// Run the test
testSpecificPrompt().catch(console.error);