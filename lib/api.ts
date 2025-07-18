/**
 * Centralized API service for data fetching
 */

import { withErrorHandling } from "@/lib/errors";
import type { Appointment, Client, Invoice, MealPlan, Reminder } from "@/lib/supabase";
import { supabase } from "@/lib/supabase";


export interface AppointmentWithClient extends Appointment {
  clients: { name: string; email: string } | null
}

export const api = {
  // Client operations

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

}
