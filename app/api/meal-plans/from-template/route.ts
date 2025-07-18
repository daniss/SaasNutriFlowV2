import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { templateId, clientId, customizations } = await request.json()

    console.log('Request data:', { templateId, clientId, customizations })

    // Validate required fields
    if (!templateId || !clientId) {
      return NextResponse.json(
        { error: "Template ID and Client ID are required" },
        { status: 400 }
      )
    }

    // Fetch the template
    const { data: template, error: templateError } = await supabase
      .from('meal_plan_templates')
      .select('*')
      .eq('id', templateId)
      .eq('dietitian_id', user.id)
      .single()

    console.log('Template fetch result:', { template, templateError })

    if (templateError || !template) {
      console.error('Template not found:', { templateId, userId: user.id, templateError })
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      )
    }

    // Verify client belongs to dietitian
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, name')
      .eq('id', clientId)
      .eq('dietitian_id', user.id)
      .single()

    console.log('Client fetch result:', { client, clientError })

    if (clientError || !client) {
      console.error('Client not found:', { clientId, userId: user.id, clientError })
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      )
    }

    // Transform template meal_structure to meal plan format with recipe lookup
    async function transformTemplateToPlanContent(templateStructure: any, duration: number): Promise<any> {
      const days = []
      
      // Ensure templateStructure is array format
      const templateDays = Array.isArray(templateStructure) ? templateStructure : []
      
      // Convert template day structure to meal plan day structure
      for (let dayNum = 1; dayNum <= duration; dayNum++) {
        const templateDay = templateDays.find(d => d.day === dayNum)
        
        if (templateDay && templateDay.meals) {
          // Create meal categorization mapping
          const categorizedMeals: {
            breakfast: string[]
            lunch: string[]
            dinner: string[]
            snacks: string[]
          } = {
            breakfast: [],
            lunch: [],
            dinner: [],
            snacks: []
          }
          
          // Map meal times for the day
          const mealTimes = {
            breakfastHour: "08:00",
            lunchHour: "12:00",
            dinnerHour: "19:00",
            snacksHour: "16:00"
          }
          
          // Process each meal slot from template
          for (const meal of templateDay.meals) {
            const category = mapMealNameToCategory(meal.name)
            const mealContent = meal.description || meal.name || 'Repas à définir'
            
            // Add meal to appropriate category
            categorizedMeals[category].push(mealContent)
            
            // Set meal time based on meal type
            if (category === 'breakfast') mealTimes.breakfastHour = meal.time || "08:00"
            else if (category === 'lunch') mealTimes.lunchHour = meal.time || "12:00"
            else if (category === 'dinner') mealTimes.dinnerHour = meal.time || "19:00"
            else if (category === 'snacks') mealTimes.snacksHour = meal.time || "16:00"
          }
          
          // Enhanced meal transformation with recipe lookup
          const dayPlan = {
            day: dayNum,
            date: new Date(Date.now() + (dayNum - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            meals: {
              breakfast: categorizedMeals.breakfast,
              lunch: categorizedMeals.lunch,
              dinner: categorizedMeals.dinner,
              snacks: categorizedMeals.snacks
            },
            notes: templateDay.notes || '',
            // Add meal timing from template
            ...mealTimes,
            // Enable/disable meals based on what's in template
            breakfastEnabled: categorizedMeals.breakfast.length > 0,
            lunchEnabled: categorizedMeals.lunch.length > 0,
            dinnerEnabled: categorizedMeals.dinner.length > 0,
            snacksEnabled: categorizedMeals.snacks.length > 0,
            // Preserve rich template data for advanced features
            templateData: templateDay
          }
          days.push(dayPlan)
        } else {
          // Create placeholder for missing days
          days.push({
            day: dayNum,
            date: new Date(Date.now() + (dayNum - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            meals: {
              breakfast: [],
              lunch: [],
              dinner: [],
              snacks: []
            },
            notes: '',
            breakfastHour: "08:00",
            lunchHour: "12:00",
            dinnerHour: "19:00",
            snacksHour: "16:00",
            breakfastEnabled: false,
            lunchEnabled: false,
            dinnerEnabled: false,
            snacksEnabled: false,
            templateData: null
          })
        }
      }
      
      return { days }
    }

    // Helper function to map meal names to categories
    function mapMealNameToCategory(mealName: string): 'breakfast' | 'lunch' | 'dinner' | 'snacks' {
      const name = mealName.toLowerCase()
      
      if (name.includes('petit-déjeuner') || name.includes('petit déjeuner') || name.includes('breakfast')) {
        return 'breakfast'
      } else if (name.includes('déjeuner') || name.includes('lunch')) {
        return 'lunch'
      } else if (name.includes('dîner') || name.includes('diner') || name.includes('dinner')) {
        return 'dinner'
      } else if (name.includes('collation') || name.includes('goûter') || name.includes('snack')) {
        return 'snacks'
      }
      
      // Default mapping based on common meal names
      return 'snacks'
    }

    // Helper function to transform meal with recipe lookup
    async function transformMealWithRecipes(mealData: any, mealType: string): Promise<string[]> {
      if (!mealData) return []
      
      // If mealData has a recipe_id, try to fetch the recipe
      if (mealData.recipe_id) {
        try {
          const { data: recipe, error } = await supabase
            .from('recipes')
            .select(`
              name, 
              calories_per_serving, 
              prep_time, 
              cook_time, 
              protein_per_serving,
              carbs_per_serving,
              fat_per_serving
            `)
            .eq('id', mealData.recipe_id)
            .eq('dietitian_id', user!.id)
            .single()

          if (!error && recipe) {
            const totalTime = (recipe.prep_time || 0) + (recipe.cook_time || 0)
            const nutritionInfo = []
            
            if (recipe.calories_per_serving) nutritionInfo.push(`${recipe.calories_per_serving} kcal`)
            if (recipe.protein_per_serving) nutritionInfo.push(`P: ${recipe.protein_per_serving}g`)
            if (recipe.carbs_per_serving) nutritionInfo.push(`G: ${recipe.carbs_per_serving}g`)
            if (recipe.fat_per_serving) nutritionInfo.push(`L: ${recipe.fat_per_serving}g`)
            
            const timeInfo = totalTime > 0 ? ` - ${totalTime} min` : ''
            const nutritionText = nutritionInfo.length > 0 ? ` (${nutritionInfo.join(', ')})` : ''
            
            return [`${recipe.name}${nutritionText}${timeInfo}`]
          }
        } catch (error) {
          console.error('Error fetching recipe:', error)
        }
      }
      
      // Fallback to original template structure
      if (mealData.name) {
        const calories = mealData.calories ? ` (${mealData.calories} kcal` : ''
        const time = mealData.prep_time ? ` - ${mealData.prep_time}` : ''
        const closing = (calories || time) ? ')' : ''
        
        return [`${mealData.name}${calories}${time}${closing}`]
      }
      
      // Handle array of meal items
      if (Array.isArray(mealData)) {
        const transformedMeals = []
        for (const item of mealData) {
          const transformed = await transformMealWithRecipes(item, mealType)
          transformedMeals.push(...transformed)
        }
        return transformedMeals
      }
      
      return []
    }

    // Convert template structure to meal plan content
    const duration = customizations?.duration_days || template.duration_days || 7
    const transformedMealData = await transformTemplateToPlanContent(template.meal_structure, duration)
    
    const planContent: any = {
      generated_by: 'template',
      template_id: templateId,
      template_name: template.name,
      ...transformedMealData, // Include the transformed days
      target_macros: template.target_macros,
      difficulty: template.difficulty,
      notes: customizations?.notes || template.description || '',
      customizations: customizations || {},
      created_from_template_at: new Date().toISOString()
    }

    // Apply customizations if provided
    if (customizations) {
      if (customizations.target_calories) {
        planContent.target_calories = customizations.target_calories
      }
      if (customizations.duration_days) {
        planContent.duration_days = customizations.duration_days
      }
      if (customizations.meal_modifications) {
        planContent.meal_modifications = customizations.meal_modifications
      }
    }

    // Create the meal plan
    const mealPlanData = {
      dietitian_id: user.id,
      client_id: clientId,
      template_id: templateId,
      generation_method: 'template',
      name: customizations?.name || `${template.name} - ${client.name}`,
      description: customizations?.description || `Plan basé sur le modèle "${template.name}" pour ${client.name}`,
      duration_days: customizations?.duration_days || template.duration_days,
      calories_range: customizations?.target_calories || template.target_calories,
      plan_content: planContent,
      status: 'draft'
    }

    console.log('Creating meal plan with data:', mealPlanData)

    const { data: mealPlan, error: mealPlanError } = await supabase
      .from('meal_plans')
      .insert(mealPlanData)
      .select(`
        *,
        clients (name),
        meal_plan_templates (name)
      `)
      .single()

    console.log('Meal plan creation result:', { mealPlan, mealPlanError })

    if (mealPlanError) throw mealPlanError

    // Update template usage statistics
    await supabase
      .from('meal_plan_templates')
      .update({
        usage_count: template.usage_count + 1,
        last_used_at: new Date().toISOString()
      })
      .eq('id', templateId)

    return NextResponse.json({ 
      mealPlan,
      message: `Plan alimentaire créé avec succès à partir du modèle "${template.name}"` 
    }, { status: 201 })

  } catch (error) {
    console.error("Error creating meal plan from template:", error)
    
    // More detailed error logging
    if (error instanceof Error) {
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name
      })
    }
    
    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error)
    return NextResponse.json(
      { error: `Failed to create meal plan from template: ${errorMessage}` },
      { status: 500 }
    )
  }
}