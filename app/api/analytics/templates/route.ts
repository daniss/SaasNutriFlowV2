import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { ProgressIntegrationService } from "@/lib/progress-integration"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const timeframe = searchParams.get('timeframe') || '30days'
    const category = searchParams.get('category')

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    
    switch (timeframe) {
      case '7days':
        startDate.setDate(endDate.getDate() - 7)
        break
      case '30days':
        startDate.setDate(endDate.getDate() - 30)
        break
      case '90days':
        startDate.setDate(endDate.getDate() - 90)
        break
      case '1year':
        startDate.setFullYear(endDate.getFullYear() - 1)
        break
      default:
        startDate.setDate(endDate.getDate() - 30)
    }

    // Get template effectiveness data
    const effectiveness = await ProgressIntegrationService.getTemplateEffectiveness(user.id)

    // Get templates with basic info
    let templatesQuery = supabase
      .from('meal_plan_templates')
      .select('id, name, category, client_type, goal_type, created_at, usage_count, rating')
      .eq('dietitian_id', user.id)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())

    if (category) {
      templatesQuery = templatesQuery.eq('category', category)
    }

    const { data: templates, error: templatesError } = await templatesQuery

    if (templatesError) throw templatesError

    // Calculate overall analytics
    const totalTemplates = templates?.length || 0
    const totalUsage = templates?.reduce((sum, t) => sum + (t.usage_count || 0), 0) || 0
    const averageRating = templates?.length > 0 
      ? templates.reduce((sum, t) => sum + (t.rating || 0), 0) / templates.length 
      : 0

    // Calculate effectiveness metrics
    const effectivenessMetrics = effectiveness.reduce((acc, eff) => {
      acc.totalClients += eff.client_count
      acc.totalSuccesses += (eff.success_rate / 100) * eff.client_count
      acc.totalWeightLoss += eff.average_weight_loss * eff.client_count
      acc.totalDuration += eff.average_duration * eff.client_count
      return acc
    }, { totalClients: 0, totalSuccesses: 0, totalWeightLoss: 0, totalDuration: 0 })

    const overallSuccessRate = effectivenessMetrics.totalClients > 0 
      ? (effectivenessMetrics.totalSuccesses / effectivenessMetrics.totalClients) * 100 
      : 0

    const averageWeightLoss = effectivenessMetrics.totalClients > 0 
      ? effectivenessMetrics.totalWeightLoss / effectivenessMetrics.totalClients 
      : 0

    const averageDuration = effectivenessMetrics.totalClients > 0 
      ? effectivenessMetrics.totalDuration / effectivenessMetrics.totalClients 
      : 0

    // Get category breakdown
    const categoryBreakdown = templates?.reduce((acc, template) => {
      const category = template.category || 'general'
      if (!acc[category]) {
        acc[category] = {
          count: 0,
          usage: 0,
          rating: 0,
          templates: []
        }
      }
      acc[category].count++
      acc[category].usage += template.usage_count || 0
      acc[category].rating += template.rating || 0
      acc[category].templates.push(template.id)
      return acc
    }, {} as Record<string, any>) || {}

    // Calculate category averages
    Object.keys(categoryBreakdown).forEach(cat => {
      const catData = categoryBreakdown[cat]
      catData.averageRating = catData.count > 0 ? catData.rating / catData.count : 0
      catData.averageUsage = catData.count > 0 ? catData.usage / catData.count : 0
      
      // Get effectiveness for this category
      const categoryEffectiveness = effectiveness.filter(eff => 
        catData.templates.includes(eff.template_id)
      )
      
      if (categoryEffectiveness.length > 0) {
        catData.successRate = categoryEffectiveness.reduce((sum, eff) => 
          sum + eff.success_rate, 0) / categoryEffectiveness.length
        catData.averageWeightLoss = categoryEffectiveness.reduce((sum, eff) => 
          sum + eff.average_weight_loss, 0) / categoryEffectiveness.length
      } else {
        catData.successRate = 0
        catData.averageWeightLoss = 0
      }
    })

    // Get top performing templates
    const topTemplates = effectiveness
      .sort((a, b) => b.success_rate - a.success_rate)
      .slice(0, 10)
      .map(eff => {
        const template = templates?.find(t => t.id === eff.template_id)
        return {
          ...eff,
          template_name: template?.name || 'Unknown',
          template_category: template?.category || 'general',
          template_rating: template?.rating || 0
        }
      })

    // Get usage trends (mock data for now - would need time-series data)
    const usageTrends = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - i)
      return {
        date: date.toISOString().split('T')[0],
        usage: Math.floor(Math.random() * 20) + 5, // Mock data
        success_rate: Math.floor(Math.random() * 30) + 70 // Mock data
      }
    }).reverse()

    return NextResponse.json({
      summary: {
        total_templates: totalTemplates,
        total_usage: totalUsage,
        average_rating: Math.round(averageRating * 10) / 10,
        overall_success_rate: Math.round(overallSuccessRate * 10) / 10,
        average_weight_loss: Math.round(averageWeightLoss * 10) / 10,
        average_duration: Math.round(averageDuration),
        total_clients: effectivenessMetrics.totalClients,
        timeframe
      },
      category_breakdown: categoryBreakdown,
      top_templates: topTemplates,
      usage_trends: usageTrends,
      effectiveness_distribution: {
        high_performers: effectiveness.filter(e => e.success_rate >= 80).length,
        medium_performers: effectiveness.filter(e => e.success_rate >= 60 && e.success_rate < 80).length,
        low_performers: effectiveness.filter(e => e.success_rate < 60).length
      }
    })
  } catch (error) {
    console.error("Error fetching template analytics:", error)
    return NextResponse.json(
      { error: "Failed to fetch template analytics" },
      { status: 500 }
    )
  }
}