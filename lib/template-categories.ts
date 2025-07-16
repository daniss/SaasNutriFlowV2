/**
 * Template categorization system for professional nutrition practice
 */

// Meal Plan Template Categories
export const MEAL_PLAN_CATEGORIES = {
  weight_loss: {
    label: 'Perte de poids',
    description: 'Plans pour la perte de poids saine',
    icon: 'Target',
    color: 'red'
  },
  muscle_gain: {
    label: 'Prise de masse',
    description: 'Plans pour la prise de masse musculaire',
    icon: 'TrendingUp',
    color: 'green'
  },
  diabetes: {
    label: 'Diabète',
    description: 'Plans adaptés au diabète',
    icon: 'Activity',
    color: 'blue'
  },
  cardiovascular: {
    label: 'Santé cardiovasculaire',
    description: 'Plans pour la santé du cœur',
    icon: 'Heart',
    color: 'pink'
  },
  detox: {
    label: 'Détox',
    description: 'Plans de détoxification',
    icon: 'Leaf',
    color: 'emerald'
  },
  maintenance: {
    label: 'Maintenance',
    description: 'Plans de maintien',
    icon: 'Shield',
    color: 'gray'
  },
  general: {
    label: 'Général',
    description: 'Plans généraux',
    icon: 'ChefHat',
    color: 'slate'
  }
} as const;

// Client Types
export const CLIENT_TYPES = {
  medical: {
    label: 'Médical',
    description: 'Clients avec conditions médicales',
    icon: 'Stethoscope',
    color: 'blue'
  },
  fitness: {
    label: 'Fitness',
    description: 'Clients axés fitness',
    icon: 'Dumbbell',
    color: 'green'
  },
  lifestyle: {
    label: 'Style de vie',
    description: 'Clients lifestyle',
    icon: 'User',
    color: 'purple'
  },
  wellness: {
    label: 'Bien-être',
    description: 'Clients bien-être',
    icon: 'Sparkles',
    color: 'pink'
  },
  general: {
    label: 'Général',
    description: 'Clients généraux',
    icon: 'Users',
    color: 'gray'
  }
} as const;

// Goal Types
export const GOAL_TYPES = {
  weight_loss: {
    label: 'Perte de poids',
    description: 'Objectif de perte de poids',
    icon: 'Target',
    color: 'red'
  },
  muscle_gain: {
    label: 'Prise de masse',
    description: 'Objectif de prise de masse',
    icon: 'TrendingUp',
    color: 'green'
  },
  maintenance: {
    label: 'Maintenance',
    description: 'Maintien du poids',
    icon: 'Shield',
    color: 'blue'
  },
  health_management: {
    label: 'Gestion santé',
    description: 'Gestion de conditions de santé',
    icon: 'Activity',
    color: 'purple'
  },
  detox: {
    label: 'Détox',
    description: 'Objectif de détoxification',
    icon: 'Leaf',
    color: 'emerald'
  },
  general: {
    label: 'Général',
    description: 'Objectif général',
    icon: 'Target',
    color: 'gray'
  }
} as const;

// Recipe Categories
export const RECIPE_MEAL_TYPES = {
  breakfast: {
    label: 'Petit-déjeuner',
    description: 'Recettes pour le petit-déjeuner',
    icon: 'Sunrise',
    color: 'orange'
  },
  lunch: {
    label: 'Déjeuner',
    description: 'Recettes pour le déjeuner',
    icon: 'Sun',
    color: 'yellow'
  },
  dinner: {
    label: 'Dîner',
    description: 'Recettes pour le dîner',
    icon: 'Moon',
    color: 'purple'
  },
  snack: {
    label: 'Collation',
    description: 'Recettes de collations',
    icon: 'Coffee',
    color: 'green'
  },
  dessert: {
    label: 'Dessert',
    description: 'Recettes de desserts',
    icon: 'Cake',
    color: 'pink'
  },
  main: {
    label: 'Principal',
    description: 'Plats principaux',
    icon: 'Utensils',
    color: 'blue'
  }
} as const;

// Cuisine Types
export const CUISINE_TYPES = {
  french: {
    label: 'Française',
    description: 'Cuisine française',
    icon: 'ChefHat',
    color: 'blue'
  },
  mediterranean: {
    label: 'Méditerranéenne',
    description: 'Cuisine méditerranéenne',
    icon: 'Fish',
    color: 'teal'
  },
  asian: {
    label: 'Asiatique',
    description: 'Cuisine asiatique',
    icon: 'Rice',
    color: 'red'
  },
  american: {
    label: 'Américaine',
    description: 'Cuisine américaine',
    icon: 'Burger',
    color: 'yellow'
  },
  italian: {
    label: 'Italienne',
    description: 'Cuisine italienne',
    icon: 'Pizza',
    color: 'green'
  },
  international: {
    label: 'Internationale',
    description: 'Cuisine internationale',
    icon: 'Globe',
    color: 'purple'
  }
} as const;

// Health Benefits
export const HEALTH_BENEFITS = [
  'anti_inflammatory',
  'antioxidant',
  'heart_healthy',
  'brain_boost',
  'immune_support',
  'digestive_health',
  'energy_boost',
  'muscle_recovery',
  'bone_health',
  'skin_health'
] as const;

