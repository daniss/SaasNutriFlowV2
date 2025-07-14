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
}

export interface Meal {
  name: string;
  type: "breakfast" | "lunch" | "dinner" | "snack";
  description?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  ingredients?: string[];
  instructions?: string[];
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
}

// Client-side function that calls the server-side API
export async function generateMealPlan(
  request: MealPlanRequest
): Promise<GeneratedMealPlan> {
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

    return result.data;
  } catch (error) {
    console.error("❌ Error generating meal plan:", error);
    throw error;
  }
}
