import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30' // days
    const category = searchParams.get('category')

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - parseInt(period))

    // Get template analytics data
    const { data: templates, error: templatesError } = await supabase
      .from('meal_plan_templates')
      .select(`
        id,
        name,
        category,
        usage_count,
        created_at,
        updated_at
      `)
      .eq('dietitian_id', user.id)
      .order('usage_count', { ascending: false })

    if (templatesError) throw templatesError

    // Get meal plans created from templates in the period
    const { data: mealPlans, error: mealPlansError } = await supabase
      .from('meal_plans')
      .select(`
        id,
        name,
        template_id,
        client_id,
        created_at,
        status,
        clients!inner(
          id,
          name,
          current_weight,
          goal_weight
        )
      `)
      .eq('dietitian_id', user.id)
      .not('template_id', 'is', null)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())

    if (mealPlansError) throw mealPlansError


    // Calculate analytics for each template
    const templateAnalytics = templates.map(template => {
      const templateMealPlans = mealPlans.filter(mp => mp.template_id === template.id)

      // Basic usage metrics
      const usageCount = templateMealPlans.length
      const uniqueClients = new Set(templateMealPlans.map(mp => mp.client_id)).size
      const completionRate = templateMealPlans.filter(mp => mp.status === 'completed').length / 
                            Math.max(templateMealPlans.length, 1) * 100

      // Performance trends
      const performanceTrend = usageCount > template.usage_count * 0.7 ? 'improving' : 
                              usageCount < template.usage_count * 0.3 ? 'declining' : 'stable'

      return {
        template_id: template.id,
        template_name: template.name,
        category: template.category,
        usage_count: usageCount,
        total_usage: template.usage_count,
        unique_clients: uniqueClients,
        completion_rate: Math.round(completionRate * 10) / 10,
        performance_trend: performanceTrend,
        created_at: template.created_at,
        updated_at: template.updated_at
      }
    })

    // Filter by category if provided
    let filteredAnalytics = templateAnalytics
    if (category) {
      filteredAnalytics = templateAnalytics.filter(t => t.category === category)
    }

    // Sort by usage count
    filteredAnalytics.sort((a, b) => b.usage_count - a.usage_count)

    // Calculate summary statistics
    const totalTemplates = filteredAnalytics.length
    const totalUsage = filteredAnalytics.reduce((sum, t) => sum + t.usage_count, 0)
    const averageUsage = totalTemplates > 0 ? totalUsage / totalTemplates : 0
    const topPerformers = filteredAnalytics.filter(t => t.usage_count >= 5)
    const needsImprovement = filteredAnalytics.filter(t => t.usage_count < 2)

    // Category breakdown
    const categoryBreakdown = templates.reduce((acc, template) => {
      const category = template.category || 'uncategorized'
      if (!acc[category]) {
        acc[category] = {
          category,
          count: 0,
          total_usage: 0,
          average_usage: 0
        }
      }
      
      const analytics = filteredAnalytics.find(a => a.template_id === template.id)
      acc[category].count++
      acc[category].total_usage += analytics?.usage_count || 0
      acc[category].average_usage += analytics?.usage_count || 0
      
      return acc
    }, {} as Record<string, any>)

    // Calculate averages for categories
    Object.values(categoryBreakdown).forEach((cat: any) => {
      cat.average_usage = cat.count > 0 ? 
        Math.round((cat.average_usage / cat.count) * 10) / 10 : 0
    })

    // Performance over time (mock data - could be enhanced with real time series)
    const performanceOverTime = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (6 - i))
      return {
        date: date.toISOString().split('T')[0],
        usage: Math.floor(Math.random() * 20) + 5
      }
    })

    return NextResponse.json({
      analytics: filteredAnalytics,
      summary: {
        total_templates: totalTemplates,
        total_usage: totalUsage,
        average_usage: Math.round(averageUsage * 10) / 10,
        top_performers: topPerformers.length,
        needs_improvement: needsImprovement.length,
        period_days: parseInt(period)
      },
      category_breakdown: Object.values(categoryBreakdown),
      performance_over_time: performanceOverTime
    })
  } catch (error) {
    // TODO: Log template analytics fetch error to monitoring service
    return NextResponse.json(
      { error: "Failed to fetch template analytics" },
      { status: 500 }
    )
  }
}