// Type definitions
export type MealPlanCategory = keyof typeof MEAL_PLAN_CATEGORIES;
export type ClientType = keyof typeof CLIENT_TYPES;
export type GoalType = keyof typeof GOAL_TYPES;
export type RecipeMealType = keyof typeof RECIPE_MEAL_TYPES;
export type CuisineType = keyof typeof CUISINE_TYPES;
export type HealthBenefit = typeof HEALTH_BENEFITS[number];

// Utility functions
export function getCategoryInfo(category: MealPlanCategory) {
  return MEAL_PLAN_CATEGORIES[category] || MEAL_PLAN_CATEGORIES.general;
}

export function getClientTypeInfo(clientType: ClientType) {
  return CLIENT_TYPES[clientType] || CLIENT_TYPES.general;
}

export function getGoalTypeInfo(goalType: GoalType) {
  return GOAL_TYPES[goalType] || GOAL_TYPES.general;
}

export function getRecipeMealTypeInfo(mealType: RecipeMealType) {
  return RECIPE_MEAL_TYPES[mealType] || RECIPE_MEAL_TYPES.main;
}

export function getCuisineTypeInfo(cuisineType: CuisineType) {
  return CUISINE_TYPES[cuisineType] || CUISINE_TYPES.international;
}

// Category suggestions based on client profile
export function suggestCategoriesForClient(client: {
  goal?: string;
  current_weight?: number;
  goal_weight?: number;
  age?: number;
  notes?: string;
}) {
  const suggestions: {
    category: MealPlanCategory;
    clientType: ClientType;
    goalType: GoalType;
    confidence: number;
  }[] = [];

  // Weight loss detection
  if (client.goal_weight && client.current_weight && client.goal_weight < client.current_weight) {
    suggestions.push({
      category: 'weight_loss',
      clientType: 'fitness',
      goalType: 'weight_loss',
      confidence: 0.9
    });
  }

  // Muscle gain detection
  if (client.goal_weight && client.current_weight && client.goal_weight > client.current_weight) {
    suggestions.push({
      category: 'muscle_gain',
      clientType: 'fitness',
      goalType: 'muscle_gain',
      confidence: 0.8
    });
  }

  // Medical conditions detection
  if (client.notes) {
    const notes = client.notes.toLowerCase();
    if (notes.includes('diabète') || notes.includes('diabetes')) {
      suggestions.push({
        category: 'diabetes',
        clientType: 'medical',
        goalType: 'health_management',
        confidence: 0.95
      });
    }
    if (notes.includes('cardio') || notes.includes('cœur') || notes.includes('heart')) {
      suggestions.push({
        category: 'cardiovascular',
        clientType: 'medical',
        goalType: 'health_management',
        confidence: 0.9
      });
    }
  }

  // Age-based suggestions
  if (client.age && client.age > 60) {
    suggestions.push({
      category: 'cardiovascular',
      clientType: 'wellness',
      goalType: 'health_management',
      confidence: 0.6
    });
  }

  // Default suggestion
  if (suggestions.length === 0) {
    suggestions.push({
      category: 'general',
      clientType: 'general',
      goalType: 'general',
      confidence: 0.5
    });
  }

  return suggestions.sort((a, b) => b.confidence - a.confidence);
}

// Filter templates by category
export function filterTemplatesByCategory(
  templates: any[],
  filters: {
    category?: MealPlanCategory;
    clientType?: ClientType;
    goalType?: GoalType;
    mealType?: RecipeMealType;
    cuisineType?: CuisineType;
  }
) {
  return templates.filter(template => {
    if (filters.category && template.category !== filters.category) return false;
    if (filters.clientType && template.client_type !== filters.clientType) return false;
    if (filters.goalType && template.goal_type !== filters.goalType) return false;
    if (filters.mealType && template.meal_type !== filters.mealType) return false;
    if (filters.cuisineType && template.cuisine_type !== filters.cuisineType) return false;
    return true;
  });
}

// Get category statistics
export function getCategoryStats(templates: any[]) {
  const stats = {
    categories: {} as Record<string, number>,
    clientTypes: {} as Record<string, number>,
    goalTypes: {} as Record<string, number>,
    mealTypes: {} as Record<string, number>,
    cuisineTypes: {} as Record<string, number>
  };

  templates.forEach(template => {
    // Count categories
    if (template.category) {
      stats.categories[template.category] = (stats.categories[template.category] || 0) + 1;
    }
    
    // Count client types
    if (template.client_type) {
      stats.clientTypes[template.client_type] = (stats.clientTypes[template.client_type] || 0) + 1;
    }
    
    // Count goal types
    if (template.goal_type) {
      stats.goalTypes[template.goal_type] = (stats.goalTypes[template.goal_type] || 0) + 1;
    }
    
    // Count meal types (for recipes)
    if (template.meal_type) {
      stats.mealTypes[template.meal_type] = (stats.mealTypes[template.meal_type] || 0) + 1;
    }
    
    // Count cuisine types (for recipes)
    if (template.cuisine_type) {
      stats.cuisineTypes[template.cuisine_type] = (stats.cuisineTypes[template.cuisine_type] || 0) + 1;
    }
  });

  return stats;
}