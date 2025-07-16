/**
 * Plan Scheduling Service
 * Handles meal plan delivery scheduling and calendar integration
 */

import { supabase } from './supabase';

export interface MealPlanSchedule {
  id: string;
  dietitian_id: string;
  client_id: string;
  meal_plan_id: string;
  template_id?: string;
  schedule_name: string;
  description?: string;
  start_date: string;
  end_date?: string;
  delivery_frequency: 'daily' | 'weekly' | 'bi-weekly' | 'monthly';
  delivery_days: number[];
  delivery_time: string;
  auto_generate: boolean;
  notification_enabled: boolean;
  notification_days_before: number;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  last_delivered_date?: string;
  next_delivery_date?: string;
  total_deliveries: number;
  created_at: string;
  updated_at: string;
}

export interface MealPlanDelivery {
  id: string;
  schedule_id: string;
  meal_plan_id: string;
  planned_date: string;
  delivered_date?: string;
  status: 'scheduled' | 'delivered' | 'skipped' | 'failed';
  notification_sent: boolean;
  notification_sent_at?: string;
  client_viewed: boolean;
  client_viewed_at?: string;
  client_feedback?: string;
  client_rating?: number;
  created_at: string;
  updated_at: string;
}

export interface ScheduledAppointment {
  id: string;
  appointment_id: string;
  schedule_id?: string;
  delivery_id?: string;
  auto_created: boolean;
  appointment_type: 'plan_delivery' | 'follow_up' | 'review';
  created_at: string;
}

export interface CreateScheduleData {
  client_id: string;
  meal_plan_id: string;
  template_id?: string;
  schedule_name: string;
  description?: string;
  start_date: string;
  end_date?: string;
  delivery_frequency: 'daily' | 'weekly' | 'bi-weekly' | 'monthly';
  delivery_days: number[];
  delivery_time: string;
  auto_generate?: boolean;
  notification_enabled?: boolean;
  notification_days_before?: number;
}

