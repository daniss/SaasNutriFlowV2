const { GoogleGenerativeAI } = require("@google/generative-ai");

// Test with the actual enhanced chunking prompt
async function testRealEnhancedChunking() {
  const apiKey = process.env.GEMINI_API_KEY || "AIzaSyATj4hPHzA0Mc6b989U0Ipq41Cz1Fe88jo";
  if (!apiKey) {
    console.error("❌ No Gemini API key found");
    return;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  // Test the exact problematic case
  const duration = 7;
  const targetCalories = 1800;
  const prompt = "Plan méditerranéen de 7 jours pour la santé cardiaque avec 1800 calories par jour";
  const restrictions = [];

  console.log("🧪 Testing REAL enhanced chunking with actual API prompt...");
  console.log(`📝 Prompt: "${prompt}"`);
  console.log(`📊 Parameters: ${duration} days, ${targetCalories} calories\n`);

  try {
    // Test first chunk only with the real enhanced prompt
    const startDay = 1;
    const endDay = 3;
    const chunkDays = 3;
    
    console.log(`🔄 Testing first enhanced chunk: Days ${startDay}-${endDay}`);
    
    // Use the exact enhanced prompt from the API
    const chunkPrompt = `Crée ${chunkDays} jours de plan alimentaire méditerranéen JSON français.

${prompt} - Jours ${startDay} à ${endDay}, ${targetCalories} cal/jour
${restrictions.length > 0 ? `Restrictions: ${restrictions.join(", ")}` : ""}

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
    
    console.log(`📏 Real enhanced prompt length: ${chunkPrompt.length} characters`);
    
    const result = await model.generateContent(chunkPrompt);
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
      console.log("❌ Real enhanced response appears truncated - prompt may be too large");
      console.log(`📊 Prompt size: ${chunkPrompt.length} chars, Response size: ${text.length} chars`);
      return;
    }
    
    // Clean and parse
    let jsonText = text.trim();
    jsonText = jsonText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    
    const jsonStart = jsonText.indexOf("{");
    const jsonEnd = jsonText.lastIndexOf("}");
    
    if (jsonStart === -1 || jsonEnd === -1) {
      console.log("❌ No JSON boundaries found in real enhanced response");
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
    
    console.log("\n🎯 REAL ENHANCED RESULTS:");
    console.log(`✅ Days generated: ${parsedData.days?.length}`);
    console.log(`✅ Expected days: ${chunkDays}`);
    console.log(`✅ Match: ${parsedData.days?.length === chunkDays ? 'PERFECT' : 'MISMATCH'}`);
    
    // Detailed quality analysis
    if (parsedData.days && Array.isArray(parsedData.days)) {
      let qualityMetrics = {
        creativeName: 0,
        detailedDescription: 0,
        multipleInstructions: 0,
        completeNutrition: 0,
        totalMeals: 0
      };
      
      parsedData.days.forEach((day, dayIndex) => {
        console.log(`\n📅 Day ${day.day} Analysis:`);
        
        // Analyze each meal type
        ['breakfast', 'lunch', 'dinner'].forEach(mealType => {
          const meal = day.meals?.[mealType];
          if (meal) {
            qualityMetrics.totalMeals++;
            
            console.log(`  ${mealType === 'breakfast' ? '🍳' : mealType === 'lunch' ? '🥗' : '🍽️'} ${mealType}: "${meal.name}"`);
            
            // Creative name check
            const isCreative = meal.name && meal.name.length > 15 && !meal.name.includes('PDJ') && !meal.name.includes('DEJ');
            if (isCreative) qualityMetrics.creativeName++;
            console.log(`    - Creative name: ${isCreative ? '✅' : '❌'}`);
            
            // Description check
            const hasDescription = meal.description && meal.description.length > 20;
            if (hasDescription) qualityMetrics.detailedDescription++;
            console.log(`    - Detailed description: ${hasDescription ? '✅' : '❌'}`);
            
            // Instructions check
            const hasInstructions = meal.instructions && meal.instructions.length >= 3;
            if (hasInstructions) qualityMetrics.multipleInstructions++;
            console.log(`    - Multiple instructions: ${hasInstructions ? '✅' : '❌'} (${meal.instructions?.length || 0} steps)`);
            
            // Nutrition check
            const hasNutrition = meal.ingredientsNutrition && meal.ingredientsNutrition.length >= 3;
            if (hasNutrition) qualityMetrics.completeNutrition++;
            console.log(`    - Complete nutrition: ${hasNutrition ? '✅' : '❌'} (${meal.ingredientsNutrition?.length || 0} items)`);
          }
        });
        
        // Check snacks
        if (day.meals?.snacks && Array.isArray(day.meals.snacks) && day.meals.snacks.length > 0) {
          const snack = day.meals.snacks[0];
          qualityMetrics.totalMeals++;
          console.log(`  🍯 snack: "${snack.name}"`);
          
          const isCreative = snack.name && snack.name.length > 10;
          if (isCreative) qualityMetrics.creativeName++;
          console.log(`    - Creative name: ${isCreative ? '✅' : '❌'}`);
          
          const hasInstructions = snack.instructions && snack.instructions.length >= 2;
          if (hasInstructions) qualityMetrics.multipleInstructions++;
          console.log(`    - Instructions: ${hasInstructions ? '✅' : '❌'} (${snack.instructions?.length || 0} steps)`);
          
          const hasNutrition = snack.ingredientsNutrition && snack.ingredientsNutrition.length >= 2;
          if (hasNutrition) qualityMetrics.completeNutrition++;
          console.log(`    - Nutrition data: ${hasNutrition ? '✅' : '❌'} (${snack.ingredientsNutrition?.length || 0} items)`);
        }
      });
      
      // Calculate quality percentages
      const total = qualityMetrics.totalMeals;
      console.log(`\n📊 QUALITY METRICS:`);
      console.log(`🎨 Creative names: ${qualityMetrics.creativeName}/${total} (${Math.round(qualityMetrics.creativeName/total*100)}%)`);
      console.log(`📖 Detailed descriptions: ${qualityMetrics.detailedDescription}/${total} (${Math.round(qualityMetrics.detailedDescription/total*100)}%)`);
      console.log(`📝 Multiple instructions: ${qualityMetrics.multipleInstructions}/${total} (${Math.round(qualityMetrics.multipleInstructions/total*100)}%)`);
      console.log(`🔬 Complete nutrition: ${qualityMetrics.completeNutrition}/${total} (${Math.round(qualityMetrics.completeNutrition/total*100)}%)`);
      
      const overallScore = Math.round(
        (qualityMetrics.creativeName + qualityMetrics.detailedDescription + 
         qualityMetrics.multipleInstructions + qualityMetrics.completeNutrition) / (total * 4) * 100
      );
      
      console.log(`\n🏆 OVERALL QUALITY SCORE: ${overallScore}%`);
      
      console.log("\n🎉 REAL ENHANCED CHUNKING TEST RESULT:");
      if (parsedData.days?.length === chunkDays && overallScore >= 85) {
        console.log("✅ EXCELLENT - Real enhanced chunking works perfectly!");
        console.log("✅ Creative meal names and detailed instructions implemented");
        console.log("✅ Response size manageable for 3-day chunks");
        console.log("✅ High-quality meal plans with complete data");
        console.log("✅ Ready to deploy enhanced chunking solution");
      } else if (parsedData.days?.length === chunkDays && overallScore >= 70) {
        console.log("✅ GOOD - Real enhanced chunking works with minor refinements possible");
      } else {
        console.log("❌ NEEDS WORK - Enhanced chunking quality needs improvement");
      }
    }
    
  } catch (error) {
    console.error("💥 REAL ENHANCED CHUNKING TEST FAILED:", error.message);
    console.log("❌ Enhanced chunking needs debugging");
  }
}

// Run the test
testRealEnhancedChunking().catch(console.error);