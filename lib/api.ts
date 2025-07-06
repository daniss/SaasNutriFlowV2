/**
 * Centralized API service for data fetching
 */

import { supabase } from "@/lib/supabase"
import type { Client, MealPlan, Invoice, Reminder, Appointment } from "@/lib/supabase"
import { withErrorHandling } from "@/lib/errors"

export interface ReminderWithClient extends Reminder {
  clients: { name: string } | null
}

export interface MealPlanWithClient extends MealPlan {
  clients: { name: string } | null
}

export interface InvoiceWithClient extends Invoice {
  clients: { name: string } | null
}

export interface AppointmentWithClient extends Appointment {
  clients: { name: string; email: string } | null
}

export const api = {
  // Client operations
  async getClients(dietitianId: string): Promise<Client[]> {
    return withErrorHandling(async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("dietitian_id", dietitianId)
        .order("name", { ascending: true })

      if (error) throw error
      return data || []
    }, 'getClients')
  },

  async getActiveClients(dietitianId: string): Promise<Pick<Client, 'id' | 'name'>[]> {
    return withErrorHandling(async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, name")
        .eq("dietitian_id", dietitianId)
        .eq("status", "active")
        .order("name", { ascending: true })

      if (error) throw error
      return data || []
    }, 'getActiveClients')
  },

  // Meal plan operations
  async getMealPlans(dietitianId: string): Promise<MealPlanWithClient[]> {
    return withErrorHandling(async () => {
      const { data, error } = await supabase
        .from("meal_plans")
        .select(`
          *,
          clients (name)
        `)
        .eq("dietitian_id", dietitianId)
        .order("created_at", { ascending: false })

      if (error) throw error
      return data || []
    }, 'getMealPlans')
  },

  // Invoice operations
  async getInvoices(dietitianId: string): Promise<InvoiceWithClient[]> {
    return withErrorHandling(async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select(`
          *,
          clients (name)
        `)
        .eq("dietitian_id", dietitianId)
        .order("issue_date", { ascending: false })

      if (error) throw error
      return data || []
    }, 'getInvoices')
  },

  // Reminder operations
  async getReminders(dietitianId: string): Promise<ReminderWithClient[]> {
    return withErrorHandling(async () => {
      const { data, error } = await supabase
        .from("reminders")
        .select(`
          *,
          clients (name)
        `)
        .eq("dietitian_id", dietitianId)
        .order("scheduled_date", { ascending: true })

      if (error) throw error
      return data || []
    }, 'getReminders')
  },

  async createReminder(reminderData: any): Promise<ReminderWithClient> {
    return withErrorHandling(async () => {
      const { data, error } = await supabase
        .from("reminders")
        .insert(reminderData)
        .select(`
          *,
          clients (name)
        `)
        .single()

      if (error) throw error
      return data
    }, 'createReminder')
  },

  async updateReminder(reminderId: string, reminderData: any): Promise<ReminderWithClient> {
    return withErrorHandling(async () => {
      const { data, error } = await supabase
        .from("reminders")
        .update(reminderData)
        .eq("id", reminderId)
        .select(`
          *,
          clients (name)
        `)
        .single()

      if (error) throw error
      return data
    }, 'updateReminder')
  },

  async deleteReminder(reminderId: string): Promise<void> {
    return withErrorHandling(async () => {
      const { error } = await supabase
        .from("reminders")
        .delete()
        .eq("id", reminderId)

      if (error) throw error
    }, 'deleteReminder')
  },

  async markReminderAsSent(reminderId: string): Promise<ReminderWithClient> {
    return withErrorHandling(async () => {
      const { data, error } = await supabase
        .from("reminders")
        .update({ 
          status: "sent",
          sent_at: new Date().toISOString()
        })
        .eq("id", reminderId)
        .select(`
          *,
          clients (name)
        `)
        .single()

      if (error) throw error
      return data
    }, 'markReminderAsSent')
  },

  // Appointment operations
  async getAppointments(dietitianId: string): Promise<AppointmentWithClient[]> {
    return withErrorHandling(async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          *,
          clients (name, email)
        `)
        .eq("dietitian_id", dietitianId)
        .order("appointment_date", { ascending: true })
        .order("appointment_time", { ascending: true })

      if (error) throw error
      return data || []
    }, 'getAppointments')
  },

  async createAppointment(appointmentData: Omit<Appointment, 'id' | 'created_at' | 'updated_at'>): Promise<AppointmentWithClient> {
    return withErrorHandling(async () => {
      const { data, error } = await supabase
        .from("appointments")
        .insert(appointmentData)
        .select(`
          *,
          clients (name, email)
        `)
        .single()

      if (error) throw error
      return data
    }, 'createAppointment')
  },

  async updateAppointment(appointmentId: string, appointmentData: Partial<Appointment>): Promise<AppointmentWithClient> {
    return withErrorHandling(async () => {
      const { data, error } = await supabase
        .from("appointments")
        .update(appointmentData)
        .eq("id", appointmentId)
        .select(`
          *,
          clients (name, email)
        `)
        .single()

      if (error) throw error
      return data
    }, 'updateAppointment')
  },

  async deleteAppointment(appointmentId: string): Promise<void> {
    return withErrorHandling(async () => {
      const { error } = await supabase
        .from("appointments")
        .delete()
        .eq("id", appointmentId)

      if (error) throw error
    }, 'deleteAppointment')
  },

  async getUpcomingAppointments(dietitianId: string, limit?: number): Promise<AppointmentWithClient[]> {
    return withErrorHandling(async () => {
      const today = new Date().toISOString().split('T')[0]
      
      let query = supabase
        .from("appointments")
        .select(`
          *,
          clients (name, email)
        `)
        .eq("dietitian_id", dietitianId)
        .gte("appointment_date", today)
        .order("appointment_date", { ascending: true })
        .order("appointment_time", { ascending: true })

      if (limit) {
        query = query.limit(limit)
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    }, 'getUpcomingAppointments')
  }
}
