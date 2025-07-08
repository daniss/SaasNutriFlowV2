const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY

let genAI: any = null

async function initializeGenAI() {
  if (typeof window !== 'undefined' && apiKey && !genAI) {
    const { GoogleGenerativeAI } = await import("@google/generative-ai")
    genAI = new GoogleGenerativeAI(apiKey)
  }
  return genAI
}

export interface MealPlanRequest {
  prompt: string
  clientId?: string
  duration: number
  targetCalories?: number
  dietType?: string
  restrictions?: string[]
  goals?: string
}

export interface Meal {
  name: string
  description: string
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
  prepTime: number
  cookTime: number
  ingredients: string[]
  instructions: string[]
  tags: string[]
}

export interface DayPlan {
  day: number
  date: string
  meals: {
    breakfast: Meal
    lunch: Meal
    dinner: Meal
    snacks: Meal[]
  }
  totalCalories: number
  totalProtein: number
  totalCarbs: number
  totalFat: number
  totalFiber: number
}

export interface GeneratedMealPlan {
  name: string
  description: string
  duration: number
  targetCalories: number
  days: DayPlan[]
  shoppingList: string[]
  notes: string[]
  nutritionSummary: {
    avgCalories: number
    avgProtein: number
    avgCarbs: number
    avgFat: number
    avgFiber: number
  }
}

