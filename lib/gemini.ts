// Gemini AI Integration - Client-side interface only
// Actual API calls are handled server-side for security

import { createClient } from "@/lib/supabase/client";

export interface MealPlanRequest {
  prompt: string;
  dietitianId: string;
  clientId?: string;
  duration?: number;
  preferences?: string[];
  restrictions?: string[];
  clientDietaryTags?: string[]; // Dietary restrictions from client profile
}

export interface Meal {
  name: string;
  type: "breakfast" | "lunch" | "dinner" | "snack";
  description?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  prepTime?: number;
  cookTime?: number;
  ingredients?: string[];
  instructions?: string[];
  tags?: string[];
}

export interface DayPlan {
  day: number;
  date?: string;
  meals: Meal[];
  totalCalories?: number;
  totalProtein?: number;
  totalCarbs?: number;
  totalFat?: number;
}

// API Response interfaces (what Gemini actually returns)
export interface APIGeneratedMealPlan {
  name: string;
  description?: string;
  totalDays: number;
  averageCaloriesPerDay?: number;
  nutritionSummary?: {
    protein: string;
    carbohydrates: string;
    fat: string;
  };
  days: APIDayPlan[];
}

export interface APIDayPlan {
  day: number;
  date?: string;
  meals: {
    breakfast?: Meal;
    lunch?: Meal;
    dinner?: Meal;
    snacks?: Meal[];
  };
  totalCalories?: number;
  totalProtein?: number;
  totalCarbs?: number;
  totalFat?: number;
}

// Frontend interfaces (what the UI expects)
export interface GeneratedMealPlan {
  title: string;
  description?: string;
  duration: number;
  days: DayPlan[];
  nutritionalGoals?: {
    dailyCalories: number;
    proteinPercentage: number;
    carbPercentage: number;
    fatPercentage: number;
  };
  notes?: string[];
  shoppingList?: string[];
  targetCalories?: number;
  nutritionSummary?: {
    avgCalories: number;
    avgProtein: number;
    avgCarbs: number;
    avgFat: number;
  };
}

// Client-side function that calls the server-side API
export async function generateMealPlan(
  request: MealPlanRequest
): Promise<{ transformed: GeneratedMealPlan; raw: APIGeneratedMealPlan }> {
  console.log("🤖 Generating meal plan via server API...");

  try {
    // Get the current session using Supabase client
    const supabase = createClient();
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.access_token) {
      throw new Error("Authentication required - please sign in");
    }

    const response = await fetch("/api/generate-meal-plan", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(request),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || "Failed to generate meal plan");
    }

    // Transform API response to frontend format
    const transformedData = transformMealPlanData(result.data);
    return { 
      transformed: transformedData,
      raw: result.data 
    };
  } catch (error) {
    console.error("❌ Error generating meal plan:", error);
    throw error;
  }
}

