/**
 * Progress Integration Service
 * Connects meal plan templates to client weight tracking and progress monitoring
 */

import { supabase } from './supabase';
import { PlanSchedulingService } from './plan-scheduling';
import { getCategoryInfo, getGoalTypeInfo, suggestCategoriesForClient } from './template-categories';

export interface ProgressEntry {
  id: string;
  client_id: string;
  dietitian_id: string;
  weight: number;
  body_fat_percentage?: number;
  muscle_mass?: number;
  measurements?: {
    chest?: number;
    waist?: number;
    hips?: number;
    thigh?: number;
    arm?: number;
  };
  notes?: string;
  photo_url?: string;
  recorded_date: string;
  created_at: string;
  updated_at: string;
}

export interface ProgressGoal {
  id: string;
  client_id: string;
  dietitian_id: string;
  goal_type: 'weight_loss' | 'weight_gain' | 'muscle_gain' | 'maintenance' | 'body_composition';
  target_value: number;
  current_value: number;
  target_date: string;
  status: 'active' | 'achieved' | 'paused' | 'cancelled';
  template_id?: string;
  schedule_id?: string;
  created_at: string;
  updated_at: string;
}

export interface ProgressAnalysis {
  client_id: string;
  current_weight: number;
  goal_weight: number;
  starting_weight: number;
  weight_change: number;
  progress_percentage: number;
  weekly_average_loss: number;
  monthly_trend: 'losing' | 'gaining' | 'stable';
  recommended_templates: string[];
  next_milestone: {
    target: number;
    estimated_date: string;
  };
  effectiveness_score: number;
}

export interface TemplateEffectiveness {
  template_id: string;
  client_count: number;
  success_rate: number;
  average_weight_loss: number;
  average_duration: number;
  client_satisfaction: number;
  dropout_rate: number;
}

export class ProgressIntegrationService {
  /**
   * Record client progress entry
   */
  static async recordProgress(
    dietitianId: string,
    clientId: string,
    progressData: Omit<ProgressEntry, 'id' | 'dietitian_id' | 'client_id' | 'created_at' | 'updated_at'>
  ): Promise<ProgressEntry> {
    const { data, error } = await supabase
      .from('progress_entries')
      .insert({
        dietitian_id: dietitianId,
        client_id: clientId,
        ...progressData
      })
      .select()
      .single();

    if (error) throw error;

    // Update client's current weight
    await supabase
      .from('clients')
      .update({
        current_weight: progressData.weight,
        updated_at: new Date().toISOString()
      })
      .eq('id', clientId);

    return data;
  }

