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
  try {
    // SECURITY: Use validated environment configuration
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.error('❌ GROQ_API_KEY environment variable is missing');
      return NextResponse.json(
        { error: "Service de génération IA indisponible" },
        { status: 503 }
      );
    }

    const groq = new Groq({ apiKey });

    // Get auth token from header
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
      const { count: currentUsage, error: usageError } = await supabase
        .from('ai_generations')
        .select('id', { count: 'exact' })
        .eq('dietitian_id', dietitian.id)
        .eq('generation_successful', true)
        .gte('created_at', startOfMonth.toISOString());

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

    // Fetch available ingredients from the global database
    let availableIngredients: any[] = [];
    try {
      const { data: ingredients, error: ingredientsError } = await supabase
        .from("ingredients")
        .select("name, category, unit_type, calories_per_100g, calories_per_100ml, calories_per_piece, protein_per_100g, protein_per_100ml, protein_per_piece, carbs_per_100g, carbs_per_100ml, carbs_per_piece, fat_per_100g, fat_per_100ml, fat_per_piece, fiber_per_100g, fiber_per_100ml, fiber_per_piece")
        .order("name");

      if (!ingredientsError && ingredients) {
        availableIngredients = ingredients;
        console.log(`Loaded ${availableIngredients.length} ingredients from database`);
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

    let generatedPlan: any;

    // For longer plans (5+ days), generate in chunks to avoid truncation
    if (duration >= 5) {
      const maxDays = 3; // Generate max 3 days per request to avoid truncation
      
      console.log(`📦 Splitting ${duration}-day plan into chunks of ${maxDays} days`);
      
      let allDays = [];
      
      for (let chunk = 0; chunk < Math.ceil(duration / maxDays); chunk++) {
        const startDay = chunk * maxDays + 1;
        const endDay = Math.min(startDay + maxDays - 1, duration);
        const chunkDays = endDay - startDay + 1;
        
        console.log(`🔄 Generating days ${startDay}-${endDay} (${chunkDays} days)`);
        
        const chunkPrompt = `Crée ${chunkDays} jours de plan alimentaire méditerranéen JSON français.

${sanitizedPrompt} - Jours ${startDay} à ${endDay}, environ ${targetCalories} cal/jour
${[...restrictions, ...clientDietaryTags].length > 0 ? `Restrictions et préférences alimentaires: ${[...restrictions, ...clientDietaryTags].join(", ")}` : ""}

${ingredientsPromptSection}

TYPES DE REPAS DISPONIBLES (choisir le plus approprié pour chaque repas):
- "Petit-déjeuner" : repas du matin
- "Collation matin" : en-cas matinal  
- "Déjeuner" : repas de midi
- "Collation après-midi" : en-cas d'après-midi
- "Dîner" : repas du soir
- "Collation soir" : en-cas du soir
- "Pré-entraînement" : avant l'exercice
- "Post-entraînement" : après l'exercice

IMPORTANT:
- Noms de repas créatifs et appétissants  
- 3-4 ingrédients par repas maximum
- Instructions détaillées de préparation
- Les calories peuvent varier de ±50-100 calories par repas (approximation acceptable)
- ingredientsNutrition obligatoire avec données exactes de la base
- OBLIGATOIRE: Numérotation correcte des jours ${startDay} à ${endDay}
- OBLIGATOIRE: Utilisez les types de repas ci-dessus pour le champ "type"
- PRIORITÉ: Utilisez les ingrédients de la base de données ci-dessus avec leurs valeurs nutritionnelles exactes

FORMAT JSON:
{
  "days": [
    {
      "day": ${startDay},
      "meals": {
        "breakfast": {
          "name": "Porridge méditerranéen aux figues",
          "type": "Petit-déjeuner",
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
          "type": "Déjeuner",
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
          "type": "Dîner",
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
            "type": "Collation après-midi",
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
    }${chunkDays > 1 ? `,
    {
      "day": ${startDay + 1},
      "meals": { /* structure identique */ },
      "totalCalories": ${targetCalories}
    }` : ''}${chunkDays > 2 ? `,
    {
      "day": ${startDay + 2},
      "meals": { /* structure identique */ },
      "totalCalories": ${targetCalories}
    }` : ''}
  ]
}

Génère exactement ${chunkDays} jours (${startDay} à ${endDay}) avec la numérotation correcte:`;
        
        try {
          const completion = await groq.chat.completions.create({
            model: "llama-3.1-8b-instant",
            messages: [{
              role: "user",
              content: chunkPrompt
            }],
            temperature: 0.8,
            max_tokens: 8000,
          });
          
          const text = completion.choices[0]?.message?.content || "";
          
          console.log(`📏 Chunk ${chunk + 1} response length: ${text.length} characters`);
          
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
          throw new Error(`Failed to generate chunk ${chunk + 1}: ${errorMessage}`);
        }
      }
      
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
      const enhancedPrompt = `Plan alimentaire JSON français concis.

${sanitizedPrompt} - ${duration} jours, environ ${targetCalories} cal/jour
${[...restrictions, ...clientDietaryTags].length > 0 ? `Restrictions et préférences alimentaires: ${[...restrictions, ...clientDietaryTags].join(", ")}` : ""}

${ingredientsPromptSection}

PRIORITÉ: Utilisez les ingrédients de la base de données avec leurs valeurs nutritionnelles exactes.
MAX 2 ingrédients/repas. Calories approximatives (±50-100 acceptable). JSON direct:
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
          const completion = await groq.chat.completions.create({
            model: "llama-3.1-8b-instant",
            messages: [{
              role: "user",
              content: enhancedPrompt
            }],
            temperature: 0.8,
            max_tokens: 8000,
          });
          
          const text = completion.choices[0]?.message?.content || "";
          
          console.log(`📏 Short plan response length: ${text.length} characters`);

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


    // Track AI usage in dedicated ai_generations table
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
    } catch (trackingError) {
      console.error('⚠️ Unexpected error tracking AI usage:', trackingError);
      // Don't fail the request if tracking fails
    }

    return NextResponse.json({
      success: true,
      data: generatedPlan,
      debug: {
        trackingAttempted: true,
        profileId: user.id,
        dietitianRecordId: dietitian.id
      }
    });
  } catch (error) {
    console.error("Meal plan generation error:", error);

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
