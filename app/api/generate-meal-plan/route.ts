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
    console.log("🚀 Starting meal plan generation request");
    
    // SECURITY: Use validated environment configuration
    const apiKey = process.env.GROQ_API_KEY;
    console.log("🔑 GROQ API key check:", !!apiKey, "length:", apiKey?.length || 0);
    
    if (!apiKey) {
      console.error("❌ Missing GROQ_API_KEY - returning 503");
      return NextResponse.json(
        { error: "Service de génération IA indisponible" },
        { status: 503 }
      );
    }

    console.log("📡 Initializing Groq client");
    const groq = new Groq({ 
      apiKey,
      timeout: 60000, // 60 second timeout to prevent timeouts
    });
    console.log("✅ Groq client initialized successfully");

    // Get auth token from header
    const authStartTime = Date.now();
    const authHeader = request.headers.get("authorization");
    console.log("🔐 Auth header check:", !!authHeader, authHeader?.startsWith("Bearer "));
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.error("❌ Missing or invalid auth header - returning 401");
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const token = authHeader.split(" ")[1];
    console.log("🎫 Token extracted, length:", token?.length || 0);

    // Validate token with Supabase
    console.log("🗄️ Creating Supabase client");
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    console.log("✅ Supabase client created");

    console.log("👤 Validating user token with Supabase");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);
    
    timings.authentication = Date.now() - authStartTime;
    console.log("🕒 Auth validation took:", timings.authentication, "ms");

    if (authError || !user) {
      console.error("❌ Auth validation failed:", authError?.message || "No user");
      return NextResponse.json(
        { error: "Invalid authentication token" },
        { status: 401 }
      );
    }
    
    console.log("✅ User authenticated:", user.id);

    const body = await request.json();

    // Comprehensive input validation using Zod schema
    const validationResult = await validateInput(body, mealPlanRequestSchema);
    
    if (!validationResult.success) {
      // TODO: Log validation failures to monitoring service
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
    const rateLimitResult = checkRateLimit(`ai-generation:${user.id}`, 20, 60 * 60 * 1000);
    
    if (!rateLimitResult.success) {
      // TODO: Log rate limit violations to monitoring service
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
      // TODO: Log dietitian profile errors to monitoring service
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
      // TODO: Log subscription plan errors to monitoring service
      return NextResponse.json(
        { error: 'Plan d\'abonnement non trouvé' },
        { status: 500 }
      );
    }

    // Check if user has AI generation access
    if (planData.ai_generations_per_month === 0) {
      // TODO: Log AI access attempts for unavailable plans to monitoring service
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
        .eq('dietitian_id', user.id)
        .eq('generation_successful', true)
        .gte('created_at', startOfMonth.toISOString());
      
      timings.usageCheck = Date.now() - usageStartTime;

      if (usageError) {
        // TODO: Log AI usage check errors to monitoring service
        return NextResponse.json(
          { error: 'Erreur lors de la vérification de l\'utilisation' },
          { status: 500 }
        );
      }

      if ((currentUsage || 0) >= planData.ai_generations_per_month) {
        // TODO: Log AI generation limit violations to monitoring service
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
      // TODO: Log prompt sanitization events to security monitoring
      logSuspiciousRequest(user.id, prompt, "Prompt injection patterns detected and sanitized");
    }

    timings.dbQueries = Date.now() - dbStartTime;
    
    // Skip ingredients database fetch for faster generation

    // Input validation is now handled above with Zod schema

    // Generate meal plan using Groq
    const aiStartTime = Date.now();

    let generatedPlan: any;

    // Always use chunked approach for consistent performance
    if (duration >= 1) {
      const maxDays = 2; // Generate max 2 days per request for optimal speed
      
      let allDays = [];
      
      // Create all chunk promises for parallel execution
      const chunkPromises = [];
      const totalChunks = Math.ceil(duration / maxDays);
      
      for (let chunk = 0; chunk < totalChunks; chunk++) {
        const startDay = chunk * maxDays + 1;
        const endDay = Math.min(startDay + maxDays - 1, duration);
        const chunkDays = endDay - startDay + 1;
        
        // Create a promise for this chunk
        const chunkPromise = (async () => {
          // Optimized prompt with essential fields for UI and ingredient creation
          const chunkPrompt = `RÉPONDS UNIQUEMENT AVEC DU JSON VALIDE, AUCUN AUTRE TEXTE.

Plan ${chunkDays}j (${startDay}-${endDay}), ${targetCalories}cal/j.

Génère exactement ce JSON:
{"days":[${Array.from({length: chunkDays}, (_, i) => `{"day":${startDay + i},"meals":{"breakfast":{"name":"[nom créatif]","description":"[courte description]","calories":${Math.round(targetCalories * 0.25)},"protein":${Math.round(targetCalories * 0.25 * 0.15 / 4)},"carbs":${Math.round(targetCalories * 0.25 * 0.50 / 4)},"fat":${Math.round(targetCalories * 0.25 * 0.35 / 9)},"ingredients":["avoine","lait"],"instructions":["[étape détaillée 1]","[étape détaillée 2]","[étape détaillée 3]"],"ingredientsNutrition":[{"name":"avoine","unit":"g","quantity":50,"caloriesPer100":389,"proteinPer100":17,"carbsPer100":66,"fatPer100":7},{"name":"lait","unit":"ml","quantity":200,"caloriesPer100":42,"proteinPer100":3,"carbsPer100":5,"fatPer100":1}]},"lunch":{"name":"[nom créatif]","description":"[courte description]","calories":${Math.round(targetCalories * 0.35)},"protein":${Math.round(targetCalories * 0.35 * 0.25 / 4)},"carbs":${Math.round(targetCalories * 0.35 * 0.45 / 4)},"fat":${Math.round(targetCalories * 0.35 * 0.30 / 9)},"ingredients":["poulet","riz"],"instructions":["[étape détaillée 1]","[étape détaillée 2]","[étape détaillée 3]","[étape détaillée 4]"],"ingredientsNutrition":[{"name":"poulet","unit":"g","quantity":120,"caloriesPer100":239,"proteinPer100":27,"carbsPer100":0,"fatPer100":14},{"name":"riz","unit":"g","quantity":80,"caloriesPer100":365,"proteinPer100":7,"carbsPer100":77,"fatPer100":1}]},"dinner":{"name":"[nom créatif]","description":"[courte description]","calories":${Math.round(targetCalories * 0.30)},"protein":${Math.round(targetCalories * 0.30 * 0.30 / 4)},"carbs":${Math.round(targetCalories * 0.30 * 0.40 / 4)},"fat":${Math.round(targetCalories * 0.30 * 0.30 / 9)},"ingredients":["saumon","légumes"],"instructions":["[étape détaillée 1]","[étape détaillée 2]","[étape détaillée 3]"],"ingredientsNutrition":[{"name":"saumon","unit":"g","quantity":100,"caloriesPer100":208,"proteinPer100":25,"carbsPer100":0,"fatPer100":12},{"name":"légumes","unit":"g","quantity":150,"caloriesPer100":25,"proteinPer100":2,"carbsPer100":5,"fatPer100":0}]}},"totalCalories":${targetCalories}}`).join(',')}]}

Remplace [nom] par des noms créatifs français et [étape détaillée X] par des instructions de cuisine détaillées et précises. SEULEMENT JSON, PAS DE TEXTE.`;
        
        try {
          const result = await groq.chat.completions.create({
            messages: [
              { role: "user", content: chunkPrompt }
            ],
            model: "llama-3.1-70b-versatile",
            temperature: 0.7,
            max_tokens: 2500,
          });
          
          const text = result.choices[0]?.message?.content || "";
          
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
            // TODO: Log raw response parsing errors to monitoring service
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
            return chunkData.days; // Return days for this chunk
          } else {
            throw new Error(`Invalid chunk structure ${chunk + 1}`);
          }
          
        } catch (chunkError) {
          const errorMessage = chunkError instanceof Error ? chunkError.message : String(chunkError);
          // TODO: Log chunk generation failures to monitoring service
          
          // Check if it's a timeout
          if (errorMessage.includes('timeout') || errorMessage.includes('ETIMEDOUT')) {
            
            // Retry with basic recipe structure
            try {
              const simplePrompt = `{"days":[${Array.from({length: chunkDays}, (_, i) => `{"day":${startDay + i},"meals":{"breakfast":{"name":"Petit-déjeuner équilibré","description":"Un petit-déjeuner nutritif pour bien commencer la journée","calories":${Math.round(targetCalories*0.25)},"protein":${Math.round(targetCalories*0.25*0.15/4)},"carbs":${Math.round(targetCalories*0.25*0.50/4)},"fat":${Math.round(targetCalories*0.25*0.35/9)},"ingredients":["avoine","lait"],"instructions":["Verser le lait dans une casserole","Chauffer à feu moyen jusqu'à frémissement","Ajouter l'avoine en remuant","Laisser mijoter 5 minutes en remuant régulièrement","Servir chaud avec des fruits frais"],"ingredientsNutrition":[{"name":"avoine","unit":"g","quantity":50,"caloriesPer100":389,"proteinPer100":17,"carbsPer100":66,"fatPer100":7},{"name":"lait","unit":"ml","quantity":200,"caloriesPer100":42,"proteinPer100":3,"carbsPer100":5,"fatPer100":1}]},"lunch":{"name":"Déjeuner complet","description":"Un repas équilibré avec protéines et légumes","calories":${Math.round(targetCalories*0.35)},"protein":${Math.round(targetCalories*0.35*0.25/4)},"carbs":${Math.round(targetCalories*0.35*0.45/4)},"fat":${Math.round(targetCalories*0.35*0.30/9)},"ingredients":["légumes variés","source de protéines"],"instructions":["Laver et couper les légumes en morceaux réguliers","Faire chauffer une poêle avec un peu d'huile","Cuire les protéines à feu moyen 8-10 minutes","Ajouter les légumes et sauter 5 minutes","Assaisonner avec sel, poivre et herbes au choix","Servir chaud"],"ingredientsNutrition":[{"name":"légumes variés","unit":"g","quantity":200,"caloriesPer100":25,"proteinPer100":2,"carbsPer100":5,"fatPer100":0},{"name":"source de protéines","unit":"g","quantity":100,"caloriesPer100":200,"proteinPer100":25,"carbsPer100":0,"fatPer100":10}]},"dinner":{"name":"Dîner léger","description":"Un repas léger et digeste pour le soir","calories":${Math.round(targetCalories*0.3)},"protein":${Math.round(targetCalories*0.3*0.30/4)},"carbs":${Math.round(targetCalories*0.3*0.40/4)},"fat":${Math.round(targetCalories*0.3*0.30/9)},"ingredients":["poisson","légumes"],"instructions":["Préchauffer le grill ou la poêle","Assaisonner le poisson avec sel, poivre et citron","Badigeonner d'un peu d'huile d'olive","Griller 4-5 minutes de chaque côté","Faire sauter les légumes à la poêle 5 minutes","Servir le poisson sur lit de légumes"],"ingredientsNutrition":[{"name":"poisson","unit":"g","quantity":120,"caloriesPer100":150,"proteinPer100":25,"carbsPer100":0,"fatPer100":5},{"name":"légumes","unit":"g","quantity":150,"caloriesPer100":25,"proteinPer100":2,"carbsPer100":5,"fatPer100":0}]}},"totalCalories":${targetCalories}}`).join(',')}]}`;
              
              const retryResult = await groq.chat.completions.create({
                messages: [
                  { role: "user", content: `RÉPONDS UNIQUEMENT AVEC DU JSON VALIDE. Améliore les noms des recettes en gardant EXACTEMENT cette structure: ${simplePrompt}` }
                ],
                model: "llama-3.1-70b-versatile",
                temperature: 0.5,
                max_tokens: 2000,
              });
              
              const retryText = retryResult.choices[0]?.message?.content || "";
              
              // Parse retry response
              let jsonText = retryText.trim();
              jsonText = jsonText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
              const jsonStart = jsonText.indexOf("{");
              const jsonEnd = jsonText.lastIndexOf("}");
              if (jsonStart !== -1 && jsonEnd !== -1) {
                jsonText = jsonText.substring(jsonStart, jsonEnd + 1);
                const chunkData = JSON.parse(jsonText);
                if (chunkData.days && Array.isArray(chunkData.days)) {
                  return chunkData.days; // Return days from retry
                }
              }
            } catch (retryError) {
              // TODO: Log retry failures to monitoring service
            }
          }
          
          throw new Error(`Failed to generate chunk ${chunk + 1}: ${errorMessage}`);
        }
        })();
        
        chunkPromises.push(chunkPromise);
      }
      
      // Execute all chunks in parallel
      const parallelStartTime = Date.now();
      
      try {
        const chunkResults = await Promise.all(chunkPromises);
        
        // Flatten all days from all chunks
        allDays = chunkResults.flat();
      } catch (parallelError) {
        // TODO: Log parallel generation failures to monitoring service
        throw parallelError;
      }
      
      timings.aiGeneration = Date.now() - aiStartTime;
      
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
        "breakfast": {"name": "[nom créatif]", "description": "[courte description]", "calories": ${Math.round(targetCalories * 0.25)}, "protein": ${Math.round(targetCalories * 0.25 * 0.15 / 4)}, "carbs": ${Math.round(targetCalories * 0.25 * 0.50 / 4)}, "fat": ${Math.round(targetCalories * 0.25 * 0.35 / 9)}, "ingredients": ["avoine", "lait"], "instructions": ["[étape détaillée 1]", "[étape détaillée 2]", "[étape détaillée 3]"], "ingredientsNutrition": [{"name": "avoine", "unit": "g", "quantity": 50, "caloriesPer100": 389, "proteinPer100": 17, "carbsPer100": 66, "fatPer100": 7}, {"name": "lait", "unit": "ml", "quantity": 200, "caloriesPer100": 42, "proteinPer100": 3, "carbsPer100": 5, "fatPer100": 1}]},
        "lunch": {"name": "[nom créatif]", "description": "[courte description]", "calories": ${Math.round(targetCalories * 0.35)}, "protein": ${Math.round(targetCalories * 0.35 * 0.25 / 4)}, "carbs": ${Math.round(targetCalories * 0.35 * 0.45 / 4)}, "fat": ${Math.round(targetCalories * 0.35 * 0.30 / 9)}, "ingredients": ["poulet", "riz"], "instructions": ["[étape détaillée 1]", "[étape détaillée 2]", "[étape détaillée 3]", "[étape détaillée 4]"], "ingredientsNutrition": [{"name": "poulet", "unit": "g", "quantity": 120, "caloriesPer100": 239, "proteinPer100": 27, "carbsPer100": 0, "fatPer100": 14}, {"name": "riz", "unit": "g", "quantity": 80, "caloriesPer100": 365, "proteinPer100": 7, "carbsPer100": 77, "fatPer100": 1}]},
        "dinner": {"name": "[nom créatif]", "description": "[courte description]", "calories": ${Math.round(targetCalories * 0.30)}, "protein": ${Math.round(targetCalories * 0.30 * 0.30 / 4)}, "carbs": ${Math.round(targetCalories * 0.30 * 0.40 / 4)}, "fat": ${Math.round(targetCalories * 0.30 * 0.30 / 9)}, "ingredients": ["saumon", "légumes"], "instructions": ["[étape détaillée 1]", "[étape détaillée 2]", "[étape détaillée 3]"], "ingredientsNutrition": [{"name": "saumon", "unit": "g", "quantity": 100, "caloriesPer100": 208, "proteinPer100": 25, "carbsPer100": 0, "fatPer100": 12}, {"name": "légumes", "unit": "g", "quantity": 150, "caloriesPer100": 25, "proteinPer100": 2, "carbsPer100": 5, "fatPer100": 0}]},
        "snacks": [{"name": "[nom créatif]", "description": "[courte description]", "calories": ${Math.round(targetCalories * 0.10)}, "protein": ${Math.round(targetCalories * 0.10 * 0.20 / 4)}, "carbs": ${Math.round(targetCalories * 0.10 * 0.40 / 4)}, "fat": ${Math.round(targetCalories * 0.10 * 0.40 / 9)}, "ingredients": ["amandes"], "instructions": ["[étape détaillée 1]","[étape détaillée 2]"], "ingredientsNutrition": [{"name": "amandes", "unit": "g", "quantity": 25, "caloriesPer100": 579, "proteinPer100": 21, "carbsPer100": 22, "fatPer100": 50}]}]
      },
      "totalCalories": ${targetCalories},
      "totalProtein": 90,
      "totalCarbs": 225,
      "totalFat": 60
    }
  ]
}

