const { GoogleGenerativeAI } = require("@google/generative-ai");

// Test the chunking solution for 7-day plans
async function testChunkingSolution() {
  const apiKey = process.env.GEMINI_API_KEY || "AIzaSyATj4hPHzA0Mc6b989U0Ipq41Cz1Fe88jo";
  if (!apiKey) {
    console.error("❌ No Gemini API key found");
    return;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  // Test parameters that caused the original error
  const duration = 7;
  const targetCalories = 1800;
  const dietType = "balanced";
  const restrictions = [];
  const prompt = "Plan méditerranéen de 7 jours pour la santé cardiaque avec 1800 calories par jour";

  console.log("🧪 Testing chunking solution for 7-day Mediterranean plan...");
  console.log(`📝 Original problematic prompt: "${prompt}"`);
  console.log(`📊 Parameters: ${duration} days, ${targetCalories} calories, ${dietType}\n`);

  try {
    // Simulate the chunking logic from the API
    const maxDays = 3;
    console.log(`📦 Splitting ${duration}-day plan into chunks of ${maxDays} days\n`);
    
    let allDays = [];
    
    for (let chunk = 0; chunk < Math.ceil(duration / maxDays); chunk++) {
      const startDay = chunk * maxDays + 1;
      const endDay = Math.min(startDay + maxDays - 1, duration);
      const chunkDays = endDay - startDay + 1;
      
      console.log(`🔄 Chunk ${chunk + 1}: Generating days ${startDay}-${endDay} (${chunkDays} days)`);
      
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
      
      console.log(`📏 Chunk ${chunk + 1} prompt length: ${chunkPrompt.length} characters`);
      
      try {
        const result = await model.generateContent(chunkPrompt);
        const response = await result.response;
        const text = response.text().trim();
        
        console.log(`📄 Chunk ${chunk + 1} response length: ${text.length} characters`);
        console.log(`📄 Last 50 chars: "${text.substring(text.length - 50)}"`);
        
        // Check for truncation
        const lastChars = text.substring(text.length - 10);
        const appearsComplete = lastChars.includes('}') || lastChars.includes(']');
        console.log(`🔍 Chunk ${chunk + 1} appears complete: ${appearsComplete ? '✅' : '❌'}`);
        
        if (!appearsComplete) {
          throw new Error(`Chunk ${chunk + 1} appears truncated`);
        }
        
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
        
        console.log(`🧹 Chunk ${chunk + 1} cleaned JSON length: ${jsonText.length} characters`);
        
        const chunkData = JSON.parse(jsonText);
        
        if (chunkData.days && Array.isArray(chunkData.days)) {
          allDays.push(...chunkData.days);
          console.log(`✅ Chunk ${chunk + 1} SUCCESS: Generated ${chunkData.days.length} days`);
          
          // Validate structure
          chunkData.days.forEach((day, index) => {
            const dayNum = startDay + index;
            const hasAllMeals = day.meals?.breakfast && day.meals?.lunch && day.meals?.dinner;
            const hasNutrition = day.meals?.breakfast?.ingredientsNutrition?.length > 0;
            console.log(`  📅 Day ${dayNum}: Meals=${hasAllMeals ? '✅' : '❌'}, Nutrition=${hasNutrition ? '✅' : '❌'}`);
          });
          
        } else {
          throw new Error(`Invalid chunk structure ${chunk + 1}`);
        }
        
      } catch (chunkError) {
        console.error(`❌ Chunk ${chunk + 1} FAILED:`, chunkError.message);
        throw new Error(`Failed to generate chunk ${chunk + 1}: ${chunkError.message}`);
      }
      
      console.log(); // Add spacing between chunks
    }
    
    // Assemble final plan
    const finalPlan = {
      name: `Plan ${duration} jours`,
      description: `Plan équilibré ${targetCalories} calories`,
      totalDays: duration,
      averageCaloriesPerDay: targetCalories,
      nutritionSummary: {"protein": "25%", "carbohydrates": "45%", "fat": "30%"},
      days: allDays
    };
    
    console.log("🎯 FINAL RESULTS:");
    console.log(`✅ Total days generated: ${allDays.length}`);
    console.log(`✅ Expected days: ${duration}`);
    console.log(`✅ Match: ${allDays.length === duration ? 'PERFECT' : 'MISMATCH'}`);
    console.log(`✅ Plan name: "${finalPlan.name}"`);
    console.log(`✅ All days have required structure: ${allDays.every(day => 
      day.meals?.breakfast && day.meals?.lunch && day.meals?.dinner && day.meals?.snacks
    ) ? 'YES' : 'NO'}`);
    console.log(`✅ All days have ingredientsNutrition: ${allDays.every(day => 
      day.meals?.breakfast?.ingredientsNutrition?.length > 0
    ) ? 'YES' : 'NO'}`);
    
    console.log("\n🎉 CHUNKING SOLUTION TEST RESULT:");
    if (allDays.length === duration && allDays.every(day => 
      day.meals?.breakfast && day.meals?.lunch && day.meals?.dinner
    )) {
      console.log("✅ SUCCESS - Chunking solution works perfectly!");
      console.log("✅ The original JSON parsing error should be fixed!");
    } else {
      console.log("❌ FAILED - Chunking solution needs adjustment");
    }
    
  } catch (error) {
    console.error("💥 CHUNKING TEST FAILED:", error.message);
    console.log("❌ The chunking solution did not resolve the JSON parsing issue");
  }
}

// Run the test
testChunkingSolution().catch(console.error);