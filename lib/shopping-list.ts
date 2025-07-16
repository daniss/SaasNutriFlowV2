/**
 * Enhanced Shopping List Service
 * Builds upon the existing basic shopping list functionality in meal plans
 * Adds standalone shopping list management with categories, quantities, and persistence
 */

import { supabase } from './supabase';

export interface ShoppingListItem {
  id: string;
  shopping_list_id: string;
  name: string;
  quantity?: string;
  unit?: string;
  category: string;
  is_purchased: boolean;
  notes?: string;
  meal_plan_id?: string; // Link to meal plan if generated from template
  template_id?: string; // Link to template if generated from template
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface ShoppingList {
  id: string;
  dietitian_id: string;
  client_id?: string;
  name: string;
  description?: string;
  status: 'active' | 'completed' | 'archived';
  is_template: boolean;
  template_category?: string;
  total_items: number;
  completed_items: number;
  meal_plan_id?: string; // Link to meal plan if generated from one
  template_id?: string; // Link to template if generated from one
  created_at: string;
  updated_at: string;
  items?: ShoppingListItem[];
}

export interface ShoppingListCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  order_index: number;
  is_default: boolean;
}

export interface ShoppingListTemplate {
  id: string;
  dietitian_id: string;
  name: string;
  description?: string;
  category: string;
  usage_count: number;
  is_public: boolean;
  tags: string[];
  items: Omit<ShoppingListItem, 'id' | 'shopping_list_id' | 'created_at' | 'updated_at'>[];
  created_at: string;
  updated_at: string;
}

// Default categories for shopping lists
export const DEFAULT_CATEGORIES: ShoppingListCategory[] = [
  { id: 'fruits-vegetables', name: 'Fruits & Légumes', icon: '🥬', color: '#10b981', order_index: 1, is_default: true },
  { id: 'proteins', name: 'Protéines', icon: '🥩', color: '#ef4444', order_index: 2, is_default: true },
  { id: 'dairy', name: 'Produits laitiers', icon: '🥛', color: '#3b82f6', order_index: 3, is_default: true },
  { id: 'grains', name: 'Céréales & Féculents', icon: '🌾', color: '#f59e0b', order_index: 4, is_default: true },
  { id: 'condiments', name: 'Condiments & Épices', icon: '🧂', color: '#8b5cf6', order_index: 5, is_default: true },
  { id: 'beverages', name: 'Boissons', icon: '🥤', color: '#06b6d4', order_index: 6, is_default: true },
  { id: 'frozen', name: 'Produits surgelés', icon: '❄️', color: '#0ea5e9', order_index: 7, is_default: true },
  { id: 'bakery', name: 'Boulangerie', icon: '🥖', color: '#d97706', order_index: 8, is_default: true },
  { id: 'other', name: 'Autres', icon: '🛒', color: '#6b7280', order_index: 9, is_default: true }
];

