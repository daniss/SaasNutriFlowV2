import Groq from "groq-sdk";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { 
  validateInput, 
  mealPlanRequestSchema, 
  sanitizeAIPrompt, 
  checkRateLimit, 
  validateAIResponse,
  logSuspiciousRequest,
  containsMaliciousContent
} from "@/lib/security-validation";

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const timings: Record<string, number> = {};
  
  try {
    console.log(' Starting meal plan generation...');
    console.log(' Request timestamp:', new Date().toISOString());
    
    // SECURITY: Use validated environment configuration
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.error(' GROQ_API_KEY environment variable is missing');
      return NextResponse.json(
        { error: "Service de génération IA indisponible" },
        { status: 503 }
      );
    }

    const groqInitStart = Date.now();
    const groq = new Groq({ 
      apiKey,
      timeout: 60000, // 60 second timeout to prevent timeouts
    });
    timings.groqInit = Date.now() - groqInitStart;
    console.log(` Groq client init: ${timings.groqInit}ms`);

    // Get auth token from header
    const authStartTime = Date.now();
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
    
    timings.authentication = Date.now() - authStartTime;
    console.log(` Authentication: ${timings.authentication}ms`);

    if (authError || !user) {
      return NextResponse.json(
        { error: "Invalid authentication token" },
        { status: 401 }
      );
    }

    const bodyParseStart = Date.now();
    const body = await request.json();
    timings.bodyParsing = Date.now() - bodyParseStart;
    console.log(` Body parsing: ${timings.bodyParsing}ms`);

    // Comprehensive input validation using Zod schema
    const validationStart = Date.now();
    const validationResult = await validateInput(body, mealPlanRequestSchema);
    timings.validation = Date.now() - validationStart;
    console.log(` Validation: ${timings.validation}ms`);
    
    if (!validationResult.success) {
      console.warn(' Input validation failed:', validationResult.error);
      return NextResponse.json(
        { error: validationResult.error },
        { status: 400 }
      );
    }

    const {
      prompt,
      clientId,
      duration,
      targetCalories,
      restrictions,
      clientDietaryTags,
    } = validationResult.data;

    // Rate limiting: 20 AI generation requests per hour per user (generous limit to prevent abuse)
    console.log(' Checking rate limits...');
    const rateLimitResult = checkRateLimit(`ai-generation:${user.id}`, 20, 60 * 60 * 1000);
    
    if (!rateLimitResult.success) {
      console.warn(`🚫 Rate limit exceeded for user ${user.id}`);
      return NextResponse.json(
        { 
          error: "Trop de générations en peu de temps. Veuillez patienter quelques minutes.",
          resetTime: rateLimitResult.resetTime
        },
        { status: 429 }
      );
    }

    // Get dietitian profile for subscription checking
    const dbStartTime = Date.now();
    const { data: dietitian, error: dietitianError } = await supabase
      .from('dietitians')
      .select('id, subscription_status, subscription_plan')
      .eq('auth_user_id', user.id)
      .single();

    if (dietitianError || !dietitian) {
      console.error(' Dietitian profile not found:', dietitianError);
      return NextResponse.json(
        { error: 'Profil nutritionniste non trouvé' },
        { status: 401 }
      );
    }

    // Get subscription plan limits
    const { data: planData, error: planError } = await supabase
      .from('subscription_plans')
      .select('ai_generations_per_month, display_name')
      .eq('name', dietitian.subscription_plan || 'free')
      .single();

    if (planError || !planData) {
      console.error(' Subscription plan not found:', planError);
      return NextResponse.json(
        { error: 'Plan d\'abonnement non trouvé' },
        { status: 500 }
      );
    }

    // Check if user has AI generation access
    if (planData.ai_generations_per_month === 0) {
      console.warn(`🚫 AI generation not available for plan: ${dietitian.subscription_plan}`);
      return NextResponse.json(
        { 
          error: 'La génération IA n\'est pas disponible avec votre plan actuel',
          requiresUpgrade: true,
          currentPlan: planData.display_name
        },
        { status: 403 }
      );
    }

    // Check monthly usage if not unlimited
    if (planData.ai_generations_per_month !== -1) {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      // Check AI usage from the dedicated ai_generations table
      const usageStartTime = Date.now();
      const { count: currentUsage, error: usageError } = await supabase
        .from('ai_generations')
        .select('id', { count: 'exact' })
        .eq('dietitian_id', dietitian.id)
        .eq('generation_successful', true)
        .gte('created_at', startOfMonth.toISOString());
      
      timings.usageCheck = Date.now() - usageStartTime;
      console.log(` Usage check: ${timings.usageCheck}ms`);

      if (usageError) {
        console.error(' Error checking AI usage:', usageError);
        return NextResponse.json(
          { error: 'Erreur lors de la vérification de l\'utilisation' },
          { status: 500 }
        );
      }

      if ((currentUsage || 0) >= planData.ai_generations_per_month) {
        console.warn(`🚫 AI generation limit exceeded: ${currentUsage}/${planData.ai_generations_per_month}`);
        return NextResponse.json(
          { 
            error: `Limite mensuelle atteinte (${planData.ai_generations_per_month} générations)`,
            requiresUpgrade: true,
            currentUsage: currentUsage,
            monthlyLimit: planData.ai_generations_per_month
          },
          { status: 403 }
        );
      }

    }

    // Sanitize and check prompt for malicious content
    console.log(' Sanitizing AI prompt...');
    const sanitizedPrompt = sanitizeAIPrompt(prompt);
    
    if (containsMaliciousContent(prompt)) {
      logSuspiciousRequest(user.id, prompt, "Malicious content detected in prompt");
      return NextResponse.json(
        { error: "Contenu invalide détecté dans la description" },
        { status: 400 }
      );
    }

    // Log if the prompt was sanitized (content was filtered)
    if (sanitizedPrompt !== prompt) {
      console.warn(` Prompt sanitized for user ${user.id}`);
      logSuspiciousRequest(user.id, prompt, "Prompt injection patterns detected and sanitized");
    }

    timings.dbQueries = Date.now() - dbStartTime;
    console.log(` Total DB queries: ${timings.dbQueries}ms`);
    
    // Skip ingredients database fetch for faster generation
    console.log(' Skipping ingredients database for faster generation');

    // Input validation is now handled above with Zod schema

    // Generate meal plan using Groq
    const aiStartTime = Date.now();
    console.log(' Starting AI generation...');

    let generatedPlan: any;

    // For longer plans (5+ days), generate in chunks to avoid truncation
    if (duration >= 5) {
      const maxDays = 3; // Generate max 3 days per request to avoid truncation
      
      console.log(` Splitting ${duration}-day plan into chunks of ${maxDays} days`);
      
      let allDays = [];
      
      for (let chunk = 0; chunk < Math.ceil(duration / maxDays); chunk++) {
        const startDay = chunk * maxDays + 1;
        const endDay = Math.min(startDay + maxDays - 1, duration);
        const chunkDays = endDay - startDay + 1;
        
        console.log(` Generating days ${startDay}-${endDay} (${chunkDays} days)`);
        
        // Optimized prompt with essential fields for UI and ingredient creation
        const chunkPrompt = `RÉPONDS UNIQUEMENT AVEC DU JSON VALIDE, AUCUN AUTRE TEXTE.

Plan ${chunkDays}j (${startDay}-${endDay}), ${targetCalories}cal/j.

Génère exactement ce JSON:
{"days":[${Array.from({length: chunkDays}, (_, i) => `{"day":${startDay + i},"meals":{"breakfast":{"name":"[nom créatif]","description":"[courte description]","calories":${Math.round(targetCalories * 0.25)},"protein":${Math.round(targetCalories * 0.25 * 0.15 / 4)},"carbs":${Math.round(targetCalories * 0.25 * 0.50 / 4)},"fat":${Math.round(targetCalories * 0.25 * 0.35 / 9)},"ingredients":["avoine","lait"],"instructions":["Préparer","Servir"],"ingredientsNutrition":[{"name":"avoine","unit":"g","quantity":50,"caloriesPer100":389,"proteinPer100":17,"carbsPer100":66,"fatPer100":7},{"name":"lait","unit":"ml","quantity":200,"caloriesPer100":42,"proteinPer100":3,"carbsPer100":5,"fatPer100":1}]},"lunch":{"name":"[nom créatif]","description":"[courte description]","calories":${Math.round(targetCalories * 0.35)},"protein":${Math.round(targetCalories * 0.35 * 0.25 / 4)},"carbs":${Math.round(targetCalories * 0.35 * 0.45 / 4)},"fat":${Math.round(targetCalories * 0.35 * 0.30 / 9)},"ingredients":["poulet","riz"],"instructions":["Cuire","Assaisonner"],"ingredientsNutrition":[{"name":"poulet","unit":"g","quantity":120,"caloriesPer100":239,"proteinPer100":27,"carbsPer100":0,"fatPer100":14},{"name":"riz","unit":"g","quantity":80,"caloriesPer100":365,"proteinPer100":7,"carbsPer100":77,"fatPer100":1}]},"dinner":{"name":"[nom créatif]","description":"[courte description]","calories":${Math.round(targetCalories * 0.30)},"protein":${Math.round(targetCalories * 0.30 * 0.30 / 4)},"carbs":${Math.round(targetCalories * 0.30 * 0.40 / 4)},"fat":${Math.round(targetCalories * 0.30 * 0.30 / 9)},"ingredients":["saumon","légumes"],"instructions":["Griller","Servir"],"ingredientsNutrition":[{"name":"saumon","unit":"g","quantity":100,"caloriesPer100":208,"proteinPer100":25,"carbsPer100":0,"fatPer100":12},{"name":"légumes","unit":"g","quantity":150,"caloriesPer100":25,"proteinPer100":2,"carbsPer100":5,"fatPer100":0}]}},"totalCalories":${targetCalories}}`).join(',')}]}

Remplace [nom] par des noms créatifs français. SEULEMENT JSON, PAS DE TEXTE.`;
        
        try {
          const chunkStartTime = Date.now();
          console.log(` Starting Groq API call for chunk ${chunk + 1} at ${new Date().toISOString()}`);
          const completion = await groq.chat.completions.create({
            model: "llama-3.1-8b-instant",
            messages: [{
              role: "user",
              content: chunkPrompt
            }],
            temperature: 0.7, // Reduced for more consistent output
            max_tokens: 2500, // Balanced for nutritional data and speed
          });
          
          const text = completion.choices[0]?.message?.content || "";
          console.log(` Groq API response received at ${new Date().toISOString()}`);
          
          const chunkTime = Date.now() - chunkStartTime;
          console.log(` Chunk ${chunk + 1} generation: ${chunkTime}ms (${text.length} chars)`);
          
          // Clean and parse chunk
          let jsonText = text.trim();
          
          // Remove all markdown formatting
          jsonText = jsonText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
          jsonText = jsonText.replace(/\*\*/g, ''); // Remove bold markdown
          jsonText = jsonText.replace(/\*/g, ''); // Remove italic markdown
          jsonText = jsonText.replace(/^-\s+/gm, ''); // Remove list markers
          jsonText = jsonText.replace(/^#.*$/gm, ''); // Remove headers
          
          // Remove any text before the first { or after the last }
          const jsonStart = jsonText.indexOf("{");
          const jsonEnd = jsonText.lastIndexOf("}");
          
          if (jsonStart === -1 || jsonEnd === -1) {
            console.error(`Raw response: ${text.substring(0, 500)}...`);
            throw new Error(`No valid JSON in chunk ${chunk + 1}`);
          }
          
          jsonText = jsonText.substring(jsonStart, jsonEnd + 1);
          
          // Clean common JSON issues
          jsonText = jsonText
            .replace(/,\s*}/g, '}') // Remove trailing commas
            .replace(/,\s*]/g, ']') // Remove trailing commas in arrays
            .replace(/\/\*[^*]*\*\//g, '') // Remove comments
            .replace(/\/\/.*$/gm, '') // Remove line comments
            .replace(/\.\.\./g, '') // Remove ellipsis
            .replace(/\[…\]/g, '[]') // Replace ellipsis in arrays
            .replace(/…/g, '') // Remove ellipsis character
            .replace(/\n\s*\n/g, '\n'); // Remove empty lines
          
          const chunkData = JSON.parse(jsonText);
          
          if (chunkData.days && Array.isArray(chunkData.days)) {
            allDays.push(...chunkData.days);
          } else {
            throw new Error(`Invalid chunk structure ${chunk + 1}`);
          }
          
        } catch (chunkError) {
          const errorMessage = chunkError instanceof Error ? chunkError.message : String(chunkError);
          console.error(` Chunk ${chunk + 1} failed:`, errorMessage);
          
          // Check if it's a timeout
          if (errorMessage.includes('timeout') || errorMessage.includes('ETIMEDOUT')) {
            console.log(' Retrying with shorter prompt...');
            
            // Retry with basic recipe structure
            try {
              const simplePrompt = `{"days":[${Array.from({length: chunkDays}, (_, i) => `{"day":${startDay + i},"meals":{"breakfast":{"name":"Petit-déjeuner équilibré","description":"Un petit-déjeuner nutritif pour bien commencer la journée","calories":${Math.round(targetCalories*0.25)},"protein":${Math.round(targetCalories*0.25*0.15/4)},"carbs":${Math.round(targetCalories*0.25*0.50/4)},"fat":${Math.round(targetCalories*0.25*0.35/9)},"ingredients":["avoine","lait"],"instructions":["Chauffer le lait","Ajouter l'avoine","Laisser mijoter 5 minutes"],"ingredientsNutrition":[{"name":"avoine","unit":"g","quantity":50,"caloriesPer100":389,"proteinPer100":17,"carbsPer100":66,"fatPer100":7},{"name":"lait","unit":"ml","quantity":200,"caloriesPer100":42,"proteinPer100":3,"carbsPer100":5,"fatPer100":1}]},"lunch":{"name":"Déjeuner complet","description":"Un repas équilibré avec protéines et légumes","calories":${Math.round(targetCalories*0.35)},"protein":${Math.round(targetCalories*0.35*0.25/4)},"carbs":${Math.round(targetCalories*0.35*0.45/4)},"fat":${Math.round(targetCalories*0.35*0.30/9)},"ingredients":["légumes variés","source de protéines"],"instructions":["Préparer les légumes","Cuire les protéines","Assaisonner et servir"],"ingredientsNutrition":[{"name":"légumes variés","unit":"g","quantity":200,"caloriesPer100":25,"proteinPer100":2,"carbsPer100":5,"fatPer100":0},{"name":"source de protéines","unit":"g","quantity":100,"caloriesPer100":200,"proteinPer100":25,"carbsPer100":0,"fatPer100":10}]},"dinner":{"name":"Dîner léger","description":"Un repas léger et digeste pour le soir","calories":${Math.round(targetCalories*0.3)},"protein":${Math.round(targetCalories*0.3*0.30/4)},"carbs":${Math.round(targetCalories*0.3*0.40/4)},"fat":${Math.round(targetCalories*0.3*0.30/9)},"ingredients":["poisson","légumes"],"instructions":["Assaisonner le poisson","Griller 8-10 minutes","Servir avec légumes"],"ingredientsNutrition":[{"name":"poisson","unit":"g","quantity":120,"caloriesPer100":150,"proteinPer100":25,"carbsPer100":0,"fatPer100":5},{"name":"légumes","unit":"g","quantity":150,"caloriesPer100":25,"proteinPer100":2,"carbsPer100":5,"fatPer100":0}]}},"totalCalories":${targetCalories}}`).join(',')}]}`;
              
              const retryCompletion = await groq.chat.completions.create({
                model: "llama-3.1-8b-instant",
                messages: [{
                  role: "user",
                  content: `RÉPONDS UNIQUEMENT AVEC DU JSON VALIDE. Améliore les noms des recettes en gardant EXACTEMENT cette structure: ${simplePrompt}`
                }],
                temperature: 0.5,
                max_tokens: 2000,
              });
              
              const retryText = retryCompletion.choices[0]?.message?.content || "";
              console.log(' Retry successful');
              
              // Parse retry response
              let jsonText = retryText.trim();
              jsonText = jsonText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
              const jsonStart = jsonText.indexOf("{");
              const jsonEnd = jsonText.lastIndexOf("}");
              if (jsonStart !== -1 && jsonEnd !== -1) {
                jsonText = jsonText.substring(jsonStart, jsonEnd + 1);
                const chunkData = JSON.parse(jsonText);
                if (chunkData.days && Array.isArray(chunkData.days)) {
                  allDays.push(...chunkData.days);
                  continue;
                }
              }
            } catch (retryError) {
              console.error(' Retry also failed:', retryError);
            }
          }
          
          throw new Error(`Failed to generate chunk ${chunk + 1}: ${errorMessage}`);
        }
      }
      
      timings.aiGeneration = Date.now() - aiStartTime;
      console.log(` Total AI generation (chunked): ${timings.aiGeneration}ms`);
      
      // Assemble final plan
      generatedPlan = {
        name: `Plan ${duration} jours`,
        description: `Plan équilibré environ ${targetCalories} calories`,
        totalDays: duration,
        averageCaloriesPerDay: targetCalories,
        nutritionSummary: {"protein": "25%", "carbohydrates": "45%", "fat": "30%"},
        days: allDays
      };
      
      
    } else {
      // For shorter plans (≤4 days), use single request
      // Optimized prompt with essential recipe fields
      const enhancedPrompt = `RÉPONDS UNIQUEMENT AVEC DU JSON VALIDE, AUCUN AUTRE TEXTE.

Plan ${duration}j, ${targetCalories}cal/j.

Génère exactement ce JSON:
{
  "name": "Plan ${duration} jours",
  "description": "Plan environ ${targetCalories} calories",
  "totalDays": ${duration},
  "averageCaloriesPerDay": ${targetCalories},
  "nutritionSummary": {"protein": "25%", "carbohydrates": "45%", "fat": "30%"},
  "days": [
    {
      "day": 1,
      "meals": {
        "breakfast": {"name": "[nom créatif]", "description": "[courte description]", "calories": ${Math.round(targetCalories * 0.25)}, "protein": ${Math.round(targetCalories * 0.25 * 0.15 / 4)}, "carbs": ${Math.round(targetCalories * 0.25 * 0.50 / 4)}, "fat": ${Math.round(targetCalories * 0.25 * 0.35 / 9)}, "ingredients": ["avoine", "lait"], "instructions": ["Préparer", "Servir"], "ingredientsNutrition": [{"name": "avoine", "unit": "g", "quantity": 50, "caloriesPer100": 389, "proteinPer100": 17, "carbsPer100": 66, "fatPer100": 7}, {"name": "lait", "unit": "ml", "quantity": 200, "caloriesPer100": 42, "proteinPer100": 3, "carbsPer100": 5, "fatPer100": 1}]},
        "lunch": {"name": "[nom créatif]", "description": "[courte description]", "calories": ${Math.round(targetCalories * 0.35)}, "protein": ${Math.round(targetCalories * 0.35 * 0.25 / 4)}, "carbs": ${Math.round(targetCalories * 0.35 * 0.45 / 4)}, "fat": ${Math.round(targetCalories * 0.35 * 0.30 / 9)}, "ingredients": ["poulet", "riz"], "instructions": ["Cuire", "Assaisonner"], "ingredientsNutrition": [{"name": "poulet", "unit": "g", "quantity": 120, "caloriesPer100": 239, "proteinPer100": 27, "carbsPer100": 0, "fatPer100": 14}, {"name": "riz", "unit": "g", "quantity": 80, "caloriesPer100": 365, "proteinPer100": 7, "carbsPer100": 77, "fatPer100": 1}]},
        "dinner": {"name": "[nom créatif]", "description": "[courte description]", "calories": ${Math.round(targetCalories * 0.30)}, "protein": ${Math.round(targetCalories * 0.30 * 0.30 / 4)}, "carbs": ${Math.round(targetCalories * 0.30 * 0.40 / 4)}, "fat": ${Math.round(targetCalories * 0.30 * 0.30 / 9)}, "ingredients": ["saumon", "légumes"], "instructions": ["Griller", "Servir"], "ingredientsNutrition": [{"name": "saumon", "unit": "g", "quantity": 100, "caloriesPer100": 208, "proteinPer100": 25, "carbsPer100": 0, "fatPer100": 12}, {"name": "légumes", "unit": "g", "quantity": 150, "caloriesPer100": 25, "proteinPer100": 2, "carbsPer100": 5, "fatPer100": 0}]},
        "snacks": [{"name": "[nom créatif]", "description": "[courte description]", "calories": ${Math.round(targetCalories * 0.10)}, "protein": ${Math.round(targetCalories * 0.10 * 0.20 / 4)}, "carbs": ${Math.round(targetCalories * 0.10 * 0.40 / 4)}, "fat": ${Math.round(targetCalories * 0.10 * 0.40 / 9)}, "ingredients": ["amandes"], "instructions": ["Portionner"], "ingredientsNutrition": [{"name": "amandes", "unit": "g", "quantity": 25, "caloriesPer100": 579, "proteinPer100": 21, "carbsPer100": 22, "fatPer100": 50}]}]
      },
      "totalCalories": ${targetCalories},
      "totalProtein": 90,
      "totalCarbs": 225,
      "totalFat": 60
    }
  ]
}

Remplace [nom] par des noms créatifs français. SEULEMENT JSON, PAS DE TEXTE.`;

      // Single request retry logic for short plans
      let attempts = 0;
      const maxAttempts = 3;

      while (attempts < maxAttempts) {
        attempts++;

        try {
          const singleGenStartTime = Date.now();
          const completion = await groq.chat.completions.create({
            model: "llama-3.1-8b-instant",
            messages: [{
              role: "user",
              content: enhancedPrompt
            }],
            temperature: 0.7, // Reduced for more consistent output
            max_tokens: 2500, // Balanced for nutritional data and speed
          });
          
          const text = completion.choices[0]?.message?.content || "";
          
          const singleGenTime = Date.now() - singleGenStartTime;
          console.log(` Single generation: ${singleGenTime}ms (${text.length} chars)`);

          // Clean and extract JSON
          let jsonText = text.trim();
          
          // Remove all markdown formatting
          jsonText = jsonText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
          jsonText = jsonText.replace(/\*\*/g, ''); // Remove bold markdown
          jsonText = jsonText.replace(/\*/g, ''); // Remove italic markdown
          jsonText = jsonText.replace(/^-\s+/gm, ''); // Remove list markers
          jsonText = jsonText.replace(/^#.*$/gm, ''); // Remove headers
          
          const jsonStart = jsonText.indexOf("{");
          const jsonEnd = jsonText.lastIndexOf("}");
          
          if (jsonStart === -1 || jsonEnd === -1) {
            console.error(`Short plan attempt ${attempts}: No valid JSON found`);
            if (attempts === maxAttempts) throw new Error("No JSON found after all attempts");
            continue;
          }
          
          jsonText = jsonText.substring(jsonStart, jsonEnd + 1);
          
          // Clean common JSON issues
          jsonText = jsonText
            .replace(/,\s*}/g, '}') // Remove trailing commas
            .replace(/,\s*]/g, ']') // Remove trailing commas in arrays
            .replace(/\/\*[^*]*\*\//g, '') // Remove comments
            .replace(/\/\/.*$/gm, '') // Remove line comments
            .replace(/\.\.\./g, '') // Remove ellipsis
            .replace(/\[…\]/g, '[]') // Replace ellipsis in arrays
            .replace(/…/g, '') // Remove ellipsis character
            .replace(/\n\s*\n/g, '\n'); // Remove empty lines

          generatedPlan = JSON.parse(jsonText);
          
          // Validate structure
          if (!generatedPlan.name || !generatedPlan.days || !Array.isArray(generatedPlan.days) || generatedPlan.days.length !== duration) {
            console.error(`Short plan attempt ${attempts}: Invalid structure`);
            if (attempts === maxAttempts) throw new Error("Invalid structure after all attempts");
            continue;
          }

          break;

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error(`Short plan attempt ${attempts} failed:`, errorMessage);
          if (attempts === maxAttempts) throw error;
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    // Validate AI response for security issues
    const responseValidation = validateAIResponse(generatedPlan);
    
    if (!responseValidation.isValid) {
      console.error(' Suspicious AI response detected:', responseValidation.reason);
      logSuspiciousRequest(user.id, JSON.stringify(generatedPlan).substring(0, 200), `Suspicious AI response: ${responseValidation.reason}`);
      
      return NextResponse.json(
        { 
          success: false,
          error: "Réponse générée invalide. Veuillez réessayer avec une description différente." 
        },
        { status: 500 }
      );
    }


    if (!timings.aiGeneration) {
      timings.aiGeneration = Date.now() - aiStartTime;
      console.log(` Total AI generation: ${timings.aiGeneration}ms`);
    }
    
    // Track AI usage in dedicated ai_generations table
    const trackingStartTime = Date.now();
    try {
      const { error: trackingError } = await supabase
        .from('ai_generations')
        .insert({
          dietitian_id: user.id,
          client_id: clientId || null,
          generation_type: 'meal_plan',
          prompt_used: sanitizedPrompt.substring(0, 1000), // Store first 1000 chars of prompt
          target_calories: targetCalories,
          duration_days: duration,
          restrictions: restrictions || [],
          client_dietary_tags: clientDietaryTags || [],
          generation_successful: true,
        });

      if (trackingError) {
        console.error(' Failed to track AI usage:', trackingError);
        // Don't fail the request if tracking fails, just log it
      }
      
      timings.usageTracking = Date.now() - trackingStartTime;
      console.log(` Usage tracking: ${timings.usageTracking}ms`);
    } catch (trackingError) {
      console.error(' Unexpected error tracking AI usage:', trackingError);
      // Don't fail the request if tracking fails
    }

    timings.total = Date.now() - startTime;
    console.log(' Meal plan generation complete!');
    console.log(' Performance summary:', {
      ...timings,
      total: `${timings.total}ms (${(timings.total / 1000).toFixed(2)}s)`
    });
    
    return NextResponse.json({
      success: true,
      data: generatedPlan,
      debug: {
        trackingAttempted: true,
        profileId: user.id,
        dietitianRecordId: dietitian.id,
        performanceTimings: timings
      }
    });
  } catch (error) {
    console.error("Meal plan generation error:", error);
    
    // Log detailed error information
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack?.split('\n').slice(0, 3).join('\n'),
        isTimeout: error.message.includes('timeout') || error.message.includes('ETIMEDOUT')
      });
    }

    // Note: Failed AI generation tracking is skipped due to variable scope limitations
    // The tracking still happens for successful generations

    // Don't expose internal error details to prevent information disclosure
    let errorMessage = "Une erreur s'est produite lors de la génération du plan alimentaire";
    let statusCode = 500;

    // Only expose safe, user-friendly error messages
    if (error instanceof Error) {
      if (error.message.includes("rate limit") || error.message.includes("quota")) {
        errorMessage = "Service temporairement indisponible. Veuillez réessayer plus tard.";
        statusCode = 503;
      } else if (error.message.includes("timeout")) {
        errorMessage = "La génération a pris trop de temps. Veuillez réduire la durée du plan.";
        statusCode = 408;
      } else if (error.message.includes("validation")) {
        errorMessage = "Données de requête invalides";
        statusCode = 400;
      }
      // For all other errors, use generic message to prevent info disclosure
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: statusCode }
    );
  }
}
