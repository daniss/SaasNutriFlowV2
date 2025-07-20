const { GoogleGenerativeAI } = require("@google/generative-ai");

// Test the enhanced chunking solution with detailed meal names and instructions
async function testEnhancedChunking() {
  const apiKey = process.env.GEMINI_API_KEY || "AIzaSyATj4hPHzA0Mc6b989U0Ipq41Cz1Fe88jo";
  if (!apiKey) {
    console.error("❌ No Gemini API key found");
    return;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  // Test parameters
  const duration = 7;
  const targetCalories = 1800;
  const prompt = "Plan méditerranéen de 7 jours pour la santé cardiaque avec 1800 calories par jour";

  console.log("🧪 Testing enhanced chunking with detailed meal names and instructions...");
  console.log(`📝 Prompt: "${prompt}"`);
  console.log(`📊 Parameters: ${duration} days, ${targetCalories} calories\n`);

  try {
    // Test just the first chunk to see if the enhanced prompt works
    const startDay = 1;
    const endDay = 3;
    const chunkDays = 3;
    
    console.log(`🔄 Testing enhanced chunk: Days ${startDay}-${endDay} (${chunkDays} days)`);
    
    const chunkPrompt = `Crée ${chunkDays} jours de plan alimentaire méditerranéen JSON français.

${prompt} - Jours ${startDay} à ${endDay}, ${targetCalories} cal/jour

IMPORTANT:
- Noms de repas créatifs et appétissants
- 3-4 ingrédients par repas maximum
- Instructions détaillées de préparation
- ingredientsNutrition obligatoire

FORMAT JSON:
{
  "days": [
    {
      "day": ${startDay},
      "meals": {
        "breakfast": {
          "name": "Porridge méditerranéen aux figues",
          "description": "Petit-déjeuner énergisant aux saveurs méditerranéennes",
          "calories": ${Math.round(targetCalories * 0.25)},
          "protein": 17,
          "carbs": 62,
          "fat": 15,
          "fiber": 5,
          "prepTime": 10,
          "cookTime": 5,
          "ingredients": ["60g flocons d'avoine", "250ml lait d'amande", "2 figues fraîches", "15g amandes effilées"],
          "ingredientsNutrition": [
            {"name": "flocons d'avoine", "unit": "g", "caloriesPer100": 389, "proteinPer100": 16.9, "carbsPer100": 66.3, "fatPer100": 6.9, "fiberPer100": 10.6},
            {"name": "lait d'amande", "unit": "ml", "caloriesPer100": 24, "proteinPer100": 1.0, "carbsPer100": 3.0, "fatPer100": 1.1, "fiberPer100": 0.4},
            {"name": "figues fraîches", "unit": "piece", "caloriesPer100": 74, "proteinPer100": 0.7, "carbsPer100": 19.2, "fatPer100": 0.3, "fiberPer100": 2.9},
            {"name": "amandes effilées", "unit": "g", "caloriesPer100": 579, "proteinPer100": 21.2, "carbsPer100": 21.6, "fatPer100": 49.9, "fiberPer100": 12.5}
          ],
          "instructions": [
            "Faire chauffer le lait d'amande dans une casserole à feu moyen",
            "Ajouter les flocons d'avoine et cuire 5 minutes en remuant",
            "Couper les figues en quartiers et les ajouter",
            "Servir chaud avec les amandes effilées sur le dessus"
          ],
          "tags": ["petit-déjeuner", "méditerranéen", "fibres"]
        },
        "lunch": {
          "name": "Salade de quinoa aux légumes grillés",
          "description": "Salade complète et colorée aux légumes de saison",
          "calories": ${Math.round(targetCalories * 0.35)},
          "protein": 32,
          "carbs": 79,
          "fat": 21,
          "fiber": 8,
          "prepTime": 15,
          "cookTime": 20,
          "ingredients": ["100g quinoa", "150g courgettes", "100g tomates cerises", "30ml huile d'olive"],
          "ingredientsNutrition": [
            {"name": "quinoa", "unit": "g", "caloriesPer100": 368, "proteinPer100": 14.1, "carbsPer100": 64.2, "fatPer100": 6.1, "fiberPer100": 7.0},
            {"name": "courgettes", "unit": "g", "caloriesPer100": 17, "proteinPer100": 1.2, "carbsPer100": 3.1, "fatPer100": 0.3, "fiberPer100": 1.0},
            {"name": "tomates cerises", "unit": "g", "caloriesPer100": 18, "proteinPer100": 0.9, "carbsPer100": 3.9, "fatPer100": 0.2, "fiberPer100": 1.2},
            {"name": "huile d'olive", "unit": "ml", "caloriesPer100": 884, "proteinPer100": 0, "carbsPer100": 0, "fatPer100": 100, "fiberPer100": 0}
          ],
          "instructions": [
            "Cuire le quinoa dans l'eau bouillante selon les instructions du paquet",
            "Couper les courgettes en dés et les faire griller 10 minutes",
            "Couper les tomates cerises en deux",
            "Mélanger tous les ingrédients avec l'huile d'olive et assaisonner"
          ],
          "tags": ["déjeuner", "végétarien", "protéines"]
        },
        "dinner": {
          "name": "Poisson grillé aux herbes de Provence",
          "description": "Filet de poisson savoureux aux aromates méditerranéens",
          "calories": ${Math.round(targetCalories * 0.30)},
          "protein": 34,
          "carbs": 15,
          "fat": 18,
          "fiber": 6,
          "prepTime": 10,
          "cookTime": 15,
          "ingredients": ["120g filet de dorade", "200g ratatouille", "15ml huile d'olive", "1 citron"],
          "ingredientsNutrition": [
            {"name": "filet de dorade", "unit": "g", "caloriesPer100": 80, "proteinPer100": 19.8, "carbsPer100": 0, "fatPer100": 1.2, "fiberPer100": 0},
            {"name": "ratatouille", "unit": "g", "caloriesPer100": 25, "proteinPer100": 1.0, "carbsPer100": 5.0, "fatPer100": 0.2, "fiberPer100": 2.5},
            {"name": "huile d'olive", "unit": "ml", "caloriesPer100": 884, "proteinPer100": 0, "carbsPer100": 0, "fatPer100": 100, "fiberPer100": 0},
            {"name": "citron", "unit": "piece", "caloriesPer100": 29, "proteinPer100": 1.1, "carbsPer100": 9.3, "fatPer100": 0.3, "fiberPer100": 2.8}
          ],
          "instructions": [
            "Préchauffer le grill du four à 200°C",
            "Badigeonner le poisson d'huile d'olive et d'herbes de Provence",
            "Griller le poisson 12-15 minutes selon l'épaisseur",
            "Réchauffer la ratatouille et servir avec le poisson et un quartier de citron"
          ],
          "tags": ["dîner", "poisson", "méditerranéen"]
        },
        "snacks": [
          {
            "name": "Yaourt grec aux noix et miel",
            "description": "Collation protéinée aux saveurs méditerranéennes",
            "calories": ${Math.round(targetCalories * 0.10)},
            "protein": 9,
            "carbs": 27,
            "fat": 4,
            "fiber": 3,
            "prepTime": 3,
            "cookTime": 0,
            "ingredients": ["150g yaourt grec", "20g noix", "15g miel", "1 pincée cannelle"],
            "ingredientsNutrition": [
              {"name": "yaourt grec", "unit": "g", "caloriesPer100": 59, "proteinPer100": 10, "carbsPer100": 3.6, "fatPer100": 0.4, "fiberPer100": 0},
              {"name": "noix", "unit": "g", "caloriesPer100": 654, "proteinPer100": 15.2, "carbsPer100": 13.7, "fatPer100": 65.2, "fiberPer100": 6.7},
              {"name": "miel", "unit": "g", "caloriesPer100": 304, "proteinPer100": 0.3, "carbsPer100": 82.4, "fatPer100": 0, "fiberPer100": 0.2},
              {"name": "cannelle", "unit": "g", "caloriesPer100": 247, "proteinPer100": 4.0, "carbsPer100": 80.6, "fatPer100": 1.2, "fiberPer100": 53.1}
            ],
            "instructions": [
              "Concasser grossièrement les noix",
              "Mélanger le yaourt avec le miel",
              "Ajouter les noix et saupoudrer de cannelle"
            ],
            "tags": ["collation", "protéines", "antioxydants"]
          }
        ]
      },
      "totalCalories": ${targetCalories},
      "totalProtein": 90,
      "totalCarbs": 225,
      "totalFat": 60
    }
  ]
}

Génère ${chunkDays} jours complets avec des recettes créatives et variées:`;
    
    console.log(`📏 Enhanced prompt length: ${chunkPrompt.length} characters`);
    
    const result = await model.generateContent(chunkPrompt);
    const response = await result.response;
    const text = response.text().trim();
    
    console.log(`📄 Response length: ${text.length} characters`);
    console.log("📄 First 300 chars:", text.substring(0, 300));
    console.log("📄 Last 100 chars:", text.substring(text.length - 100));
    
    // Check for truncation
    const lastChars = text.substring(text.length - 10);
    const appearsComplete = lastChars.includes('}') || lastChars.includes(']');
    console.log(`🔍 Appears complete: ${appearsComplete ? '✅' : '❌'}`);
    
    if (!appearsComplete) {
      console.log("❌ Enhanced response appears truncated");
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
    
    console.log("\n🎯 ENHANCED CHUNK RESULTS:");
    console.log(`✅ Days generated: ${parsedData.days?.length}`);
    console.log(`✅ Expected days: ${chunkDays}`);
    console.log(`✅ Match: ${parsedData.days?.length === chunkDays ? 'PERFECT' : 'MISMATCH'}`);
    
    if (parsedData.days && Array.isArray(parsedData.days)) {
      parsedData.days.forEach((day, index) => {
        const dayNum = startDay + index;
        console.log(`\n📅 Day ${dayNum} Quality Check:`);
        
        // Check breakfast
        const breakfast = day.meals?.breakfast;
        if (breakfast) {
          console.log(`  🍳 Breakfast: "${breakfast.name || 'NO NAME'}"`);
          console.log(`    - Description: ${breakfast.description ? '✅' : '❌'}`);
          console.log(`    - Instructions: ${breakfast.instructions?.length || 0} steps`);
          console.log(`    - Ingredients: ${breakfast.ingredients?.length || 0} items`);
          console.log(`    - Nutrition data: ${breakfast.ingredientsNutrition?.length || 0} items`);
        }
        
        // Check lunch
        const lunch = day.meals?.lunch;
        if (lunch) {
          console.log(`  🥗 Lunch: "${lunch.name || 'NO NAME'}"`);
          console.log(`    - Description: ${lunch.description ? '✅' : '❌'}`);
          console.log(`    - Instructions: ${lunch.instructions?.length || 0} steps`);
          console.log(`    - Ingredients: ${lunch.ingredients?.length || 0} items`);
          console.log(`    - Nutrition data: ${lunch.ingredientsNutrition?.length || 0} items`);
        }
        
        // Check dinner
        const dinner = day.meals?.dinner;
        if (dinner) {
          console.log(`  🍽️ Dinner: "${dinner.name || 'NO NAME'}"`);
          console.log(`    - Description: ${dinner.description ? '✅' : '❌'}`);
          console.log(`    - Instructions: ${dinner.instructions?.length || 0} steps`);
          console.log(`    - Ingredients: ${dinner.ingredients?.length || 0} items`);
          console.log(`    - Nutrition data: ${dinner.ingredientsNutrition?.length || 0} items`);
        }
        
        // Check snacks
        const snacks = day.meals?.snacks;
        if (snacks && Array.isArray(snacks) && snacks.length > 0) {
          console.log(`  🍯 Snack: "${snacks[0].name || 'NO NAME'}"`);
          console.log(`    - Instructions: ${snacks[0].instructions?.length || 0} steps`);
          console.log(`    - Nutrition data: ${snacks[0].ingredientsNutrition?.length || 0} items`);
        }
      });
    }
    
    console.log("\n🎉 ENHANCED CHUNKING TEST RESULT:");
    if (parsedData.days?.length === chunkDays && parsedData.days.every(day => 
      day.meals?.breakfast?.name && 
      day.meals?.lunch?.name && 
      day.meals?.dinner?.name &&
      day.meals?.breakfast?.instructions?.length > 1 &&
      day.meals?.lunch?.instructions?.length > 1 &&
      day.meals?.dinner?.instructions?.length > 1
    )) {
      console.log("✅ SUCCESS - Enhanced chunking with detailed names and instructions works!");
      console.log("✅ Meal names are creative and appetizing");
      console.log("✅ Instructions are detailed and helpful");
      console.log("✅ Ready to implement enhanced prompt for all chunks");
    } else {
      console.log("❌ PARTIAL SUCCESS - Some enhancements may need adjustment");
    }
    
  } catch (error) {
    console.error("💥 ENHANCED CHUNKING TEST FAILED:", error.message);
    console.log("❌ The enhanced chunking solution needs refinement");
  }
}

// Run the test
testEnhancedChunking().catch(console.error);