export class ShoppingListService {
  /**
   * Create a new shopping list
   */
  static async createShoppingList(
    dietitianId: string,
    listData: Omit<ShoppingList, 'id' | 'dietitian_id' | 'total_items' | 'completed_items' | 'created_at' | 'updated_at'>
  ): Promise<ShoppingList> {
    const { data, error } = await supabase
      .from('shopping_lists')
      .insert({
        dietitian_id: dietitianId,
        total_items: 0,
        completed_items: 0,
        ...listData
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get shopping lists for a dietitian
   */
  static async getShoppingLists(
    dietitianId: string,
    filters?: {
      clientId?: string;
      status?: string;
      isTemplate?: boolean;
    }
  ): Promise<ShoppingList[]> {
    let query = supabase
      .from('shopping_lists')
      .select(`
        *,
        items:shopping_list_items(
          id,
          name,
          quantity,
          unit,
          category,
          is_purchased,
          notes,
          order_index
        )
      `)
      .eq('dietitian_id', dietitianId)
      .order('created_at', { ascending: false });

    if (filters?.clientId) {
      query = query.eq('client_id', filters.clientId);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.isTemplate !== undefined) {
      query = query.eq('is_template', filters.isTemplate);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  /**
   * Get a specific shopping list with items
   */
  static async getShoppingList(listId: string): Promise<ShoppingList | null> {
    const { data, error } = await supabase
      .from('shopping_lists')
      .select(`
        *,
        items:shopping_list_items(
          id,
          name,
          quantity,
          unit,
          category,
          is_purchased,
          notes,
          meal_plan_id,
          template_id,
          order_index,
          created_at,
          updated_at
        )
      `)
      .eq('id', listId)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update shopping list
   */
  static async updateShoppingList(
    listId: string,
    updates: Partial<ShoppingList>
  ): Promise<ShoppingList> {
    const { data, error } = await supabase
      .from('shopping_lists')
      .update(updates)
      .eq('id', listId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete shopping list
   */
  static async deleteShoppingList(listId: string): Promise<void> {
    const { error } = await supabase
      .from('shopping_lists')
      .delete()
      .eq('id', listId);

    if (error) throw error;
  }

  /**
   * Add item to shopping list
   */
  static async addItem(
    listId: string,
    itemData: Omit<ShoppingListItem, 'id' | 'shopping_list_id' | 'created_at' | 'updated_at'>
  ): Promise<ShoppingListItem> {
    const { data, error } = await supabase
      .from('shopping_list_items')
      .insert({
        shopping_list_id: listId,
        ...itemData
      })
      .select()
      .single();

    if (error) throw error;

    // Update list totals
    await this.updateListTotals(listId);
    
    return data;
  }

  /**
   * Update shopping list item
   */
  static async updateItem(
    itemId: string,
    updates: Partial<ShoppingListItem>
  ): Promise<ShoppingListItem> {
    const { data, error } = await supabase
      .from('shopping_list_items')
      .update(updates)
      .eq('id', itemId)
      .select()
      .single();

    if (error) throw error;

    // Update list totals if purchase status changed
    if (updates.is_purchased !== undefined) {
      await this.updateListTotals(data.shopping_list_id);
    }

    return data;
  }

  /**
   * Delete shopping list item
   */
  static async deleteItem(itemId: string): Promise<void> {
    // Get the item to know which list to update
    const { data: item } = await supabase
      .from('shopping_list_items')
      .select('shopping_list_id')
      .eq('id', itemId)
      .single();

    const { error } = await supabase
      .from('shopping_list_items')
      .delete()
      .eq('id', itemId);

    if (error) throw error;

    // Update list totals
    if (item) {
      await this.updateListTotals(item.shopping_list_id);
    }
  }

  /**
   * Toggle item purchase status
   */
  static async toggleItemPurchased(itemId: string): Promise<ShoppingListItem> {
    const { data: item } = await supabase
      .from('shopping_list_items')
      .select('is_purchased, shopping_list_id')
      .eq('id', itemId)
      .single();

    if (!item) throw new Error('Item not found');

    const { data, error } = await supabase
      .from('shopping_list_items')
      .update({ is_purchased: !item.is_purchased })
      .eq('id', itemId)
      .select()
      .single();

    if (error) throw error;

    // Update list totals
    await this.updateListTotals(item.shopping_list_id);

    return data;
  }

  /**
   * Generate shopping list from meal plan template
   */
  static async generateFromTemplate(
    dietitianId: string,
    templateId: string,
    options: {
      clientId?: string;
      name?: string;
      servings?: number;
      excludeIngredients?: string[];
    } = {}
  ): Promise<ShoppingList> {
    // Get template with meal structure
    const { data: template, error: templateError } = await supabase
      .from('meal_plan_templates')
      .select('*')
      .eq('id', templateId)
      .eq('dietitian_id', dietitianId)
      .single();

    if (templateError) throw templateError;

    // Extract ingredients from template
    const ingredients = this.extractIngredientsFromTemplate(template, options.servings || 1);
    
    // Filter out excluded ingredients
    const filteredIngredients = options.excludeIngredients 
      ? ingredients.filter(ing => !options.excludeIngredients!.includes(ing.name.toLowerCase()))
      : ingredients;

    // Create shopping list
    const shoppingList = await this.createShoppingList(dietitianId, {
      name: options.name || `Liste pour ${template.name}`,
      description: `Liste générée automatiquement depuis le template "${template.name}"`,
      client_id: options.clientId,
      status: 'active',
      is_template: false,
      template_id: templateId
    });

    // Add items to shopping list
    for (const [index, ingredient] of filteredIngredients.entries()) {
      await this.addItem(shoppingList.id, {
        name: ingredient.name,
        quantity: ingredient.quantity,
        unit: ingredient.unit,
        category: ingredient.category,
        is_purchased: false,
        template_id: templateId,
        order_index: index
      });
    }

    return shoppingList;
  }

  /**
   * Generate shopping list from existing meal plan
   */
  static async generateFromMealPlan(
    dietitianId: string,
    mealPlanId: string,
    options: {
      clientId?: string;
      name?: string;
      excludeIngredients?: string[];
    } = {}
  ): Promise<ShoppingList> {
    // Get meal plan
    const { data: mealPlan, error: mealPlanError } = await supabase
      .from('meal_plans')
      .select('*')
      .eq('id', mealPlanId)
      .eq('dietitian_id', dietitianId)
      .single();

    if (mealPlanError) throw mealPlanError;

    // Extract ingredients from meal plan
    const ingredients = this.extractIngredientsFromMealPlan(mealPlan);
    
    // Filter out excluded ingredients
    const filteredIngredients = options.excludeIngredients 
      ? ingredients.filter(ing => !options.excludeIngredients!.includes(ing.name.toLowerCase()))
      : ingredients;

    // Create shopping list
    const shoppingList = await this.createShoppingList(dietitianId, {
      name: options.name || `Liste pour ${mealPlan.name}`,
      description: `Liste générée automatiquement depuis le plan repas "${mealPlan.name}"`,
      client_id: options.clientId,
      status: 'active',
      is_template: false,
      meal_plan_id: mealPlanId
    });

    // Add items to shopping list
    for (const [index, ingredient] of filteredIngredients.entries()) {
      await this.addItem(shoppingList.id, {
        name: ingredient.name,
        quantity: ingredient.quantity,
        unit: ingredient.unit,
        category: ingredient.category,
        is_purchased: false,
        meal_plan_id: mealPlanId,
        order_index: index
      });
    }

    return shoppingList;
  }

  /**
   * Create shopping list template
   */
  static async createTemplate(
    dietitianId: string,
    templateData: Omit<ShoppingListTemplate, 'id' | 'dietitian_id' | 'usage_count' | 'created_at' | 'updated_at'>
  ): Promise<ShoppingListTemplate> {
    const { data, error } = await supabase
      .from('shopping_list_templates')
      .insert({
        dietitian_id: dietitianId,
        usage_count: 0,
        ...templateData
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get shopping list templates
   */
  static async getTemplates(
    dietitianId: string,
    category?: string
  ): Promise<ShoppingListTemplate[]> {
    let query = supabase
      .from('shopping_list_templates')
      .select('*')
      .eq('dietitian_id', dietitianId)
      .order('usage_count', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  /**
   * Update list totals (total_items and completed_items)
   */
  private static async updateListTotals(listId: string): Promise<void> {
    const { data: items } = await supabase
      .from('shopping_list_items')
      .select('is_purchased')
      .eq('shopping_list_id', listId);

    if (items) {
      const totalItems = items.length;
      const completedItems = items.filter(item => item.is_purchased).length;

      await supabase
        .from('shopping_lists')
        .update({ 
          total_items: totalItems,
          completed_items: completedItems
        })
        .eq('id', listId);
    }
  }

  /**
   * Extract ingredients from meal plan template
   */
  private static extractIngredientsFromTemplate(
    template: any,
    servings: number
  ): Array<{name: string; quantity?: string; unit?: string; category: string}> {
    const ingredients: Array<{name: string; quantity?: string; unit?: string; category: string}> = [];
    
    try {
      const mealStructure = template.meal_structure || [];
      
      for (const day of mealStructure) {
        for (const meal of day.meals || []) {
          if (meal.ingredients) {
            for (const ingredient of meal.ingredients) {
              const parsed = this.parseIngredient(ingredient);
              
              // Adjust quantity for servings
              if (parsed.quantity && servings !== 1) {
                const qty = parseFloat(parsed.quantity);
                if (!isNaN(qty)) {
                  parsed.quantity = (qty * servings).toString();
                }
              }
              
              ingredients.push(parsed);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error extracting ingredients from template:', error);
    }

    // Consolidate duplicate ingredients
    return this.consolidateIngredients(ingredients);
  }

  /**
   * Extract ingredients from meal plan
   */
  private static extractIngredientsFromMealPlan(
    mealPlan: any
  ): Array<{name: string; quantity?: string; unit?: string; category: string}> {
    const ingredients: Array<{name: string; quantity?: string; unit?: string; category: string}> = [];
    
    try {
      // Use existing shopping_list if available
      if (mealPlan.shopping_list && Array.isArray(mealPlan.shopping_list)) {
        for (const item of mealPlan.shopping_list) {
          ingredients.push(this.parseIngredient(item));
        }
      } else {
        // Extract from meal plan structure
        const planData = mealPlan.plan_data || {};
        const days = planData.days || [];
        
        for (const day of days) {
          for (const meal of day.meals || []) {
            if (meal.ingredients) {
              for (const ingredient of meal.ingredients) {
                ingredients.push(this.parseIngredient(ingredient));
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error extracting ingredients from meal plan:', error);
    }

    return this.consolidateIngredients(ingredients);
  }

  /**
   * Parse ingredient string into structured format
   */
  private static parseIngredient(ingredient: string): {name: string; quantity?: string; unit?: string; category: string} {
    const cleanIngredient = ingredient.trim();
    
    // Try to extract quantity and unit using regex
    const quantityMatch = cleanIngredient.match(/^(\d+(?:\.\d+)?)\s*([a-zA-Z]+)?\s+(.+)$/);
    
    if (quantityMatch) {
      const [, quantity, unit, name] = quantityMatch;
      return {
        name: name.trim(),
        quantity: quantity,
        unit: unit || undefined,
        category: this.categorizeIngredient(name.trim())
      };
    }
    
    // No quantity found, treat as simple ingredient
    return {
      name: cleanIngredient,
      category: this.categorizeIngredient(cleanIngredient)
    };
  }

  /**
   * Categorize ingredient based on name
   */
  private static categorizeIngredient(name: string): string {
    const lowerName = name.toLowerCase();
    
    // Fruits & Vegetables
    if (lowerName.match(/\b(pomme|poire|banane|orange|citron|tomate|carotte|oignon|ail|épinard|laitue|brocoli|courgette|aubergine|poivron|champignon|avocat|concombre|radis|salade|chou|haricot|petit pois|maïs|artichaut|asperge|betterave|céleri|fenouil|navet|panais|poireau|potiron|courge|melon|pastèque|fraise|cerise|abricot|pêche|prune|raisin|kiwi|ananas|mangue|papaye|fruit|légume|herbe|persil|ciboulette|basilic|thym|romarin|menthe|coriandre|estragon)\b/)) {
      return 'fruits-vegetables';
    }
    
    // Proteins
    if (lowerName.match(/\b(viande|porc|bœuf|agneau|veau|poisson|saumon|thon|sardine|maquereau|truite|cabillaud|sole|lotte|crevette|moule|huître|crabe|homard|poulet|dinde|canard|œuf|jambon|lard|bacon|saucisse|merguez|steak|escalope|rôti|côte|filet|gigot|cuisse|blanc)\b/)) {
      return 'proteins';
    }
    
    // Dairy
    if (lowerName.match(/\b(lait|yaourt|fromage|beurre|crème|mozzarella|gruyère|emmental|chèvre|roquefort|camembert|brie|mascarpone|ricotta|parmesan|feta|crème fraîche|crème liquide|lait de coco|lait d'amande|lait d'avoine)\b/)) {
      return 'dairy';
    }
    
    // Grains & Starches
    if (lowerName.match(/\b(riz|pâtes|blé|farine|pain|céréales|avoine|quinoa|orge|sarrasin|millet|semoule|couscous|boulgour|vermicelle|tagliatelle|spaghetti|penne|fusilli|farfalle|lasagne|ravioli|gnocchi|pomme de terre|patate|manioc|igname|tapioca|polenta|épeautre|kamut|amarante)\b/)) {
      return 'grains';
    }
    
    // Condiments & Spices
    if (lowerName.match(/\b(sel|poivre|sucre|huile|vinaigre|moutarde|mayonnaise|ketchup|sauce|épice|cannelle|muscade|clou de girofle|cardamome|coriandre|cumin|curry|paprika|piment|cayenne|tabasco|harissa|wasabi|gingembre|curcuma|safran|vanille|sirop|miel|confiture|gelée|compote|bouillon|fond|concentré|levure|bicarbonate|agar|gélatine)\b/)) {
      return 'condiments';
    }
    
    // Beverages
    if (lowerName.match(/\b(eau|jus|vin|bière|cidre|champagne|whisky|rhum|vodka|gin|cognac|liqueur|apéritif|digestif|tisane|thé|café|chocolat|cacao|soda|limonade|sirop|smoothie|milkshake|boisson)\b/)) {
      return 'beverages';
    }
    
    // Frozen
    if (lowerName.match(/\b(surgelé|congelé|glace|sorbet|frozen)\b/)) {
      return 'frozen';
    }
    
    // Bakery
    if (lowerName.match(/\b(pain|baguette|croissant|brioche|viennoiserie|pâtisserie|gâteau|tarte|muffin|cookie|biscuit|cracker|toast|biscottes|chapelure|levure|pâte feuilletée|pâte brisée|pâte sablée)\b/)) {
      return 'bakery';
    }
    
    // Default to 'other'
    return 'other';
  }

  /**
   * Consolidate duplicate ingredients
   */
  private static consolidateIngredients(
    ingredients: Array<{name: string; quantity?: string; unit?: string; category: string}>
  ): Array<{name: string; quantity?: string; unit?: string; category: string}> {
    const consolidated = new Map<string, {name: string; quantity?: string; unit?: string; category: string}>();
    
    for (const ingredient of ingredients) {
      const key = ingredient.name.toLowerCase();
      
      if (consolidated.has(key)) {
        const existing = consolidated.get(key)!;
        
        // Try to combine quantities if same unit
        if (existing.quantity && ingredient.quantity && existing.unit === ingredient.unit) {
          const existingQty = parseFloat(existing.quantity);
          const newQty = parseFloat(ingredient.quantity);
          
          if (!isNaN(existingQty) && !isNaN(newQty)) {
            existing.quantity = (existingQty + newQty).toString();
          }
        }
      } else {
        consolidated.set(key, { ...ingredient });
      }
    }
    
    return Array.from(consolidated.values());
  }
}