export class PlanSchedulingService {
  /**
   * Create a new meal plan schedule
   */
  static async createSchedule(
    dietitianId: string,
    scheduleData: CreateScheduleData
  ): Promise<MealPlanSchedule> {
    const { data, error } = await supabase
      .from('meal_plan_schedules')
      .insert({
        dietitian_id: dietitianId,
        ...scheduleData,
        auto_generate: scheduleData.auto_generate || false,
        notification_enabled: scheduleData.notification_enabled ?? true,
        notification_days_before: scheduleData.notification_days_before || 1,
        status: 'active',
        total_deliveries: 0
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get all schedules for a dietitian
   */
  static async getSchedules(dietitianId: string): Promise<MealPlanSchedule[]> {
    const { data, error } = await supabase
      .from('meal_plan_schedules')
      .select(`
        *,
        clients!inner(id, name, email),
        meal_plans!inner(id, name, description)
      `)
      .eq('dietitian_id', dietitianId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get schedule by ID
   */
  static async getSchedule(scheduleId: string): Promise<MealPlanSchedule | null> {
    const { data, error } = await supabase
      .from('meal_plan_schedules')
      .select(`
        *,
        clients!inner(id, name, email),
        meal_plans!inner(id, name, description)
      `)
      .eq('id', scheduleId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  }

  /**
   * Update schedule
   */
  static async updateSchedule(
    scheduleId: string,
    updates: Partial<CreateScheduleData>
  ): Promise<MealPlanSchedule> {
    const { data, error } = await supabase
      .from('meal_plan_schedules')
      .update(updates)
      .eq('id', scheduleId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update schedule status
   */
  static async updateScheduleStatus(
    scheduleId: string,
    status: 'active' | 'paused' | 'completed' | 'cancelled'
  ): Promise<MealPlanSchedule> {
    const { data, error } = await supabase
      .from('meal_plan_schedules')
      .update({ status })
      .eq('id', scheduleId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete schedule
   */
  static async deleteSchedule(scheduleId: string): Promise<void> {
    const { error } = await supabase
      .from('meal_plan_schedules')
      .delete()
      .eq('id', scheduleId);

    if (error) throw error;
  }

  /**
   * Get deliveries for a schedule
   */
  static async getDeliveries(scheduleId: string): Promise<MealPlanDelivery[]> {
    const { data, error } = await supabase
      .from('meal_plan_deliveries')
      .select('*')
      .eq('schedule_id', scheduleId)
      .order('planned_date', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get upcoming deliveries for a dietitian
   */
  static async getUpcomingDeliveries(
    dietitianId: string,
    limit: number = 10
  ): Promise<MealPlanDelivery[]> {
    const { data, error } = await supabase
      .from('meal_plan_deliveries')
      .select(`
        *,
        meal_plan_schedules!inner(
          dietitian_id,
          schedule_name,
          clients!inner(id, name, email)
        )
      `)
      .eq('meal_plan_schedules.dietitian_id', dietitianId)
      .eq('status', 'scheduled')
      .gte('planned_date', new Date().toISOString().split('T')[0])
      .order('planned_date', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  /**
   * Mark delivery as delivered
   */
  static async markDeliveryCompleted(deliveryId: string): Promise<MealPlanDelivery> {
    const { data, error } = await supabase
      .from('meal_plan_deliveries')
      .update({
        status: 'delivered',
        delivered_date: new Date().toISOString().split('T')[0]
      })
      .eq('id', deliveryId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Skip delivery
   */
  static async skipDelivery(deliveryId: string): Promise<MealPlanDelivery> {
    const { data, error } = await supabase
      .from('meal_plan_deliveries')
      .update({ status: 'skipped' })
      .eq('id', deliveryId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get delivery statistics for a dietitian
   */
  static async getDeliveryStats(dietitianId: string): Promise<{
    total_schedules: number;
    active_schedules: number;
    upcoming_deliveries: number;
    completed_deliveries: number;
    this_week_deliveries: number;
  }> {
    const { data: schedules, error: schedulesError } = await supabase
      .from('meal_plan_schedules')
      .select('id, status')
      .eq('dietitian_id', dietitianId);

    if (schedulesError) throw schedulesError;

    const { data: deliveries, error: deliveriesError } = await supabase
      .from('meal_plan_deliveries')
      .select(`
        id,
        status,
        planned_date,
        meal_plan_schedules!inner(dietitian_id)
      `)
      .eq('meal_plan_schedules.dietitian_id', dietitianId);

    if (deliveriesError) throw deliveriesError;

    const now = new Date();
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    return {
      total_schedules: schedules?.length || 0,
      active_schedules: schedules?.filter(s => s.status === 'active').length || 0,
      upcoming_deliveries: deliveries?.filter(d => 
        d.status === 'scheduled' && 
        new Date(d.planned_date) >= new Date()
      ).length || 0,
      completed_deliveries: deliveries?.filter(d => d.status === 'delivered').length || 0,
      this_week_deliveries: deliveries?.filter(d => {
        const deliveryDate = new Date(d.planned_date);
        return deliveryDate >= weekStart && deliveryDate <= weekEnd;
      }).length || 0
    };
  }

  /**
   * Create appointment for delivery
   */
  static async createDeliveryAppointment(
    deliveryId: string,
    appointmentData: {
      title: string;
      description?: string;
      appointment_date: string;
      appointment_time: string;
      duration_minutes: number;
    }
  ): Promise<ScheduledAppointment> {
    // Get delivery and schedule info
    const { data: delivery, error: deliveryError } = await supabase
      .from('meal_plan_deliveries')
      .select(`
        *,
        meal_plan_schedules!inner(
          dietitian_id,
          client_id
        )
      `)
      .eq('id', deliveryId)
      .single();

    if (deliveryError) throw deliveryError;

    // Create appointment
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .insert({
        dietitian_id: delivery.meal_plan_schedules.dietitian_id,
        client_id: delivery.meal_plan_schedules.client_id,
        title: appointmentData.title,
        description: appointmentData.description || null,
        appointment_date: appointmentData.appointment_date,
        appointment_time: appointmentData.appointment_time,
        duration_minutes: appointmentData.duration_minutes,
        type: 'nutrition_planning',
        status: 'scheduled'
      })
      .select()
      .single();

    if (appointmentError) throw appointmentError;

    // Link appointment to delivery
    const { data: scheduledAppointment, error: linkError } = await supabase
      .from('scheduled_appointments')
      .insert({
        appointment_id: appointment.id,
        delivery_id: deliveryId,
        auto_created: true,
        appointment_type: 'plan_delivery'
      })
      .select()
      .single();

    if (linkError) throw linkError;

    return scheduledAppointment;
  }

  /**
   * Generate delivery frequency options
   */
  static getFrequencyOptions(): Array<{ value: string; label: string; description: string }> {
    return [
      {
        value: 'daily',
        label: 'Quotidien',
        description: 'Livraison tous les jours'
      },
      {
        value: 'weekly',
        label: 'Hebdomadaire',
        description: 'Livraison chaque semaine'
      },
      {
        value: 'bi-weekly',
        label: 'Bi-hebdomadaire',
        description: 'Livraison toutes les deux semaines'
      },
      {
        value: 'monthly',
        label: 'Mensuel',
        description: 'Livraison chaque mois'
      }
    ];
  }

  /**
   * Get day options for delivery
   */
  static getDayOptions(): Array<{ value: number; label: string; short: string }> {
    return [
      { value: 1, label: 'Lundi', short: 'Lun' },
      { value: 2, label: 'Mardi', short: 'Mar' },
      { value: 3, label: 'Mercredi', short: 'Mer' },
      { value: 4, label: 'Jeudi', short: 'Jeu' },
      { value: 5, label: 'Vendredi', short: 'Ven' },
      { value: 6, label: 'Samedi', short: 'Sam' },
      { value: 7, label: 'Dimanche', short: 'Dim' }
    ];
  }

  /**
   * Format delivery frequency for display
   */
  static formatFrequency(frequency: string): string {
    const options = this.getFrequencyOptions();
    return options.find(opt => opt.value === frequency)?.label || frequency;
  }

  /**
   * Format delivery days for display
   */
  static formatDeliveryDays(days: number[]): string {
    const dayOptions = this.getDayOptions();
    return days
      .map(day => dayOptions.find(opt => opt.value === day)?.short || day.toString())
      .join(', ');
  }

  /**
   * Calculate next delivery date
   */
  static calculateNextDeliveryDate(
    frequency: string,
    deliveryDays: number[],
    fromDate: Date = new Date()
  ): Date | null {
    const targetDay = deliveryDays[0];
    let nextDate = new Date(fromDate);

    switch (frequency) {
      case 'daily':
        nextDate.setDate(nextDate.getDate() + 1);
        break;
      case 'weekly':
        const daysUntilTarget = (targetDay - nextDate.getDay() + 7) % 7;
        if (daysUntilTarget === 0) {
          nextDate.setDate(nextDate.getDate() + 7);
        } else {
          nextDate.setDate(nextDate.getDate() + daysUntilTarget);
        }
        break;
      case 'bi-weekly':
        const daysUntilTargetBi = (targetDay - nextDate.getDay() + 7) % 7;
        if (daysUntilTargetBi === 0) {
          nextDate.setDate(nextDate.getDate() + 14);
        } else {
          nextDate.setDate(nextDate.getDate() + daysUntilTargetBi + 7);
        }
        break;
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      default:
        return null;
    }

    return nextDate;
  }
}

export default PlanSchedulingService;