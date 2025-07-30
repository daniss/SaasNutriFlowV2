import Groq from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  console.log('=== TEST GROQ SPEED API ===');
  console.log('Start time:', new Date().toISOString());
  
  const timings: Record<string, number> = {};
  const startTime = Date.now();
  
  // Initialize Groq client
  const groqInitStart = Date.now();
  const groq = new Groq({ 
    apiKey: process.env.GROQ_API_KEY!,
    timeout: 60000,
  });
  timings.groqInit = Date.now() - groqInitStart;
  
  const targetCalories = 2000;
  const chunkDays = 2;
  const startDay = 1;
  const endDay = 2;
  
  const chunkPrompt = `RÉPONDS UNIQUEMENT AVEC DU JSON VALIDE, AUCUN AUTRE TEXTE.
Plan ${chunkDays}j (${startDay}-${endDay}), ${targetCalories}cal/j.
Génère exactement ce JSON:
{"days":[${Array.from({length: chunkDays}, (_, i) => `{"day":${startDay + i},"meals":{"breakfast":{"name":"[nom créatif]","description":"[courte description]","calories":${Math.round(targetCalories * 0.25)},"protein":${Math.round(targetCalories * 0.25 * 0.15 / 4)},"carbs":${Math.round(targetCalories * 0.25 * 0.50 / 4)},"fat":${Math.round(targetCalories * 0.25 * 0.35 / 9)},"ingredients":["avoine","lait"],"instructions":["Préparer","Servir"],"ingredientsNutrition":[{"name":"avoine","unit":"g","quantity":50,"caloriesPer100":389,"proteinPer100":17,"carbsPer100":66,"fatPer100":7},{"name":"lait","unit":"ml","quantity":200,"caloriesPer100":42,"proteinPer100":3,"carbsPer100":5,"fatPer100":1}]},"lunch":{"name":"[nom créatif]","description":"[courte description]","calories":${Math.round(targetCalories * 0.35)},"protein":${Math.round(targetCalories * 0.35 * 0.25 / 4)},"carbs":${Math.round(targetCalories * 0.35 * 0.45 / 4)},"fat":${Math.round(targetCalories * 0.35 * 0.30 / 9)},"ingredients":["poulet","riz"],"instructions":["Cuire","Assaisonner"],"ingredientsNutrition":[{"name":"poulet","unit":"g","quantity":120,"caloriesPer100":239,"proteinPer100":27,"carbsPer100":0,"fatPer100":14},{"name":"riz","unit":"g","quantity":80,"caloriesPer100":365,"proteinPer100":7,"carbsPer100":77,"fatPer100":1}]},"dinner":{"name":"[nom créatif]","description":"[courte description]","calories":${Math.round(targetCalories * 0.30)},"protein":${Math.round(targetCalories * 0.30 * 0.30 / 4)},"carbs":${Math.round(targetCalories * 0.30 * 0.40 / 4)},"fat":${Math.round(targetCalories * 0.30 * 0.30 / 9)},"ingredients":["saumon","légumes"],"instructions":["Griller","Servir"],"ingredientsNutrition":[{"name":"saumon","unit":"g","quantity":100,"caloriesPer100":208,"proteinPer100":25,"carbsPer100":0,"fatPer100":12},{"name":"légumes","unit":"g","quantity":150,"caloriesPer100":25,"proteinPer100":2,"carbsPer100":5,"fatPer100":0}]}},"totalCalories":${targetCalories}}`).join(',')}]}
Remplace [nom] par des noms créatifs français. SEULEMENT JSON, PAS DE TEXTE.`;
  
  console.log('Prompt length:', chunkPrompt.length, 'characters');
  console.log('Groq init time:', timings.groqInit, 'ms');
  
  try {
    // Make 3 API calls to test consistency
    const results = [];
    
    for (let i = 0; i < 3; i++) {
      console.log(`\n--- API Call ${i + 1} ---`);
      const callStart = Date.now();
      console.log('Starting Groq API call at:', new Date().toISOString());
      
      const completion = await groq.chat.completions.create({
        model: "llama-3.1-8b-instant",
        messages: [{
          role: "user",
          content: chunkPrompt
        }],
        temperature: 0.7,
        max_tokens: 2500,
      });
      
      const callEnd = Date.now();
      const callDuration = callEnd - callStart;
      
      console.log('Groq API response received at:', new Date().toISOString());
      console.log('Call duration:', callDuration, 'ms');
      console.log('Response length:', completion.choices[0]?.message?.content?.length || 0, 'characters');
      
      results.push({
        call: i + 1,
        duration: callDuration,
        responseLength: completion.choices[0]?.message?.content?.length || 0,
        hasContent: !!completion.choices[0]?.message?.content
      });
    }
    
    timings.totalTime = Date.now() - startTime;
    
    return NextResponse.json({
      success: true,
      timings,
      results,
      averageDuration: results.reduce((sum, r) => sum + r.duration, 0) / results.length,
      environment: {
        region: process.env.VERCEL_REGION || 'unknown',
        runtime: process.env.NEXT_RUNTIME || 'nodejs',
      }
    });
    
  } catch (error: any) {
    console.error('Error:', error.message);
    return NextResponse.json({
      success: false,
      error: error.message,
      timings,
      totalTime: Date.now() - startTime
    });
  }
}