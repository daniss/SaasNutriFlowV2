import { createClient } from "./supabase/client"

// For backward compatibility - use the new client structure
export const supabase = createClient()

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          first_name: string | null
          last_name: string | null
          phone: string | null
          title: string | null
          bio: string | null
          address: string | null
          city: string | null
          state: string | null
          zip_code: string | null
          license_number: string | null
          years_experience: number | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          title?: string | null
          bio?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          zip_code?: string | null
          license_number?: string | null
          years_experience?: number | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          title?: string | null
          bio?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          zip_code?: string | null
          license_number?: string | null
          years_experience?: number | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      clients: {
        Row: {
          id: string
          dietitian_id: string
          name: string
          email: string
          phone: string | null
          address: string | null
          age: number | null
          height: string | null
          current_weight: number | null
          goal_weight: number | null
          goal: string
          plan_type: string
          status: string
          tags: string[]
          notes: string | null
          emergency_contact: string | null
          join_date: string
          last_session: string | null
          next_appointment: string | null
          progress_percentage: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          dietitian_id: string
          name: string
          email: string
          phone?: string | null
          address?: string | null
          age?: number | null
          height?: string | null
          current_weight?: number | null
          goal_weight?: number | null
          goal: string
          plan_type?: string
          status?: string
          tags?: string[]
          notes?: string | null
          emergency_contact?: string | null
          join_date?: string
          last_session?: string | null
          next_appointment?: string | null
          progress_percentage?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          dietitian_id?: string
          name?: string
          email?: string
          phone?: string | null
          address?: string | null
          age?: number | null
          height?: string | null
          current_weight?: number | null
          goal_weight?: number | null
          goal?: string
          plan_type?: string
          status?: string
          tags?: string[]
          notes?: string | null
          emergency_contact?: string | null
          join_date?: string
          last_session?: string | null
          next_appointment?: string | null
          progress_percentage?: number
          created_at?: string
          updated_at?: string
        }
      }
      meal_plans: {
        Row: {
          id: string
          client_id: string
          dietitian_id: string
          name: string
          description: string | null
          plan_content: any
          calories_range: string | null
          duration_days: number
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          dietitian_id: string
          name: string
          description?: string | null
          plan_content: any
          calories_range?: string | null
          duration_days?: number
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          dietitian_id?: string
          name?: string
          description?: string | null
          plan_content?: any
          calories_range?: string | null
          duration_days?: number
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      invoices: {
        Row: {
          id: string
          client_id: string
          dietitian_id: string
          invoice_number: string
          service_description: string
          amount: number
          status: string
          issue_date: string
          due_date: string
          payment_date: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          dietitian_id: string
          invoice_number: string
          service_description: string
          amount: number
          status?: string
          issue_date?: string
          due_date: string
          payment_date?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          dietitian_id?: string
          invoice_number?: string
          service_description?: string
          amount?: number
          status?: string
          issue_date?: string
          due_date?: string
          payment_date?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      reminders: {
        Row: {
          id: string
          client_id: string
          dietitian_id: string
          type: string
          title: string
          message: string
          scheduled_date: string
          is_recurring: boolean
          frequency: string | null
          channels: string[]
          status: string
          sent_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          dietitian_id: string
          type: string
          title: string
          message: string
          scheduled_date: string
          is_recurring?: boolean
          frequency?: string | null
          channels?: string[]
          status?: string
          sent_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          dietitian_id?: string
          type?: string
          title?: string
          message?: string
          scheduled_date?: string
          is_recurring?: boolean
          frequency?: string | null
          channels?: string[]
          status?: string
          sent_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

export type Client = Database["public"]["Tables"]["clients"]["Row"]
export type Profile = Database["public"]["Tables"]["profiles"]["Row"]
export type MealPlan = Database["public"]["Tables"]["meal_plans"]["Row"]
export type Invoice = Database["public"]["Tables"]["invoices"]["Row"]
export type Reminder = Database["public"]["Tables"]["reminders"]["Row"]
