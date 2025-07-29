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
  
  // Set a hard timeout for the entire request (25 seconds for Vercel)
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, 25000); // 25 second total timeout
  
  try {
    console.log('🚀 Starting meal plan generation...');
    // SECURITY: Use validated environment configuration
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.error('❌ GROQ_API_KEY environment variable is missing');
      return NextResponse.json(
        { error: "Service de génération IA indisponible" },
        { status: 503 }
      );
    }

    const groq = new Groq({ 
      apiKey,
      timeout: 30000, // 30 second timeout per request
    });

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
    console.log(`⏱️ Authentication: ${timings.authentication}ms`);

    if (authError || !user) {
      return NextResponse.json(
        { error: "Invalid authentication token" },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Comprehensive input validation using Zod schema
    const validationResult = await validateInput(body, mealPlanRequestSchema);
    
    if (!validationResult.success) {
      console.warn('❌ Input validation failed:', validationResult.error);
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
    console.log('⏱️ Checking rate limits...');
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
      console.error('❌ Dietitian profile not found:', dietitianError);
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
      console.error('❌ Subscription plan not found:', planError);
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
      console.log(`⏱️ Usage check: ${timings.usageCheck}ms`);

      if (usageError) {
        console.error('❌ Error checking AI usage:', usageError);
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
    console.log('🛡️ Sanitizing AI prompt...');
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
      console.warn(`⚠️ Prompt sanitized for user ${user.id}`);
      logSuspiciousRequest(user.id, prompt, "Prompt injection patterns detected and sanitized");
    }

    timings.dbQueries = Date.now() - dbStartTime;
    console.log(`⏱️ Total DB queries: ${timings.dbQueries}ms`);
    
    // Fetch available ingredients from the global database
    let availableIngredients: any[] = [];
    const ingredientsStartTime = Date.now();
    try {
      const { data: ingredients, error: ingredientsError } = await supabase
        .from("ingredients")
        .select("name, category, unit_type, calories_per_100g, calories_per_100ml, calories_per_piece, protein_per_100g, protein_per_100ml, protein_per_piece, carbs_per_100g, carbs_per_100ml, carbs_per_piece, fat_per_100g, fat_per_100ml, fat_per_piece, fiber_per_100g, fiber_per_100ml, fiber_per_piece")
        .order("name");

      if (!ingredientsError && ingredients) {
        availableIngredients = ingredients;
        timings.ingredientsFetch = Date.now() - ingredientsStartTime;
        console.log(`⏱️ Loaded ${availableIngredients.length} ingredients in ${timings.ingredientsFetch}ms`);
      }
    } catch (error) {
      console.error("Error fetching ingredients:", error);
      // Continue without ingredients database if it fails
    }

    // Helper function to format ingredient data for AI prompt
    const formatIngredientsForAI = (ingredients: any[]) => {
      if (ingredients.length === 0) return "Utilisez des ingrédients courants avec leurs valeurs nutritionnelles estimées.";
      
      // Group ingredients by category for better organization
      const grouped = ingredients.reduce((acc: any, ing: any) => {
        const category = ing.category || 'other';
        if (!acc[category]) acc[category] = [];
        acc[category].push(ing);
        return acc;
      }, {});

      let formattedList = "INGRÉDIENTS DISPONIBLES (utilisez prioritairement ces ingrédients avec leurs données nutritionnelles exactes):\n\n";
      
      Object.entries(grouped).forEach(([category, items]: [string, any]) => {
        formattedList += `${category.toUpperCase()}:\n`;
        (items as any[]).slice(0, 15).forEach(ing => { // Limit to 15 per category to keep prompt manageable
          let nutritionInfo = "";
          if (ing.unit_type === 'g' && ing.calories_per_100g) {
            nutritionInfo = `(${ing.calories_per_100g}kcal, ${ing.protein_per_100g || 0}g prot, ${ing.carbs_per_100g || 0}g gluc, ${ing.fat_per_100g || 0}g lip/100g)`;
          } else if (ing.unit_type === 'ml' && ing.calories_per_100ml) {
            nutritionInfo = `(${ing.calories_per_100ml}kcal, ${ing.protein_per_100ml || 0}g prot, ${ing.carbs_per_100ml || 0}g gluc, ${ing.fat_per_100ml || 0}g lip/100ml)`;
          } else if (ing.unit_type === 'piece' && ing.calories_per_piece) {
            nutritionInfo = `(${ing.calories_per_piece}kcal, ${ing.protein_per_piece || 0}g prot, ${ing.carbs_per_piece || 0}g gluc, ${ing.fat_per_piece || 0}g lip/pièce)`;
          }
          formattedList += `- ${ing.name} ${nutritionInfo}\n`;
        });
        formattedList += "\n";
      });

      return formattedList;
    };

    const ingredientsPromptSection = formatIngredientsForAI(availableIngredients);

    // Input validation is now handled above with Zod schema

    // Generate meal plan using Groq
    const aiStartTime = Date.now();
    console.log('🤖 Starting AI generation...');

    let generatedPlan: any;

    // For longer plans (5+ days), generate in chunks to avoid truncation
    if (duration >= 5) {
      const maxDays = 2; // Reduced to 2 days per request to avoid timeouts
      
      console.log(`📦 Splitting ${duration}-day plan into chunks of ${maxDays} days`);
      
      let allDays = [];
      
      for (let chunk = 0; chunk < Math.ceil(duration / maxDays); chunk++) {
        const startDay = chunk * maxDays + 1;
        const endDay = Math.min(startDay + maxDays - 1, duration);
        const chunkDays = endDay - startDay + 1;
        
        console.log(`🔄 Generating days ${startDay}-${endDay} (${chunkDays} days)`);
        
        // Ultra-minimal prompt to prevent timeouts
        const chunkPrompt = `Génère ${chunkDays} jours de repas (jours ${startDay}-${endDay}), ${targetCalories}cal/jour.

JSON minimal:
{"days":[${Array.from({length: chunkDays}, (_, i) => `{"day":${startDay + i},"meals":{"breakfast":{"name":"...","calories":${Math.round(targetCalories * 0.25)},"protein":15,"carbs":50,"fat":10},"lunch":{"name":"...","calories":${Math.round(targetCalories * 0.35)},"protein":30,"carbs":60,"fat":20},"dinner":{"name":"...","calories":${Math.round(targetCalories * 0.30)},"protein":35,"carbs":45,"fat":15}},"totalCalories":${targetCalories}}`).join(',')}]}

Remplace les ... par des noms de plats français créatifs.`;
        
        try {
          const chunkStartTime = Date.now();
          const completion = await groq.chat.completions.create({
            model: "llama-3.1-8b-instant",
            messages: [{
              role: "user",
              content: chunkPrompt
            }],
            temperature: 0.7, // Reduced for more consistent output
            max_tokens: 2000, // Further reduced for faster response
          });
          
          const text = completion.choices[0]?.message?.content || "";
          
          const chunkTime = Date.now() - chunkStartTime;
          console.log(`⏱️ Chunk ${chunk + 1} generation: ${chunkTime}ms (${text.length} chars)`);
          
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
          
          const chunkData = JSON.parse(jsonText);
          
          if (chunkData.days && Array.isArray(chunkData.days)) {
            allDays.push(...chunkData.days);
          } else {
            throw new Error(`Invalid chunk structure ${chunk + 1}`);
          }
          
        } catch (chunkError) {
          const errorMessage = chunkError instanceof Error ? chunkError.message : String(chunkError);
          console.error(`❌ Chunk ${chunk + 1} failed:`, errorMessage);
          
          // Check if it's a timeout
          if (errorMessage.includes('timeout') || errorMessage.includes('ETIMEDOUT')) {
            console.log('🔄 Retrying with shorter prompt...');
            
            // Retry with ultra-simple prompt
            try {
              const simplePrompt = `{"days":[${Array.from({length: chunkDays}, (_, i) => `{"day":${startDay + i},"meals":{"breakfast":{"name":"Petit-déjeuner","calories":${Math.round(targetCalories*0.25)}},"lunch":{"name":"Déjeuner","calories":${Math.round(targetCalories*0.35)}},"dinner":{"name":"Dîner","calories":${Math.round(targetCalories*0.3)}}},"totalCalories":${targetCalories}}`).join(',')}]}`;
              
              const retryCompletion = await groq.chat.completions.create({
                model: "llama-3.1-8b-instant",
                messages: [{
                  role: "system",
                  content: "Modifie ce JSON en changeant UNIQUEMENT les noms des repas par des noms créatifs français. Ne change RIEN d'autre."
                },
                {
                  role: "user",
                  content: simplePrompt
                }],
                temperature: 0.3,
                max_tokens: 800,
              });
              
              const retryText = retryCompletion.choices[0]?.message?.content || "";
              console.log('✅ Retry successful');
              
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
              console.error('❌ Retry also failed:', retryError);
            }
          }
          
          throw new Error(`Failed to generate chunk ${chunk + 1}: ${errorMessage}`);
        }
      }
      
      timings.aiGeneration = Date.now() - aiStartTime;
      console.log(`⏱️ Total AI generation (chunked): ${timings.aiGeneration}ms`);
      
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
      // Simplified prompt without ingredient list for faster generation
      const enhancedPrompt = `Génère un plan alimentaire en JSON pour ${duration} jours.

${sanitizedPrompt} - ${targetCalories} calories/jour
${[...restrictions, ...clientDietaryTags].length > 0 ? `Restrictions: ${[...restrictions, ...clientDietaryTags].join(", ")}` : ""}

Format JSON EXACT (remplace les ... par des valeurs réelles):
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
            max_tokens: 2000, // Further reduced for faster response
          });
          
          const text = completion.choices[0]?.message?.content || "";
          
          const singleGenTime = Date.now() - singleGenStartTime;
          console.log(`⏱️ Single generation: ${singleGenTime}ms (${text.length} chars)`);

          // Clean and extract JSON
          let jsonText = text.trim();
          jsonText = jsonText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
          
          const jsonStart = jsonText.indexOf("{");
          const jsonEnd = jsonText.lastIndexOf("}");
          
          if (jsonStart === -1 || jsonEnd === -1) {
            console.error(`Short plan attempt ${attempts}: No valid JSON found`);
            if (attempts === maxAttempts) throw new Error("No JSON found after all attempts");
            continue;
          }
          
          jsonText = jsonText.substring(jsonStart, jsonEnd + 1);
          jsonText = jsonText
            .replace(/,\s*}/g, '}')
            .replace(/,\s*]/g, ']')
            .replace(/\/\*[^*]*\*\//g, '')
            .replace(/\/\/.*$/gm, '');

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
      console.error('🚨 Suspicious AI response detected:', responseValidation.reason);
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
      console.log(`⏱️ Total AI generation: ${timings.aiGeneration}ms`);
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
        console.error('⚠️ Failed to track AI usage:', trackingError);
        // Don't fail the request if tracking fails, just log it
      }
      
      timings.usageTracking = Date.now() - trackingStartTime;
      console.log(`⏱️ Usage tracking: ${timings.usageTracking}ms`);
    } catch (trackingError) {
      console.error('⚠️ Unexpected error tracking AI usage:', trackingError);
      // Don't fail the request if tracking fails
    }

    timings.total = Date.now() - startTime;
    console.log('✅ Meal plan generation complete!');
    console.log('📊 Performance summary:', {
      ...timings,
      total: `${timings.total}ms (${(timings.total / 1000).toFixed(2)}s)`
    });
    
    clearTimeout(timeout); // Clear the timeout on success
    
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
    clearTimeout(timeout); // Clear the timeout on error
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
