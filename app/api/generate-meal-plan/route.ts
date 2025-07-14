import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// Server-side only - API key is not exposed to client
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY environment variable is required");
}

const genAI = new GoogleGenerativeAI(apiKey);

export async function POST(request: NextRequest) {
  try {
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

    const {
      prompt,
      clientId,
      duration = 7,
      targetCalories = 2000,
      dietType = "balanced",
      restrictions = [],
      goals = "",
    } = body;

    // Validate input
    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    if (prompt.length < 10 || prompt.length > 1000) {
      return NextResponse.json(
        { error: "Prompt must be between 10 and 1000 characters" },
        { status: 400 }
      );
    }

    // Rate limiting check (basic implementation)
    // In production, you'd want to use a more sophisticated rate limiting solution

    // Generate meal plan using Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const enhancedPrompt = `
Tu es un diététicien-nutritionniste professionnel expert. Crée un plan alimentaire détaillé en français.

DEMANDE: ${prompt}

CONTRAINTES:
- Durée: ${duration} jours
- Objectif calorique: ${targetCalories} calories par jour
- Type de régime: ${dietType}
- Objectifs: ${goals || "Équilibre nutritionnel général"}
- Restrictions: ${restrictions.length > 0 ? restrictions.join(", ") : "Aucune"}

CONSIGNES STRICTES:
1. Réponds UNIQUEMENT en JSON valide
2. Structure EXACTE requise (voir exemple)
3. Tous les champs sont obligatoires
4. Calories précises pour chaque aliment
5. Instructions détaillées en français
6. Ingrédients avec quantités exactes

EXEMPLE DE STRUCTURE JSON:
{
  "name": "Plan Méditerranéen 7 jours",
  "description": "Plan équilibré inspiré du régime méditerranéen",
  "totalDays": 7,
  "averageCaloriesPerDay": 1800,
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
          "name": "Porridge aux fruits",
          "description": "Avoine complète avec fruits frais",
          "calories": 350,
          "protein": 12,
          "carbs": 58,
          "fat": 8,
          "fiber": 6,
          "prepTime": 10,
          "cookTime": 5,
          "ingredients": [
            "80g flocons d'avoine",
            "250ml lait demi-écrémé",
            "1 banane moyenne",
            "50g myrtilles",
            "1 cuillère à soupe miel"
          ],
          "instructions": [
            "Faire chauffer le lait dans une casserole",
            "Ajouter les flocons d'avoine et cuire 5 minutes",
            "Couper la banane en rondelles",
            "Servir avec les fruits et le miel"
          ],
          "tags": ["petit-déjeuner", "fibres", "antioxydants"]
        },
        "lunch": {
          "name": "Salade quinoa légumes",
          "description": "Salade complète au quinoa et légumes frais",
          "calories": 420,
          "protein": 18,
          "carbs": 52,
          "fat": 14,
          "fiber": 8,
          "prepTime": 15,
          "cookTime": 12,
          "ingredients": [
            "100g quinoa cuit",
            "150g pois chiches",
            "1 tomate moyenne",
            "1/2 concombre",
            "50g feta",
            "2 cuillères à soupe huile d'olive"
          ],
          "instructions": [
            "Cuire le quinoa selon les instructions",
            "Couper les légumes en dés",
            "Mélanger tous les ingrédients",
            "Assaisonner avec l'huile d'olive"
          ],
          "tags": ["déjeuner", "protéines végétales", "méditerranéen"]
        },
        "dinner": {
          "name": "Saumon grillé brocolis",
          "description": "Filet de saumon avec légumes vapeur",
          "calories": 380,
          "protein": 32,
          "carbs": 12,
          "fat": 22,
          "fiber": 4,
          "prepTime": 10,
          "cookTime": 15,
          "ingredients": [
            "120g filet de saumon",
            "200g brocolis",
            "1 cuillère à soupe huile d'olive",
            "1 citron",
            "Herbes de Provence"
          ],
          "instructions": [
            "Préchauffer le four à 200°C",
            "Cuire le saumon 12 minutes",
            "Cuire les brocolis à la vapeur",
            "Arroser de citron et huile d'olive"
          ],
          "tags": ["dîner", "oméga-3", "protéines"]
        },
        "snacks": [
          {
            "name": "Yaourt aux noix",
            "description": "Yaourt grec avec noix et miel",
            "calories": 180,
            "protein": 15,
            "carbs": 12,
            "fat": 8,
            "fiber": 1,
            "prepTime": 2,
            "cookTime": 0,
            "ingredients": [
              "150g yaourt grec nature",
              "20g noix",
              "1 cuillère à café miel"
            ],
            "instructions": [
              "Mélanger le yaourt avec le miel",
              "Ajouter les noix concassées"
            ],
            "tags": ["collation", "probiotiques", "protéines"]
          }
        ]
      },
      "totalCalories": 1330,
      "totalProtein": 77,
      "totalCarbs": 134,
      "totalFat": 52
    }
  ]
}

Génère maintenant le plan alimentaire complet selon ces spécifications.`;

    const result = await model.generateContent(enhancedPrompt);
    const response = await result.response;
    const text = response.text();

    // Try to parse JSON from the response
    let jsonStart = text.indexOf("{");
    let jsonEnd = text.lastIndexOf("}") + 1;

    if (jsonStart === -1 || jsonEnd === 0) {
      throw new Error("No JSON found in response");
    }

    const jsonText = text.substring(jsonStart, jsonEnd);
    let generatedPlan;

    try {
      generatedPlan = JSON.parse(jsonText);
    } catch (parseError) {
      console.error("JSON parsing error:", parseError);
      throw new Error("Invalid JSON response from AI");
    }

    // Validate the structure
    if (
      !generatedPlan.name ||
      !generatedPlan.days ||
      !Array.isArray(generatedPlan.days)
    ) {
      throw new Error("Invalid meal plan structure");
    }

    return NextResponse.json({
      success: true,
      data: generatedPlan,
    });
  } catch (error) {
    console.error("Meal plan generation error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate meal plan",
      },
      { status: 500 }
    );
  }
}