Remplace [nom] par des noms créatifs français et [étape détaillée X] par des instructions de cuisine détaillées et précises. SEULEMENT JSON, PAS DE TEXTE.`;

      // Single request retry logic for short plans
      let attempts = 0;
      const maxAttempts = 3;

      while (attempts < maxAttempts) {
        attempts++;

        try {
          const singleGenStartTime = Date.now();
          const result = await groq.chat.completions.create({
            messages: [
              { role: "user", content: enhancedPrompt }
            ],
            model: "llama-3.1-70b-versatile",
            temperature: 0.7,
            max_tokens: 2500,
          });
          
          const text = result.choices[0]?.message?.content || "";
          
          const singleGenTime = Date.now() - singleGenStartTime;

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
            // TODO: Log JSON parsing failures to monitoring service
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
            // TODO: Log structure validation failures to monitoring service
            if (attempts === maxAttempts) throw new Error("Invalid structure after all attempts");
            continue;
          }

          break;

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          // TODO: Log generation attempt failures to monitoring service
          if (attempts === maxAttempts) throw error;
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    // Validate AI response for security issues
    const responseValidation = validateAIResponse(generatedPlan);
    
    if (!responseValidation.isValid) {
      // TODO: Log suspicious AI responses to security monitoring
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
        // TODO: Log AI usage tracking failures to monitoring service
        // Don't fail the request if tracking fails
      }
      
      timings.usageTracking = Date.now() - trackingStartTime;
    } catch (trackingError) {
      // TODO: Log unexpected tracking errors to monitoring service
      // Don't fail the request if tracking fails
    }

    timings.total = Date.now() - startTime;
    
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
    // TEMPORARY: Add detailed logging to debug production 500 errors
    console.error("🚨 MEAL PLAN GENERATION ERROR - FULL DETAILS:");
    console.error("Error type:", typeof error);
    console.error("Error name:", error instanceof Error ? error.name : 'Unknown');
    console.error("Error message:", error instanceof Error ? error.message : String(error));
    console.error("Error stack:", error instanceof Error ? error.stack : 'No stack trace');
    console.error("Request timing so far:", Date.now() - startTime, "ms");
    
    // Try to log the state when error occurred
    try {
      console.error("Additional context:");
      console.error("- GROQ_API_KEY exists:", !!process.env.GROQ_API_KEY);
      console.error("- GROQ_API_KEY length:", process.env.GROQ_API_KEY?.length || 0);
      console.error("- Supabase URL exists:", !!process.env.NEXT_PUBLIC_SUPABASE_URL);
      console.error("- Service role key exists:", !!process.env.SUPABASE_SERVICE_ROLE_KEY);
    } catch (contextError) {
      console.error("Failed to log context:", contextError);
    }

    // Note: Failed AI generation tracking is skipped due to variable scope limitations
    // The tracking still happens for successful generations

    // Don't expose internal error details to prevent information disclosure
    let errorMessage = "Une erreur s'est produite lors de la génération du plan alimentaire";
    let statusCode = 500;

    // Only expose safe, user-friendly error messages
    if (error instanceof Error) {
      // TEMPORARY: Log the actual error message for debugging
      console.error("🔍 Categorizing error:", error.message);
      
      if (error.message.includes("rate limit") || error.message.includes("quota")) {
        errorMessage = "Service temporairement indisponible. Veuillez réessayer plus tard.";
        statusCode = 503;
        console.error("🏷️ Categorized as: Rate limit/quota");
      } else if (error.message.includes("timeout")) {
        errorMessage = "La génération a pris trop de temps. Veuillez réduire la durée du plan.";
        statusCode = 408;
        console.error("🏷️ Categorized as: Timeout");
      } else if (error.message.includes("validation")) {
        errorMessage = "Données de requête invalides";
        statusCode = 400;
        console.error("🏷️ Categorized as: Validation");
      } else {
        console.error("🏷️ Categorized as: Generic error");
      }
      // For all other errors, use generic message to prevent info disclosure
    } else {
      console.error("🏷️ Non-Error object thrown:", typeof error);
    }

    console.error("📤 Returning error response:", { errorMessage, statusCode });

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: statusCode }
    );
  }
}