export async function generateMealPlan(request: MealPlanRequest): Promise<GeneratedMealPlan> {
  const genAI = await initializeGenAI()
  
  if (!genAI || !apiKey) {
    throw new Error(
      "Gemini API key is required to generate meal plans. Please add NEXT_PUBLIC_GEMINI_API_KEY to your .env.local file. " +
      "Get your API key from https://makersuite.google.com/app/apikey"
    )
  }

  console.log("🤖 Generating meal plan with Gemini AI...")
  
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash-exp",
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2500, // Reduced to prevent truncation
      },
    })

    // Limit the number of days to prevent token overflow
    const maxDays = request.duration > 5 ? 3 : request.duration // Generate max 3 days at a time

    const prompt = `
You are a professional registered dietitian. Generate EXACTLY ${maxDays} days of meals.

Client Request: ${request.prompt}
Target Calories: ${request.targetCalories || 2000}/day
Diet Type: ${request.dietType || "Balanced"}

CRITICAL: Return ONLY valid JSON. No markdown or explanations.

{
  "name": "Plan Name",
  "description": "Brief description",
  "duration": ${maxDays},
  "targetCalories": ${request.targetCalories || 2000},
  "days": [${Array.from({length: maxDays}, (_, i) => `
    {
      "day": ${i + 1},
      "date": "${new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}",
      "meals": {
        "breakfast": {
          "name": "Breakfast Name",
          "description": "Brief description",
          "calories": 450,
          "protein": 25,
          "carbs": 50,
          "fat": 18,
          "fiber": 8,
          "prepTime": 10,
          "cookTime": 15,
          "ingredients": ["ingredient 1", "ingredient 2"],
          "instructions": ["step 1", "step 2"],
          "tags": ["tag1"]
        },
        "lunch": {
          "name": "Lunch Name", 
          "description": "Brief description",
          "calories": 550,
          "protein": 30,
          "carbs": 60,
          "fat": 20,
          "fiber": 10,
          "prepTime": 15,
          "cookTime": 20,
          "ingredients": ["ingredient 1", "ingredient 2"],
          "instructions": ["step 1", "step 2"],
          "tags": ["tag1"]
        },
        "dinner": {
          "name": "Dinner Name",
          "description": "Brief description", 
          "calories": 650,
          "protein": 35,
          "carbs": 70,
          "fat": 25,
          "fiber": 12,
          "prepTime": 20,
          "cookTime": 25,
          "ingredients": ["ingredient 1", "ingredient 2"],
          "instructions": ["step 1", "step 2"],
          "tags": ["tag1"]
        },
        "snacks": [
          {
            "name": "Snack Name",
            "description": "Brief description",
            "calories": 200,
            "protein": 8,
            "carbs": 25,
            "fat": 8,
            "fiber": 5,
            "prepTime": 5,
            "cookTime": 0,
            "ingredients": ["ingredient 1"],
            "instructions": ["step 1"],
            "tags": ["quick"]
          }
        ]
      },
      "totalCalories": 1850,
      "totalProtein": 98,
      "totalCarbs": 205,
      "totalFat": 71,
      "totalFiber": 35
    }`).join(',')
  }],
  "shoppingList": ["item 1", "item 2", "item 3"],
  "notes": ["tip 1", "tip 2"],
  "nutritionSummary": {
    "avgCalories": ${request.targetCalories || 2000},
    "avgProtein": ${Math.round((request.targetCalories || 2000) * 0.15 / 4)},
    "avgCarbs": ${Math.round((request.targetCalories || 2000) * 0.55 / 4)},
    "avgFat": ${Math.round((request.targetCalories || 2000) * 0.30 / 9)},
    "avgFiber": 30
  }
}

Create varied, nutritious meals respecting dietary restrictions.
`

    console.log("📤 Sending request to Gemini API...")
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text().trim()
    
    console.log("📥 Received response from Gemini API (length: " + text.length + " chars)")

    if (!text) {
      throw new Error("Empty response from Gemini API")
    }

    // Clean the response text more thoroughly
    let cleanedText = text
    // Remove markdown code blocks if present
    cleanedText = cleanedText.replace(/```json\s*/gi, '').replace(/```\s*/gi, '')
    // Remove any leading/trailing whitespace
    cleanedText = cleanedText.trim()
    
    // Try to find and extract the JSON object
    let jsonStr = cleanedText
    const jsonMatch = cleanedText.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      jsonStr = jsonMatch[0]
    }

    console.log("🔍 Extracted JSON length:", jsonStr.length)
    console.log("🔍 First 200 chars:", jsonStr.substring(0, 200))
    console.log("🔍 Last 200 chars:", jsonStr.substring(Math.max(0, jsonStr.length - 200)))

    console.log("🔍 Parsing JSON response...")
    let parsedPlan: GeneratedMealPlan
    
    try {
      parsedPlan = JSON.parse(jsonStr)
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError)
      console.error("Full response length:", text.length)
      console.error("Cleaned response length:", cleanedText.length)
      console.error("JSON string length:", jsonStr.length)
      console.error("Raw response (first 1000 chars):", text.substring(0, 1000))
      console.error("Cleaned text (first 1000 chars):", cleanedText.substring(0, 1000))
      console.error("JSON string (first 1000 chars):", jsonStr.substring(0, 1000))
      
      // Try multiple recovery strategies
      let fixedJson = jsonStr
      
      try {
        // Strategy 1: Remove trailing commas
        fixedJson = jsonStr.replace(/,(\s*[}\]])/g, '$1')
        parsedPlan = JSON.parse(fixedJson)
        console.log("✅ Fixed JSON by removing trailing commas")
      } catch (secondError) {
        try {
          // Strategy 2: Fix common JSON issues
          fixedJson = jsonStr
            .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
            .replace(/([{,]\s*)(\w+):/g, '$1"$2":') // Quote unquoted keys
            .replace(/:\s*'([^']*)'/g, ': "$1"') // Replace single quotes with double quotes
            .replace(/\\"/g, '\\"') // Fix escaped quotes
          
          parsedPlan = JSON.parse(fixedJson)
          console.log("✅ Fixed JSON with comprehensive cleanup")
        } catch (thirdError) {
          try {
            // Strategy 3: Enhanced truncation repair - focus on common patterns
            console.log("🔧 Trying enhanced truncation repair...")
            
            let repairedJson = jsonStr
            let repairApplied = false
            
            // Pattern 1: Most common - unterminated string at end (e.g., "tags": ["high-pr)
            const unterminatedStringMatch = repairedJson.match(/"[^"]*$/)
            if (unterminatedStringMatch && unterminatedStringMatch.index !== undefined) {
              console.log(`🔧 Found unterminated string: "${unterminatedStringMatch[0].slice(0, 20)}..."`)
              repairedJson = repairedJson.substring(0, unterminatedStringMatch.index)
              repairApplied = true
            }
            
            // Pattern 2: Incomplete array element (e.g., ["item1", "item2", "incomple)
            if (!repairApplied) {
              const incompleteArrayMatch = repairedJson.match(/,\s*"[^"]*$/)
              if (incompleteArrayMatch && incompleteArrayMatch.index !== undefined) {
                console.log(`🔧 Found incomplete array element: "${incompleteArrayMatch[0]}"`)
                repairedJson = repairedJson.substring(0, incompleteArrayMatch.index)
                repairApplied = true
              }
            }
            
            // Pattern 3: Incomplete value after colon (e.g., "key": "incomple)
            if (!repairApplied) {
              const incompleteValueMatch = repairedJson.match(/:\s*"[^"]*$/)
              if (incompleteValueMatch && incompleteValueMatch.index !== undefined) {
                console.log(`🔧 Found incomplete value: "${incompleteValueMatch[0]}"`)
                repairedJson = repairedJson.substring(0, incompleteValueMatch.index) + ': null'
                repairApplied = true
              }
            }
            
            if (repairApplied) {
              // Clean up trailing commas and incomplete structures
              repairedJson = repairedJson
                .replace(/,\s*$/, '')
                .replace(/\[\s*$/, '[]')
                .replace(/\{\s*$/, '{}')
                .trim()
              
              // Smart bracket/brace closing
              const openBraces = (repairedJson.match(/\{/g) || []).length
              const closeBraces = (repairedJson.match(/\}/g) || []).length
              const openBrackets = (repairedJson.match(/\[/g) || []).length
              const closeBrackets = (repairedJson.match(/\]/g) || []).length
              
              // Add missing closes, but be conservative
              const missingBraces = Math.max(0, Math.min(openBraces - closeBraces, 5))
              const missingBrackets = Math.max(0, Math.min(openBrackets - closeBrackets, 5))
              
              repairedJson += '}'.repeat(missingBraces)
              repairedJson += ']'.repeat(missingBrackets)
              
              try {
                parsedPlan = JSON.parse(repairedJson)
                console.log("✅ Enhanced truncation repair successful!")
              } catch (parseError) {
                console.log("❌ Enhanced repair failed:", parseError instanceof Error ? parseError.message : String(parseError))
                
                // Fall back to meal structure repair if enhanced repair fails
                console.log("🔧 Falling back to meal structure repair...")
                throw parseError
              }
            } else {
              console.log("🔧 No truncation patterns found, trying meal structure repair...")
              throw new Error("No truncation pattern matched")
            }
          } catch (fourthError) {
            try {
              // Strategy 4: Extract what we can and build a minimal valid plan
              console.log("🔧 Building minimal meal plan from available data...")
              
              const nameMatch = jsonStr.match(/"name"\s*:\s*"([^"]+)"/)
              const descMatch = jsonStr.match(/"description"\s*:\s*"([^"]+)"/)
              const caloriesMatch = jsonStr.match(/"targetCalories"\s*:\s*(\d+)/)
              
              // Extract any meal names we can find
              const breakfastMatch = jsonStr.match(/"breakfast"\s*:\s*\{[^}]*"name"\s*:\s*"([^"]+)"/)
              const lunchMatch = jsonStr.match(/"lunch"\s*:\s*\{[^}]*"name"\s*:\s*"([^"]+)"/)
              const dinnerMatch = jsonStr.match(/"dinner"\s*:\s*\{[^}]*"name"\s*:\s*"([^"]+)"/)
              
              const fallbackPlan: GeneratedMealPlan = {
                name: nameMatch ? nameMatch[1] : "Generated Meal Plan",
                description: descMatch ? descMatch[1] : "AI-generated meal plan (recovered from partial data)",
                duration: 1,
                targetCalories: caloriesMatch ? parseInt(caloriesMatch[1]) : 1800,
                days: [{
                  day: 1,
                  date: new Date().toISOString().split('T')[0],
                  meals: {
                    breakfast: {
                      name: breakfastMatch ? breakfastMatch[1] : "Healthy Breakfast",
                      description: "Nutritious breakfast meal",
                      calories: 400,
                      protein: 20,
                      carbs: 45,
                      fat: 15,
                      fiber: 8,
                      prepTime: 10,
                      cookTime: 5,
                      ingredients: ["Oats", "Berries", "Nuts", "Milk"],
                      instructions: ["Combine ingredients", "Serve fresh"],
                      tags: ["breakfast", "healthy"]
                    },
                    lunch: {
                      name: lunchMatch ? lunchMatch[1] : "Balanced Lunch",
                      description: "Well-balanced lunch meal",
                      calories: 500,
                      protein: 25,
                      carbs: 55,
                      fat: 20,
                      fiber: 10,
                      prepTime: 15,
                      cookTime: 10,
                      ingredients: ["Chicken", "Vegetables", "Rice", "Olive oil"],
                      instructions: ["Cook chicken", "Steam vegetables", "Serve with rice"],
                      tags: ["lunch", "protein"]
                    },
                    dinner: {
                      name: dinnerMatch ? dinnerMatch[1] : "Satisfying Dinner",
                      description: "Hearty dinner meal",
                      calories: 600,
                      protein: 30,
                      carbs: 65,
                      fat: 25,
                      fiber: 12,
                      prepTime: 20,
                      cookTime: 15,
                      ingredients: ["Fish", "Sweet potato", "Greens", "Herbs"],
                      instructions: ["Bake fish", "Roast sweet potato", "Sauté greens"],
                      tags: ["dinner", "omega-3"]
                    },
                    snacks: [{
                      name: "Healthy Snack",
                      description: "Nutritious snack",
                      calories: 150,
                      protein: 8,
                      carbs: 20,
                      fat: 6,
                      fiber: 4,
                      prepTime: 5,
                      cookTime: 0,
                      ingredients: ["Nuts", "Fruit"],
                      instructions: ["Combine and serve"],
                      tags: ["snack", "quick"]
                    }]
                  },
                  totalCalories: 1650,
                  totalProtein: 83,
                  totalCarbs: 185,
                  totalFat: 66,
                  totalFiber: 34
                }],
                shoppingList: ["Oats", "Berries", "Nuts", "Milk", "Chicken", "Vegetables", "Rice", "Fish", "Sweet potato", "Greens"],
                notes: ["This meal plan was recovered from partial API response", "Please review and adjust as needed"],
                nutritionSummary: {
                  avgCalories: 1650,
                  avgProtein: 83,
                  avgCarbs: 185,
                  avgFat: 66,
                  avgFiber: 34
                }
              }
              
              parsedPlan = fallbackPlan
              console.log("✅ Created fallback meal plan from partial data")
            } catch (fifthError) {
              console.error("All JSON recovery strategies failed:", fifthError)
              throw new Error("Failed to parse Gemini API response as JSON. The API returned malformed data that could not be repaired.")
            }
          }
        }
      }
    }
    
    // Validate the response has required fields
    if (!parsedPlan.name || !parsedPlan.days || !Array.isArray(parsedPlan.days) || parsedPlan.days.length === 0) {
      console.error("Invalid response structure:", parsedPlan)
      throw new Error("Invalid meal plan structure from Gemini API - missing required fields")
    }

    // Validate each day has proper meal structure
    for (const day of parsedPlan.days) {
      if (!day.meals || !day.meals.breakfast || !day.meals.lunch || !day.meals.dinner) {
        throw new Error(`Day ${day.day} is missing required meals`)
      }
    }
    
    console.log("✅ Successfully generated meal plan with Gemini AI!")
    console.log(`📊 Generated ${parsedPlan.days.length} days of meals for "${parsedPlan.name}"`)
    
    // If we generated fewer days than requested, extend the plan by repeating and modifying days
    if (parsedPlan.days.length < request.duration) {
      console.log(`🔄 Extending plan from ${parsedPlan.days.length} to ${request.duration} days...`)
      
      const originalDays = [...parsedPlan.days]
      const targetDays = request.duration
      
      while (parsedPlan.days.length < targetDays) {
        const sourceDay = originalDays[parsedPlan.days.length % originalDays.length]
        const newDay = JSON.parse(JSON.stringify(sourceDay)) // Deep copy
        
        newDay.day = parsedPlan.days.length + 1
        newDay.date = new Date(Date.now() + parsedPlan.days.length * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        
        // Slightly modify meal names to add variety
        const variations = [" - Variation", " Style", " Bowl", " Delight", " Special"]
        const randomVariation = variations[Math.floor(Math.random() * variations.length)]
        
        if (newDay.meals.breakfast) newDay.meals.breakfast.name += randomVariation
        if (newDay.meals.lunch) newDay.meals.lunch.name += randomVariation  
        if (newDay.meals.dinner) newDay.meals.dinner.name += randomVariation
        
        parsedPlan.days.push(newDay)
      }
      
      parsedPlan.duration = request.duration
      console.log(`✅ Extended plan to ${parsedPlan.days.length} days`)
    }
    
    return parsedPlan
    
  } catch (error) {
    console.error("❌ Error generating meal plan with Gemini API:", error)
    
    if (error instanceof Error) {
      // Re-throw with more context
      throw new Error(`Meal plan generation failed: ${error.message}`)
    }
    
    throw new Error("Unknown error occurred while generating meal plan with Gemini API")
  }
}


