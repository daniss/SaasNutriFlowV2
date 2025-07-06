/**
 * Centralized API service for data fetching
 */

import { supabase } from "@/lib/supabase"
import type { Client, MealPlan, Invoice, Reminder } from "@/lib/supabase"
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
  }
}