// Transform API response to match frontend expectations
export function transformMealPlanData(apiData: APIGeneratedMealPlan): GeneratedMealPlan {
  // Calculate average nutrition from all days
  let totalCalories = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;
  let dayCount = 0;

  // Transform days and calculate totals
  const transformedDays: DayPlan[] = apiData.days.map((apiDay) => {
    const meals: Meal[] = [];
    
    // Add breakfast
    if (apiDay.meals.breakfast) {
      meals.push({ ...apiDay.meals.breakfast, type: "breakfast" });
    }
    
    // Add lunch
    if (apiDay.meals.lunch) {
      meals.push({ ...apiDay.meals.lunch, type: "lunch" });
    }
    
    // Add dinner
    if (apiDay.meals.dinner) {
      meals.push({ ...apiDay.meals.dinner, type: "dinner" });
    }
    
    // Add snacks - handle both array and single object cases
    if (apiDay.meals.snacks) {
      if (Array.isArray(apiDay.meals.snacks)) {
        // Snacks is an array - iterate through each
        apiDay.meals.snacks.forEach(snack => {
          meals.push({ ...snack, type: "snack" });
        });
      } else if (typeof apiDay.meals.snacks === 'object' && apiDay.meals.snacks !== null) {
        // Snacks is a single object - add it directly
        meals.push({ ...(apiDay.meals.snacks as Meal), type: "snack" });
      }
    }

    // Update totals for averaging
    if (apiDay.totalCalories) {
      totalCalories += apiDay.totalCalories;
      dayCount++;
    }
    if (apiDay.totalProtein) totalProtein += apiDay.totalProtein;
    if (apiDay.totalCarbs) totalCarbs += apiDay.totalCarbs;
    if (apiDay.totalFat) totalFat += apiDay.totalFat;

    return {
      day: apiDay.day,
      date: apiDay.date,
      meals,
      totalCalories: apiDay.totalCalories,
      totalProtein: apiDay.totalProtein,
      totalCarbs: apiDay.totalCarbs,
      totalFat: apiDay.totalFat
    };
  });

  // Calculate averages
  const avgCalories = dayCount > 0 ? Math.round(totalCalories / dayCount) : 0;
  const avgProtein = dayCount > 0 ? Math.round(totalProtein / dayCount) : 0;
  const avgCarbs = dayCount > 0 ? Math.round(totalCarbs / dayCount) : 0;
  const avgFat = dayCount > 0 ? Math.round(totalFat / dayCount) : 0;

  // Parse nutrition percentages from strings and validate calculations
  let proteinPercentage = 25;
  let carbPercentage = 45;
  let fatPercentage = 30;

  if (apiData.nutritionSummary) {
    proteinPercentage = parseInt(apiData.nutritionSummary.protein) || 25;
    carbPercentage = parseInt(apiData.nutritionSummary.carbohydrates) || 45;
    fatPercentage = parseInt(apiData.nutritionSummary.fat) || 30;
  }

  // Validate nutrition calculations and fix if needed
  if (avgCalories > 0 && avgProtein > 0) {
    const calculatedProteinPercent = Math.round((avgProtein * 4 / avgCalories) * 100);
    const calculatedCarbPercent = Math.round((avgCarbs * 4 / avgCalories) * 100);
    const calculatedFatPercent = Math.round((avgFat * 9 / avgCalories) * 100);
    
    // Use calculated percentages if they're more reasonable than the API ones
    if (Math.abs(calculatedProteinPercent - proteinPercentage) > 10) {
      console.warn(`Nutrition percentage mismatch - using calculated: P:${calculatedProteinPercent}% vs API:${proteinPercentage}%`);
      proteinPercentage = calculatedProteinPercent;
      carbPercentage = calculatedCarbPercent;
      fatPercentage = calculatedFatPercent;
    }
  }

  // Generate shopping list from all ingredients
  const shoppingList = generateShoppingList(transformedDays);

  return {
    title: apiData.name,
    description: apiData.description,
    duration: apiData.totalDays,
    days: transformedDays,
    nutritionalGoals: {
      dailyCalories: apiData.averageCaloriesPerDay || avgCalories,
      proteinPercentage,
      carbPercentage,
      fatPercentage
    },
    notes: [],
    shoppingList,
    targetCalories: apiData.averageCaloriesPerDay || avgCalories,
    nutritionSummary: {
      avgCalories,
      avgProtein,
      avgCarbs,
      avgFat
    }
  };
}

// Generate shopping list from meal ingredients
function generateShoppingList(days: DayPlan[]): string[] {
  const ingredientMap = new Map<string, number>();
  
  days.forEach(day => {
    day.meals.forEach(meal => {
      if (meal.ingredients) {
        meal.ingredients.forEach(ingredient => {
          // Simple ingredient parsing (could be enhanced)
          const normalized = ingredient.toLowerCase().trim();
          ingredientMap.set(normalized, (ingredientMap.get(normalized) || 0) + 1);
        });
      }
    });
  });

  // Convert to sorted array
  return Array.from(ingredientMap.keys()).sort();
}