  /**
   * Get client progress history
   */
  static async getProgressHistory(clientId: string): Promise<ProgressEntry[]> {
    const { data, error } = await supabase
      .from('progress_entries')
      .select('*')
      .eq('client_id', clientId)
      .order('recorded_date', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Analyze client progress
   */
  static async analyzeProgress(clientId: string): Promise<ProgressAnalysis> {
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single();

    if (clientError) throw clientError;

    const progressHistory = await this.getProgressHistory(clientId);
    
    if (progressHistory.length === 0) {
      throw new Error('No progress data available');
    }

    const currentWeight = client.current_weight || progressHistory[0].weight;
    const goalWeight = client.goal_weight || currentWeight;
    const startingWeight = progressHistory[progressHistory.length - 1].weight;

    // Calculate progress metrics
    const weightChange = currentWeight - startingWeight;
    const totalWeightToLose = Math.abs(goalWeight - startingWeight);
    const progressPercentage = totalWeightToLose > 0 ? 
      Math.min(100, Math.abs(weightChange) / totalWeightToLose * 100) : 0;

    // Calculate weekly average
    const recentEntries = progressHistory.slice(0, 4); // Last 4 weeks
    const weeklyAverageLoss = recentEntries.length > 1 ? 
      (recentEntries[0].weight - recentEntries[recentEntries.length - 1].weight) / (recentEntries.length - 1) : 0;

    // Determine monthly trend
    const monthlyTrend = this.calculateTrend(progressHistory);

    // Get template recommendations
    const recommendedTemplates = await this.getRecommendedTemplates(client);

    // Calculate next milestone
    const nextMilestone = this.calculateNextMilestone(currentWeight, goalWeight, weeklyAverageLoss);

    // Calculate effectiveness score
    const effectivenessScore = this.calculateEffectivenessScore(progressHistory, goalWeight);

    return {
      client_id: clientId,
      current_weight: currentWeight,
      goal_weight: goalWeight,
      starting_weight: startingWeight,
      weight_change: weightChange,
      progress_percentage: progressPercentage,
      weekly_average_loss: weeklyAverageLoss,
      monthly_trend: monthlyTrend,
      recommended_templates: recommendedTemplates,
      next_milestone: nextMilestone,
      effectiveness_score: effectivenessScore
    };
  }

  /**
   * Get recommended templates based on progress
   */
  static async getRecommendedTemplates(client: any): Promise<string[]> {
    const suggestions = suggestCategoriesForClient(client);
    
    const { data: templates, error } = await supabase
      .from('meal_plan_templates')
      .select('id, name, category, client_type, goal_type, usage_count, rating')
      .eq('dietitian_id', client.dietitian_id)
      .in('category', suggestions.map(s => s.category))
      .order('usage_count', { ascending: false })
      .limit(5);

    if (error) throw error;
    return templates?.map(t => t.id) || [];
  }

  /**
   * Calculate trend from progress history
   */
  private static calculateTrend(progressHistory: ProgressEntry[]): 'losing' | 'gaining' | 'stable' {
    if (progressHistory.length < 3) return 'stable';

    const recent = progressHistory.slice(0, 3);
    const weights = recent.map(p => p.weight);
    const trend = weights[0] - weights[weights.length - 1];

    if (trend > 0.5) return 'gaining';
    if (trend < -0.5) return 'losing';
    return 'stable';
  }

  /**
   * Calculate next milestone
   */
  private static calculateNextMilestone(currentWeight: number, goalWeight: number, weeklyRate: number): {
    target: number;
    estimated_date: string;
  } {
    const weightDiff = Math.abs(goalWeight - currentWeight);
    const milestoneIncrement = weightDiff > 10 ? 5 : weightDiff > 5 ? 2 : 1;
    
    const target = currentWeight > goalWeight 
      ? Math.max(goalWeight, currentWeight - milestoneIncrement)
      : Math.min(goalWeight, currentWeight + milestoneIncrement);

    const weeksToTarget = Math.abs(weeklyRate) > 0 ? 
      Math.abs(target - currentWeight) / Math.abs(weeklyRate) : 
      4; // Default to 4 weeks if no rate

    const estimatedDate = new Date();
    estimatedDate.setDate(estimatedDate.getDate() + (weeksToTarget * 7));

    return {
      target,
      estimated_date: estimatedDate.toISOString().split('T')[0]
    };
  }

  /**
   * Calculate effectiveness score
   */
  private static calculateEffectivenessScore(progressHistory: ProgressEntry[], goalWeight: number): number {
    if (progressHistory.length < 2) return 0;

    const startWeight = progressHistory[progressHistory.length - 1].weight;
    const currentWeight = progressHistory[0].weight;
    const weightChange = Math.abs(currentWeight - startWeight);
    const targetChange = Math.abs(goalWeight - startWeight);

    // Base score on progress towards goal
    const progressScore = targetChange > 0 ? (weightChange / targetChange) * 100 : 0;

    // Factor in consistency (regular recordings)
    const consistencyScore = Math.min(100, (progressHistory.length / 12) * 100); // 12 entries = 100%

    // Factor in trend stability
    const trendScore = this.calculateTrendStability(progressHistory);

    return Math.min(100, (progressScore * 0.5) + (consistencyScore * 0.3) + (trendScore * 0.2));
  }

  /**
   * Calculate trend stability
   */
  private static calculateTrendStability(progressHistory: ProgressEntry[]): number {
    if (progressHistory.length < 3) return 0;

    const weights = progressHistory.map(p => p.weight);
    const changes = [];
    
    for (let i = 1; i < weights.length; i++) {
      changes.push(weights[i-1] - weights[i]);
    }

    // Calculate variance in changes
    const mean = changes.reduce((a, b) => a + b, 0) / changes.length;
    const variance = changes.reduce((sum, change) => sum + Math.pow(change - mean, 2), 0) / changes.length;
    
    // Lower variance = higher stability
    return Math.max(0, 100 - (variance * 10));
  }

  /**
   * Get template effectiveness for a dietitian
   */
  static async getTemplateEffectiveness(dietitianId: string): Promise<TemplateEffectiveness[]> {
    const { data: templates, error } = await supabase
      .from('meal_plan_templates')
      .select(`
        id,
        name,
        category,
        usage_count,
        rating,
        meal_plan_schedules (
          id,
          client_id,
          status,
          total_deliveries,
          clients (
            id,
            current_weight,
            goal_weight,
            created_at
          )
        )
      `)
      .eq('dietitian_id', dietitianId);

    if (error) throw error;

    const effectiveness: TemplateEffectiveness[] = [];

    for (const template of templates || []) {
      const schedules = template.meal_plan_schedules || [];
      const clientCount = schedules.length;
      
      if (clientCount === 0) continue;

      let successCount = 0;
      let totalWeightLoss = 0;
      let totalDuration = 0;
      let dropoutCount = 0;

      for (const schedule of schedules) {
        const client = Array.isArray(schedule.clients) ? schedule.clients[0] : schedule.clients;
        if (!client || !client.id) continue;

        // Get progress for this client
        const progressHistory = await this.getProgressHistory(client.id);
        
        if (progressHistory.length === 0) {
          dropoutCount++;
          continue;
        }

        const startWeight = progressHistory[progressHistory.length - 1].weight;
        const currentWeight = client.current_weight || progressHistory[0].weight;
        const goalWeight = client.goal_weight || currentWeight;

        // Calculate success (achieved 80% of goal)
        const weightChange = Math.abs(currentWeight - startWeight);
        const targetChange = Math.abs(goalWeight - startWeight);
        const progressPercentage = targetChange > 0 ? (weightChange / targetChange) * 100 : 0;

        if (progressPercentage >= 80) {
          successCount++;
        }

        totalWeightLoss += weightChange;
        totalDuration += progressHistory.length; // Number of recorded entries as duration proxy
      }

      effectiveness.push({
        template_id: template.id,
        client_count: clientCount,
        success_rate: (successCount / clientCount) * 100,
        average_weight_loss: totalWeightLoss / clientCount,
        average_duration: totalDuration / clientCount,
        client_satisfaction: template.rating || 0,
        dropout_rate: (dropoutCount / clientCount) * 100
      });
    }

    return effectiveness.sort((a, b) => b.success_rate - a.success_rate);
  }

  /**
   * Create progress goal for client
   */
  static async createProgressGoal(
    dietitianId: string,
    clientId: string,
    goalData: Omit<ProgressGoal, 'id' | 'dietitian_id' | 'client_id' | 'created_at' | 'updated_at'>
  ): Promise<ProgressGoal> {
    const { data, error } = await supabase
      .from('progress_goals')
      .insert({
        dietitian_id: dietitianId,
        client_id: clientId,
        ...goalData
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update progress goal
   */
  static async updateProgressGoal(
    goalId: string,
    updates: Partial<ProgressGoal>
  ): Promise<ProgressGoal> {
    const { data, error } = await supabase
      .from('progress_goals')
      .update(updates)
      .eq('id', goalId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get client progress goals
   */
  static async getProgressGoals(clientId: string): Promise<ProgressGoal[]> {
    const { data, error } = await supabase
      .from('progress_goals')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Link template to progress goal
   */
  static async linkTemplateToGoal(goalId: string, templateId: string): Promise<void> {
    const { error } = await supabase
      .from('progress_goals')
      .update({ template_id: templateId })
      .eq('id', goalId);

    if (error) throw error;
  }

  /**
   * Generate progress report
   */
  static async generateProgressReport(clientId: string): Promise<{
    analysis: ProgressAnalysis;
    effectiveness: TemplateEffectiveness[];
    goals: ProgressGoal[];
    recommendations: string[];
  }> {
    const [analysis, goals] = await Promise.all([
      this.analyzeProgress(clientId),
      this.getProgressGoals(clientId)
    ]);

    const { data: client } = await supabase
      .from('clients')
      .select('dietitian_id')
      .eq('id', clientId)
      .single();

    const effectiveness = client ? await this.getTemplateEffectiveness(client.dietitian_id) : [];

    const recommendations = this.generateRecommendations(analysis, effectiveness);

    return {
      analysis,
      effectiveness,
      goals,
      recommendations
    };
  }

  /**
   * Generate recommendations based on analysis
   */
  private static generateRecommendations(
    analysis: ProgressAnalysis,
    effectiveness: TemplateEffectiveness[]
  ): string[] {
    const recommendations: string[] = [];

    // Weight loss recommendations
    if (analysis.monthly_trend === 'stable' && analysis.current_weight > analysis.goal_weight) {
      recommendations.push("Considérez un changement de plan alimentaire pour relancer la perte de poids");
    }

    if (analysis.weekly_average_loss > 1) {
      recommendations.push("Rythme de perte de poids trop rapide - ajustez les calories");
    }

    if (analysis.effectiveness_score < 50) {
      recommendations.push("Envisagez une consultation pour réviser l'approche nutritionnelle");
    }

    // Template effectiveness recommendations
    const bestTemplate = effectiveness[0];
    if (bestTemplate && bestTemplate.success_rate > 80) {
      recommendations.push(`Le template avec le meilleur taux de réussite (${bestTemplate.success_rate.toFixed(1)}%) pourrait être adapté`);
    }

    return recommendations;
  }
}

export default ProgressIntegrationService;