export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      admin_users: {
        Row: {
          created_at: string | null
          granted_at: string | null
          granted_by: string | null
          id: string
          is_active: boolean | null
          permissions: Json | null
          role: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          is_active?: boolean | null
          permissions?: Json | null
          role: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          is_active?: boolean | null
          permissions?: Json | null
          role?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      ai_generations: {
        Row: {
          client_dietary_tags: string[] | null
          client_id: string | null
          created_at: string | null
          dietitian_id: string
          duration_days: number | null
          generation_successful: boolean
          generation_type: string
          id: string
          prompt_used: string | null
          restrictions: string[] | null
          target_calories: number | null
          updated_at: string | null
        }
        Insert: {
          client_dietary_tags?: string[] | null
          client_id?: string | null
          created_at?: string | null
          dietitian_id: string
          duration_days?: number | null
          generation_successful?: boolean
          generation_type?: string
          id?: string
          prompt_used?: string | null
          restrictions?: string[] | null
          target_calories?: number | null
          updated_at?: string | null
        }
        Update: {
          client_dietary_tags?: string[] | null
          client_id?: string | null
          created_at?: string | null
          dietitian_id?: string
          duration_days?: number | null
          generation_successful?: boolean
          generation_type?: string
          id?: string
          prompt_used?: string | null
          restrictions?: string[] | null
          target_calories?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_generations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_generations_dietitian_id_fkey"
            columns: ["dietitian_id"]
            isOneToOne: false
            referencedRelation: "dietitians"
            referencedColumns: ["auth_user_id"]
          },
        ]
      }
      appointments: {
        Row: {
          appointment_date: string
          appointment_time: string
          client_id: string
          created_at: string | null
          description: string | null
          dietitian_id: string
          duration_minutes: number | null
          id: string
          is_virtual: boolean | null
          location: string | null
          meeting_link: string | null
          notes: string | null
          status: string | null
          title: string
          type: string | null
          updated_at: string | null
        }
        Insert: {
          appointment_date: string
          appointment_time: string
          client_id: string
          created_at?: string | null
          description?: string | null
          dietitian_id: string
          duration_minutes?: number | null
          id?: string
          is_virtual?: boolean | null
          location?: string | null
          meeting_link?: string | null
          notes?: string | null
          status?: string | null
          title: string
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          appointment_date?: string
          appointment_time?: string
          client_id?: string
          created_at?: string | null
          description?: string | null
          dietitian_id?: string
          duration_minutes?: number | null
          id?: string
          is_virtual?: boolean | null
          location?: string | null
          meeting_link?: string | null
          notes?: string | null
          status?: string | null
          title?: string
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_dietitian_id_fkey"
            columns: ["dietitian_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: unknown | null
          resource_id: string | null
          resource_type: string
          session_id: string | null
          user_agent: string | null
          user_email: string | null
          user_id: string | null
          user_type: string
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          resource_id?: string | null
          resource_type: string
          session_id?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
          user_type?: string
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          resource_id?: string | null
          resource_type?: string
          session_id?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
          user_type?: string
        }
        Relationships: []
      }
      client_accounts: {
        Row: {
          client_id: string
          created_at: string | null
          email: string
          id: string
          is_active: boolean | null
          last_login: string | null
          password_hash: string
          password_reset_expires: string | null
          password_reset_token: string | null
          updated_at: string | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          email: string
          id?: string
          is_active?: boolean | null
          last_login?: string | null
          password_hash: string
          password_reset_expires?: string | null
          password_reset_token?: string | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          last_login?: string | null
          password_hash?: string
          password_reset_expires?: string | null
          password_reset_token?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_accounts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          age: number | null
          created_at: string | null
          current_weight: number | null
          dietitian_id: string
          email: string
          emergency_contact: string | null
          goal: string
          goal_weight: number | null
          height: string | null
          id: string
          join_date: string | null
          last_session: string | null
          name: string
          next_appointment: string | null
          notes: string | null
          phone: string | null
          plan_type: string | null
          progress_percentage: number | null
          status: string | null
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          age?: number | null
          created_at?: string | null
          current_weight?: number | null
          dietitian_id: string
          email: string
          emergency_contact?: string | null
          goal: string
          goal_weight?: number | null
          height?: string | null
          id?: string
          join_date?: string | null
          last_session?: string | null
          name: string
          next_appointment?: string | null
          notes?: string | null
          phone?: string | null
          plan_type?: string | null
          progress_percentage?: number | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          age?: number | null
          created_at?: string | null
          current_weight?: number | null
          dietitian_id?: string
          email?: string
          emergency_contact?: string | null
          goal?: string
          goal_weight?: number | null
          height?: string | null
          id?: string
          join_date?: string | null
          last_session?: string | null
          name?: string
          next_appointment?: string | null
          notes?: string | null
          phone?: string | null
          plan_type?: string | null
          progress_percentage?: number | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_dietitian_id_fkey"
            columns: ["dietitian_id"]
            isOneToOne: false
            referencedRelation: "dietitians"
            referencedColumns: ["id"]
          },
        ]
      }
      consent_records: {
        Row: {
          client_id: string | null
          consent_type: string
          created_at: string | null
          dietitian_id: string | null
          granted: boolean
          granted_at: string | null
          id: string
          legal_basis: string | null
          purpose: string | null
          updated_at: string | null
          version: string
          withdrawn_at: string | null
        }
        Insert: {
          client_id?: string | null
          consent_type: string
          created_at?: string | null
          dietitian_id?: string | null
          granted?: boolean
          granted_at?: string | null
          id?: string
          legal_basis?: string | null
          purpose?: string | null
          updated_at?: string | null
          version?: string
          withdrawn_at?: string | null
        }
        Update: {
          client_id?: string | null
          consent_type?: string
          created_at?: string | null
          dietitian_id?: string | null
          granted?: boolean
          granted_at?: string | null
          id?: string
          legal_basis?: string | null
          purpose?: string | null
          updated_at?: string | null
          version?: string
          withdrawn_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consent_records_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consent_records_dietitian_id_fkey"
            columns: ["dietitian_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          client_id: string
          created_at: string | null
          dietitian_id: string
          id: string
          is_starred: boolean | null
          last_message_at: string | null
          priority: string | null
          status: string | null
          subject: string | null
          unread_count: number | null
          updated_at: string | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          dietitian_id: string
          id?: string
          is_starred?: boolean | null
          last_message_at?: string | null
          priority?: string | null
          status?: string | null
          subject?: string | null
          unread_count?: number | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          dietitian_id?: string
          id?: string
          is_starred?: boolean | null
          last_message_at?: string | null
          priority?: string | null
          status?: string | null
          subject?: string | null
          unread_count?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_dietitian_id_fkey"
            columns: ["dietitian_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      data_anonymization_log: {
        Row: {
          affected_tables: string[] | null
          anonymization_type: string
          anonymized_at: string | null
          client_id: string | null
          dietitian_id: string | null
          id: string
          original_client_id: string | null
          performed_by: string | null
          retention_reason: string | null
        }
        Insert: {
          affected_tables?: string[] | null
          anonymization_type: string
          anonymized_at?: string | null
          client_id?: string | null
          dietitian_id?: string | null
          id?: string
          original_client_id?: string | null
          performed_by?: string | null
          retention_reason?: string | null
        }
        Update: {
          affected_tables?: string[] | null
          anonymization_type?: string
          anonymized_at?: string | null
          client_id?: string | null
          dietitian_id?: string | null
          id?: string
          original_client_id?: string | null
          performed_by?: string | null
          retention_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "data_anonymization_log_dietitian_id_fkey"
            columns: ["dietitian_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "data_anonymization_log_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      data_export_requests: {
        Row: {
          client_id: string | null
          completed_at: string | null
          dietitian_id: string | null
          download_url: string | null
          expires_at: string | null
          file_size_bytes: number | null
          id: string
          notes: string | null
          request_type: string
          requested_at: string | null
          requested_by: string
          status: string | null
        }
        Insert: {
          client_id?: string | null
          completed_at?: string | null
          dietitian_id?: string | null
          download_url?: string | null
          expires_at?: string | null
          file_size_bytes?: number | null
          id?: string
          notes?: string | null
          request_type: string
          requested_at?: string | null
          requested_by: string
          status?: string | null
        }
        Update: {
          client_id?: string | null
          completed_at?: string | null
          dietitian_id?: string | null
          download_url?: string | null
          expires_at?: string | null
          file_size_bytes?: number | null
          id?: string
          notes?: string | null
          request_type?: string
          requested_at?: string | null
          requested_by?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "data_export_requests_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "data_export_requests_dietitian_id_fkey"
            columns: ["dietitian_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      data_retention_policies: {
        Row: {
          auto_delete: boolean | null
          created_at: string | null
          data_category: string
          description: string | null
          dietitian_id: string | null
          id: string
          legal_requirement: string | null
          retention_period_years: number
          updated_at: string | null
        }
        Insert: {
          auto_delete?: boolean | null
          created_at?: string | null
          data_category: string
          description?: string | null
          dietitian_id?: string | null
          id?: string
          legal_requirement?: string | null
          retention_period_years?: number
          updated_at?: string | null
        }
        Update: {
          auto_delete?: boolean | null
          created_at?: string | null
          data_category?: string
          description?: string | null
          dietitian_id?: string | null
          id?: string
          legal_requirement?: string | null
          retention_period_years?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "data_retention_policies_dietitian_id_fkey"
            columns: ["dietitian_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dietitians: {
        Row: {
          auth_user_id: string
          bio: string | null
          created_at: string | null
          email: string | null
          id: string
          license_number: string | null
          name: string | null
          phone: string | null
          practice_address: string | null
          profile_image_url: string | null
          specialties: string[] | null
          stripe_customer_id: string | null
          subscription_current_period_end: string | null
          subscription_ends_at: string | null
          subscription_id: string | null
          subscription_plan: string | null
          subscription_started_at: string | null
          subscription_status: string | null
          trial_ends_at: string | null
          updated_at: string | null
        }
        Insert: {
          auth_user_id: string
          bio?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          license_number?: string | null
          name?: string | null
          phone?: string | null
          practice_address?: string | null
          profile_image_url?: string | null
          specialties?: string[] | null
          stripe_customer_id?: string | null
          subscription_current_period_end?: string | null
          subscription_ends_at?: string | null
          subscription_id?: string | null
          subscription_plan?: string | null
          subscription_started_at?: string | null
          subscription_status?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
        }
        Update: {
          auth_user_id?: string
          bio?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          license_number?: string | null
          name?: string | null
          phone?: string | null
          practice_address?: string | null
          profile_image_url?: string | null
          specialties?: string[] | null
          stripe_customer_id?: string | null
          subscription_current_period_end?: string | null
          subscription_ends_at?: string | null
          subscription_id?: string | null
          subscription_plan?: string | null
          subscription_started_at?: string | null
          subscription_status?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      documents: {
        Row: {
          category: string | null
          client_id: string
          created_at: string | null
          description: string | null
          dietitian_id: string
          file_path: string
          file_size: number | null
          id: string
          is_visible_to_client: boolean | null
          metadata: Json | null
          mime_type: string | null
          name: string
          updated_at: string | null
          upload_date: string | null
        }
        Insert: {
          category?: string | null
          client_id: string
          created_at?: string | null
          description?: string | null
          dietitian_id: string
          file_path: string
          file_size?: number | null
          id?: string
          is_visible_to_client?: boolean | null
          metadata?: Json | null
          mime_type?: string | null
          name: string
          updated_at?: string | null
          upload_date?: string | null
        }
        Update: {
          category?: string | null
          client_id?: string
          created_at?: string | null
          description?: string | null
          dietitian_id?: string
          file_path?: string
          file_size?: number | null
          id?: string
          is_visible_to_client?: boolean | null
          metadata?: Json | null
          mime_type?: string | null
          name?: string
          updated_at?: string | null
          upload_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_dietitian_id_fkey"
            columns: ["dietitian_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          admin_notes: string | null
          attachments: string[] | null
          category: Database["public"]["Enums"]["feedback_category"]
          contact_email: string | null
          created_at: string | null
          description: string
          dietitian_id: string
          id: string
          page_url: string | null
          priority: Database["public"]["Enums"]["feedback_priority"] | null
          status: Database["public"]["Enums"]["feedback_status"] | null
          title: string
          updated_at: string | null
          user_agent: string | null
        }
        Insert: {
          admin_notes?: string | null
          attachments?: string[] | null
          category: Database["public"]["Enums"]["feedback_category"]
          contact_email?: string | null
          created_at?: string | null
          description: string
          dietitian_id: string
          id?: string
          page_url?: string | null
          priority?: Database["public"]["Enums"]["feedback_priority"] | null
          status?: Database["public"]["Enums"]["feedback_status"] | null
          title: string
          updated_at?: string | null
          user_agent?: string | null
        }
        Update: {
          admin_notes?: string | null
          attachments?: string[] | null
          category?: Database["public"]["Enums"]["feedback_category"]
          contact_email?: string | null
          created_at?: string | null
          description?: string
          dietitian_id?: string
          id?: string
          page_url?: string | null
          priority?: Database["public"]["Enums"]["feedback_priority"] | null
          status?: Database["public"]["Enums"]["feedback_status"] | null
          title?: string
          updated_at?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feedback_dietitian_id_fkey"
            columns: ["dietitian_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      french_foods: {
        Row: {
          alcohol_g: number | null
          alim_code: string | null
          alim_grp_code: string | null
          alim_grp_nom_fr: string | null
          alim_nom_sci: string | null
          alim_ssgrp_code: string | null
          alim_ssgrp_nom_fr: string | null
          alim_ssssgrp_code: string | null
          alim_ssssgrp_nom_fr: string | null
          ash_g: number | null
          barcode: string | null
          beta_carotene_ug: number | null
          calcium_mg: number | null
          carbohydrate_g: number | null
          category: string | null
          cholesterol_g: number | null
          cholesterol_mg: number | null
          copper_mg: number | null
          created_at: string | null
          dietitian_id: string | null
          energie_jones_kcal: number | null
          energie_jones_kj: number | null
          energy_kcal: number | null
          energy_kj: number | null
          fat_g: number | null
          fiber_g: number | null
          folates_ug: number | null
          fructose_g: number | null
          galactose_g: number | null
          glucose_g: number | null
          id: string
          iodine_ug: number | null
          iron_mg: number | null
          lactose_g: number | null
          magnesium_mg: number | null
          maltose_g: number | null
          manganese_mg: number | null
          monounsaturated_fat_g: number | null
          mufa_16_1_g: number | null
          mufa_18_1_g: number | null
          name_fr: string
          niacin_equiv_mg: number | null
          organic_acids_g: number | null
          phosphorus_mg: number | null
          polyols_g: number | null
          polyunsaturated_fat_g: number | null
          portion_gemrcn: number | null
          portion_pnns: number | null
          potassium_mg: number | null
          protein_g: number | null
          proteines_625_g: number | null
          pufa_18_2_g: number | null
          pufa_18_3_g: number | null
          pufa_20_4_g: number | null
          pufa_20_5_g: number | null
          pufa_22_6_g: number | null
          retinol_ug: number | null
          saccharose_g: number | null
          salt_g: number | null
          saturated_fat_g: number | null
          selenium_ug: number | null
          sfa_10_0_g: number | null
          sfa_12_0_g: number | null
          sfa_14_0_g: number | null
          sfa_16_0_g: number | null
          sfa_18_0_g: number | null
          sfa_4_0_g: number | null
          sfa_6_0_g: number | null
          sfa_8_0_g: number | null
          sodium_mg: number | null
          starch_g: number | null
          subcategory: string | null
          sugar_g: number | null
          updated_at: string | null
          vitamin_a_ug: number | null
          vitamin_b1_mg: number | null
          vitamin_b12_ug: number | null
          vitamin_b2_mg: number | null
          vitamin_b3_mg: number | null
          vitamin_b5_mg: number | null
          vitamin_b6_mg: number | null
          vitamin_b8_ug: number | null
          vitamin_b9_ug: number | null
          vitamin_c_mg: number | null
          vitamin_d_ug: number | null
          vitamin_e_mg: number | null
          vitamin_k1_ug: number | null
          vitamin_k2_ug: number | null
          water_g: number | null
          zinc_mg: number | null
        }
        Insert: {
          alcohol_g?: number | null
          alim_code?: string | null
          alim_grp_code?: string | null
          alim_grp_nom_fr?: string | null
          alim_nom_sci?: string | null
          alim_ssgrp_code?: string | null
          alim_ssgrp_nom_fr?: string | null
          alim_ssssgrp_code?: string | null
          alim_ssssgrp_nom_fr?: string | null
          ash_g?: number | null
          barcode?: string | null
          beta_carotene_ug?: number | null
          calcium_mg?: number | null
          carbohydrate_g?: number | null
          category?: string | null
          cholesterol_g?: number | null
          cholesterol_mg?: number | null
          copper_mg?: number | null
          created_at?: string | null
          dietitian_id?: string | null
          energie_jones_kcal?: number | null
          energie_jones_kj?: number | null
          energy_kcal?: number | null
          energy_kj?: number | null
          fat_g?: number | null
          fiber_g?: number | null
          folates_ug?: number | null
          fructose_g?: number | null
          galactose_g?: number | null
          glucose_g?: number | null
          id?: string
          iodine_ug?: number | null
          iron_mg?: number | null
          lactose_g?: number | null
          magnesium_mg?: number | null
          maltose_g?: number | null
          manganese_mg?: number | null
          monounsaturated_fat_g?: number | null
          mufa_16_1_g?: number | null
          mufa_18_1_g?: number | null
          name_fr: string
          niacin_equiv_mg?: number | null
          organic_acids_g?: number | null
          phosphorus_mg?: number | null
          polyols_g?: number | null
          polyunsaturated_fat_g?: number | null
          portion_gemrcn?: number | null
          portion_pnns?: number | null
          potassium_mg?: number | null
          protein_g?: number | null
          proteines_625_g?: number | null
          pufa_18_2_g?: number | null
          pufa_18_3_g?: number | null
          pufa_20_4_g?: number | null
          pufa_20_5_g?: number | null
          pufa_22_6_g?: number | null
          retinol_ug?: number | null
          saccharose_g?: number | null
          salt_g?: number | null
          saturated_fat_g?: number | null
          selenium_ug?: number | null
          sfa_10_0_g?: number | null
          sfa_12_0_g?: number | null
          sfa_14_0_g?: number | null
          sfa_16_0_g?: number | null
          sfa_18_0_g?: number | null
          sfa_4_0_g?: number | null
          sfa_6_0_g?: number | null
          sfa_8_0_g?: number | null
          sodium_mg?: number | null
          starch_g?: number | null
          subcategory?: string | null
          sugar_g?: number | null
          updated_at?: string | null
          vitamin_a_ug?: number | null
          vitamin_b1_mg?: number | null
          vitamin_b12_ug?: number | null
          vitamin_b2_mg?: number | null
          vitamin_b3_mg?: number | null
          vitamin_b5_mg?: number | null
          vitamin_b6_mg?: number | null
          vitamin_b8_ug?: number | null
          vitamin_b9_ug?: number | null
          vitamin_c_mg?: number | null
          vitamin_d_ug?: number | null
          vitamin_e_mg?: number | null
          vitamin_k1_ug?: number | null
          vitamin_k2_ug?: number | null
          water_g?: number | null
          zinc_mg?: number | null
        }
        Update: {
          alcohol_g?: number | null
          alim_code?: string | null
          alim_grp_code?: string | null
          alim_grp_nom_fr?: string | null
          alim_nom_sci?: string | null
          alim_ssgrp_code?: string | null
          alim_ssgrp_nom_fr?: string | null
          alim_ssssgrp_code?: string | null
          alim_ssssgrp_nom_fr?: string | null
          ash_g?: number | null
          barcode?: string | null
          beta_carotene_ug?: number | null
          calcium_mg?: number | null
          carbohydrate_g?: number | null
          category?: string | null
          cholesterol_g?: number | null
          cholesterol_mg?: number | null
          copper_mg?: number | null
          created_at?: string | null
          dietitian_id?: string | null
          energie_jones_kcal?: number | null
          energie_jones_kj?: number | null
          energy_kcal?: number | null
          energy_kj?: number | null
          fat_g?: number | null
          fiber_g?: number | null
          folates_ug?: number | null
          fructose_g?: number | null
          galactose_g?: number | null
          glucose_g?: number | null
          id?: string
          iodine_ug?: number | null
          iron_mg?: number | null
          lactose_g?: number | null
          magnesium_mg?: number | null
          maltose_g?: number | null
          manganese_mg?: number | null
          monounsaturated_fat_g?: number | null
          mufa_16_1_g?: number | null
          mufa_18_1_g?: number | null
          name_fr?: string
          niacin_equiv_mg?: number | null
          organic_acids_g?: number | null
          phosphorus_mg?: number | null
          polyols_g?: number | null
          polyunsaturated_fat_g?: number | null
          portion_gemrcn?: number | null
          portion_pnns?: number | null
          potassium_mg?: number | null
          protein_g?: number | null
          proteines_625_g?: number | null
          pufa_18_2_g?: number | null
          pufa_18_3_g?: number | null
          pufa_20_4_g?: number | null
          pufa_20_5_g?: number | null
          pufa_22_6_g?: number | null
          retinol_ug?: number | null
          saccharose_g?: number | null
          salt_g?: number | null
          saturated_fat_g?: number | null
          selenium_ug?: number | null
          sfa_10_0_g?: number | null
          sfa_12_0_g?: number | null
          sfa_14_0_g?: number | null
          sfa_16_0_g?: number | null
          sfa_18_0_g?: number | null
          sfa_4_0_g?: number | null
          sfa_6_0_g?: number | null
          sfa_8_0_g?: number | null
          sodium_mg?: number | null
          starch_g?: number | null
          subcategory?: string | null
          sugar_g?: number | null
          updated_at?: string | null
          vitamin_a_ug?: number | null
          vitamin_b1_mg?: number | null
          vitamin_b12_ug?: number | null
          vitamin_b2_mg?: number | null
          vitamin_b3_mg?: number | null
          vitamin_b5_mg?: number | null
          vitamin_b6_mg?: number | null
          vitamin_b8_ug?: number | null
          vitamin_b9_ug?: number | null
          vitamin_c_mg?: number | null
          vitamin_d_ug?: number | null
          vitamin_e_mg?: number | null
          vitamin_k1_ug?: number | null
          vitamin_k2_ug?: number | null
          water_g?: number | null
          zinc_mg?: number | null
        }
        Relationships: []
      }
      help_articles: {
        Row: {
          category_id: string
          content: string
          created_at: string | null
          description: string
          difficulty: string | null
          estimated_read_time: number | null
          helpful_count: number | null
          id: string
          is_featured: boolean | null
          is_published: boolean | null
          last_updated: string | null
          not_helpful_count: number | null
          sort_order: number | null
          tags: string[] | null
          title: string
          updated_at: string | null
          views: number | null
        }
        Insert: {
          category_id: string
          content: string
          created_at?: string | null
          description: string
          difficulty?: string | null
          estimated_read_time?: number | null
          helpful_count?: number | null
          id: string
          is_featured?: boolean | null
          is_published?: boolean | null
          last_updated?: string | null
          not_helpful_count?: number | null
          sort_order?: number | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          views?: number | null
        }
        Update: {
          category_id?: string
          content?: string
          created_at?: string | null
          description?: string
          difficulty?: string | null
          estimated_read_time?: number | null
          helpful_count?: number | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          last_updated?: string | null
          not_helpful_count?: number | null
          sort_order?: number | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "help_articles_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "help_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      help_categories: {
        Row: {
          color: string
          created_at: string | null
          description: string
          icon: string
          id: string
          is_active: boolean | null
          sort_order: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          color: string
          created_at?: string | null
          description: string
          icon: string
          id: string
          is_active?: boolean | null
          sort_order?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          color?: string
          created_at?: string | null
          description?: string
          icon?: string
          id?: string
          is_active?: boolean | null
          sort_order?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      ingredients: {
        Row: {
          calories_per_100g: number | null
          calories_per_100ml: number | null
          calories_per_piece: number | null
          carbs_per_100g: number | null
          carbs_per_100ml: number | null
          carbs_per_piece: number | null
          category: string | null
          created_at: string | null
          fat_per_100g: number | null
          fat_per_100ml: number | null
          fat_per_piece: number | null
          fiber_per_100g: number | null
          fiber_per_100ml: number | null
          fiber_per_piece: number | null
          id: string
          name: string
          notes: string | null
          protein_per_100g: number | null
          protein_per_100ml: number | null
          protein_per_piece: number | null
          unit_type: string | null
          updated_at: string | null
        }
        Insert: {
          calories_per_100g?: number | null
          calories_per_100ml?: number | null
          calories_per_piece?: number | null
          carbs_per_100g?: number | null
          carbs_per_100ml?: number | null
          carbs_per_piece?: number | null
          category?: string | null
          created_at?: string | null
          fat_per_100g?: number | null
          fat_per_100ml?: number | null
          fat_per_piece?: number | null
          fiber_per_100g?: number | null
          fiber_per_100ml?: number | null
          fiber_per_piece?: number | null
          id?: string
          name: string
          notes?: string | null
          protein_per_100g?: number | null
          protein_per_100ml?: number | null
          protein_per_piece?: number | null
          unit_type?: string | null
          updated_at?: string | null
        }
        Update: {
          calories_per_100g?: number | null
          calories_per_100ml?: number | null
          calories_per_piece?: number | null
          carbs_per_100g?: number | null
          carbs_per_100ml?: number | null
          carbs_per_piece?: number | null
          category?: string | null
          created_at?: string | null
          fat_per_100g?: number | null
          fat_per_100ml?: number | null
          fat_per_piece?: number | null
          fiber_per_100g?: number | null
          fiber_per_100ml?: number | null
          fiber_per_piece?: number | null
          id?: string
          name?: string
          notes?: string | null
          protein_per_100g?: number | null
          protein_per_100ml?: number | null
          protein_per_piece?: number | null
          unit_type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      invoices: {
        Row: {
          amount: number
          client_id: string
          created_at: string | null
          dietitian_id: string
          due_date: string
          id: string
          invoice_number: string
          issue_date: string | null
          notes: string | null
          payment_date: string | null
          service_description: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          client_id: string
          created_at?: string | null
          dietitian_id: string
          due_date: string
          id?: string
          invoice_number: string
          issue_date?: string | null
          notes?: string | null
          payment_date?: string | null
          service_description: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          client_id?: string
          created_at?: string | null
          dietitian_id?: string
          due_date?: string
          id?: string
          invoice_number?: string
          issue_date?: string | null
          notes?: string | null
          payment_date?: string | null
          service_description?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_dietitian_id_fkey"
            columns: ["dietitian_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_plan_recipes: {
        Row: {
          created_at: string
          day_number: number
          id: string
          meal_plan_id: string
          meal_type: string
          recipe_id: string
          servings_used: number | null
        }
        Insert: {
          created_at?: string
          day_number: number
          id?: string
          meal_plan_id: string
          meal_type: string
          recipe_id: string
          servings_used?: number | null
        }
        Update: {
          created_at?: string
          day_number?: number
          id?: string
          meal_plan_id?: string
          meal_type?: string
          recipe_id?: string
          servings_used?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "meal_plan_recipes_meal_plan_id_fkey"
            columns: ["meal_plan_id"]
            isOneToOne: false
            referencedRelation: "meal_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_plan_recipes_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_plan_templates: {
        Row: {
          category: string
          client_type: string | null
          created_at: string | null
          description: string | null
          dietary_restrictions: string[] | null
          dietitian_id: string
          difficulty: string | null
          duration_days: number | null
          goal_type: string | null
          health_condition: string | null
          id: string
          is_favorite: boolean | null
          is_public: boolean | null
          last_used_at: string | null
          meal_structure: Json
          name: string
          rating: number | null
          tags: string[] | null
          target_calories: string | null
          target_macros: Json | null
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          category: string
          client_type?: string | null
          created_at?: string | null
          description?: string | null
          dietary_restrictions?: string[] | null
          dietitian_id: string
          difficulty?: string | null
          duration_days?: number | null
          goal_type?: string | null
          health_condition?: string | null
          id?: string
          is_favorite?: boolean | null
          is_public?: boolean | null
          last_used_at?: string | null
          meal_structure: Json
          name: string
          rating?: number | null
          tags?: string[] | null
          target_calories?: string | null
          target_macros?: Json | null
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          category?: string
          client_type?: string | null
          created_at?: string | null
          description?: string | null
          dietary_restrictions?: string[] | null
          dietitian_id?: string
          difficulty?: string | null
          duration_days?: number | null
          goal_type?: string | null
          health_condition?: string | null
          id?: string
          is_favorite?: boolean | null
          is_public?: boolean | null
          last_used_at?: string | null
          meal_structure?: Json
          name?: string
          rating?: number | null
          tags?: string[] | null
          target_calories?: string | null
          target_macros?: Json | null
          updated_at?: string | null
          usage_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "meal_plan_templates_dietitian_id_fkey"
            columns: ["dietitian_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_plans: {
        Row: {
          calories_range: string | null
          client_id: string | null
          created_at: string | null
          description: string | null
          dietitian_id: string
          duration_days: number | null
          generation_method: string | null
          id: string
          name: string
          plan_content: Json
          rating: number | null
          rating_count: number | null
          status: string | null
          template_id: string | null
          updated_at: string | null
        }
        Insert: {
          calories_range?: string | null
          client_id?: string | null
          created_at?: string | null
          description?: string | null
          dietitian_id: string
          duration_days?: number | null
          generation_method?: string | null
          id?: string
          name: string
          plan_content: Json
          rating?: number | null
          rating_count?: number | null
          status?: string | null
          template_id?: string | null
          updated_at?: string | null
        }
        Update: {
          calories_range?: string | null
          client_id?: string | null
          created_at?: string | null
          description?: string | null
          dietitian_id?: string
          duration_days?: number | null
          generation_method?: string | null
          id?: string
          name?: string
          plan_content?: Json
          rating?: number | null
          rating_count?: number | null
          status?: string | null
          template_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meal_plans_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_plans_dietitian_id_fkey"
            columns: ["dietitian_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_plans_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "meal_plan_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachment_name: string | null
          attachment_url: string | null
          client_id: string
          content: string | null
          conversation_id: string | null
          created_at: string | null
          dietitian_id: string
          id: string
          is_read: boolean | null
          message: string
          message_type: string | null
          metadata: Json | null
          read_at: string | null
          sender_type: string
        }
        Insert: {
          attachment_name?: string | null
          attachment_url?: string | null
          client_id: string
          content?: string | null
          conversation_id?: string | null
          created_at?: string | null
          dietitian_id: string
          id?: string
          is_read?: boolean | null
          message: string
          message_type?: string | null
          metadata?: Json | null
          read_at?: string | null
          sender_type: string
        }
        Update: {
          attachment_name?: string | null
          attachment_url?: string | null
          client_id?: string
          content?: string | null
          conversation_id?: string | null
          created_at?: string | null
          dietitian_id?: string
          id?: string
          is_read?: boolean | null
          message?: string
          message_type?: string | null
          metadata?: Json | null
          read_at?: string | null
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_dietitian_id_fkey"
            columns: ["dietitian_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      privacy_policy_acceptances: {
        Row: {
          acceptance_method: string | null
          accepted_at: string | null
          client_id: string | null
          dietitian_id: string | null
          id: string
          ip_address: unknown | null
          policy_version_id: string | null
          user_agent: string | null
        }
        Insert: {
          acceptance_method?: string | null
          accepted_at?: string | null
          client_id?: string | null
          dietitian_id?: string | null
          id?: string
          ip_address?: unknown | null
          policy_version_id?: string | null
          user_agent?: string | null
        }
        Update: {
          acceptance_method?: string | null
          accepted_at?: string | null
          client_id?: string | null
          dietitian_id?: string | null
          id?: string
          ip_address?: unknown | null
          policy_version_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "privacy_policy_acceptances_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "privacy_policy_acceptances_dietitian_id_fkey"
            columns: ["dietitian_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "privacy_policy_acceptances_policy_version_id_fkey"
            columns: ["policy_version_id"]
            isOneToOne: false
            referencedRelation: "privacy_policy_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      privacy_policy_versions: {
        Row: {
          content: string
          created_at: string | null
          effective_from: string
          effective_until: string | null
          id: string
          is_current: boolean | null
          version: string
        }
        Insert: {
          content: string
          created_at?: string | null
          effective_from: string
          effective_until?: string | null
          id?: string
          is_current?: boolean | null
          version: string
        }
        Update: {
          content?: string
          created_at?: string | null
          effective_from?: string
          effective_until?: string | null
          id?: string
          is_current?: boolean | null
          version?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          bio: string | null
          city: string | null
          created_at: string | null
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          license_number: string | null
          phone: string | null
          state: string | null
          title: string | null
          updated_at: string | null
          years_experience: number | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string | null
          email: string
          first_name?: string | null
          id: string
          last_name?: string | null
          license_number?: string | null
          phone?: string | null
          state?: string | null
          title?: string | null
          updated_at?: string | null
          years_experience?: number | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string | null
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          license_number?: string | null
          phone?: string | null
          state?: string | null
          title?: string | null
          updated_at?: string | null
          years_experience?: number | null
          zip_code?: string | null
        }
        Relationships: []
      }
      recipe_ingredients: {
        Row: {
          created_at: string
          id: string
          ingredient_id: string | null
          name: string
          notes: string | null
          order_index: number | null
          quantity: number | null
          recipe_id: string
          unit: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          ingredient_id?: string | null
          name: string
          notes?: string | null
          order_index?: number | null
          quantity?: number | null
          recipe_id: string
          unit?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          ingredient_id?: string | null
          name?: string
          notes?: string | null
          order_index?: number | null
          quantity?: number | null
          recipe_id?: string
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recipe_ingredients_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_ingredients_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_templates: {
        Row: {
          calories_per_serving: number | null
          category: string
          cooking_time: number | null
          created_at: string | null
          description: string | null
          dietary_type: string[] | null
          dietitian_id: string
          difficulty: string | null
          id: string
          ingredients: Json
          instructions: Json
          is_favorite: boolean | null
          is_public: boolean | null
          macros: Json | null
          name: string
          preparation_time: number | null
          rating: number | null
          servings: number | null
          source: string | null
          tags: string[] | null
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          calories_per_serving?: number | null
          category: string
          cooking_time?: number | null
          created_at?: string | null
          description?: string | null
          dietary_type?: string[] | null
          dietitian_id: string
          difficulty?: string | null
          id?: string
          ingredients: Json
          instructions: Json
          is_favorite?: boolean | null
          is_public?: boolean | null
          macros?: Json | null
          name: string
          preparation_time?: number | null
          rating?: number | null
          servings?: number | null
          source?: string | null
          tags?: string[] | null
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          calories_per_serving?: number | null
          category?: string
          cooking_time?: number | null
          created_at?: string | null
          description?: string | null
          dietary_type?: string[] | null
          dietitian_id?: string
          difficulty?: string | null
          id?: string
          ingredients?: Json
          instructions?: Json
          is_favorite?: boolean | null
          is_public?: boolean | null
          macros?: Json | null
          name?: string
          preparation_time?: number | null
          rating?: number | null
          servings?: number | null
          source?: string | null
          tags?: string[] | null
          updated_at?: string | null
          usage_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "recipe_templates_dietitian_id_fkey"
            columns: ["dietitian_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      recipes: {
        Row: {
          calories_per_serving: number | null
          carbs_per_serving: number | null
          category: string
          cook_time: number | null
          created_at: string
          description: string | null
          dietitian_id: string
          difficulty: string | null
          fat_per_serving: number | null
          fiber_per_serving: number | null
          id: string
          image_url: string | null
          instructions: string[] | null
          is_favorite: boolean | null
          name: string
          prep_time: number | null
          protein_per_serving: number | null
          servings: number
          tags: string[] | null
          updated_at: string
          usage_count: number | null
        }
        Insert: {
          calories_per_serving?: number | null
          carbs_per_serving?: number | null
          category?: string
          cook_time?: number | null
          created_at?: string
          description?: string | null
          dietitian_id: string
          difficulty?: string | null
          fat_per_serving?: number | null
          fiber_per_serving?: number | null
          id?: string
          image_url?: string | null
          instructions?: string[] | null
          is_favorite?: boolean | null
          name: string
          prep_time?: number | null
          protein_per_serving?: number | null
          servings?: number
          tags?: string[] | null
          updated_at?: string
          usage_count?: number | null
        }
        Update: {
          calories_per_serving?: number | null
          carbs_per_serving?: number | null
          category?: string
          cook_time?: number | null
          created_at?: string
          description?: string | null
          dietitian_id?: string
          difficulty?: string | null
          fat_per_serving?: number | null
          fiber_per_serving?: number | null
          id?: string
          image_url?: string | null
          instructions?: string[] | null
          is_favorite?: boolean | null
          name?: string
          prep_time?: number | null
          protein_per_serving?: number | null
          servings?: number
          tags?: string[] | null
          updated_at?: string
          usage_count?: number | null
        }
        Relationships: []
      }
      reminders: {
        Row: {
          channels: string[] | null
          client_id: string
          created_at: string | null
          dietitian_id: string
          frequency: string | null
          id: string
          is_recurring: boolean | null
          message: string
          scheduled_date: string
          sent_at: string | null
          status: string | null
          title: string
          type: string
          updated_at: string | null
        }
        Insert: {
          channels?: string[] | null
          client_id: string
          created_at?: string | null
          dietitian_id: string
          frequency?: string | null
          id?: string
          is_recurring?: boolean | null
          message: string
          scheduled_date: string
          sent_at?: string | null
          status?: string | null
          title: string
          type: string
          updated_at?: string | null
        }
        Update: {
          channels?: string[] | null
          client_id?: string
          created_at?: string | null
          dietitian_id?: string
          frequency?: string | null
          id?: string
          is_recurring?: boolean | null
          message?: string
          scheduled_date?: string
          sent_at?: string | null
          status?: string | null
          title?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reminders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminders_dietitian_id_fkey"
            columns: ["dietitian_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_events: {
        Row: {
          created_at: string | null
          dietitian_id: string | null
          event_type: string
          id: string
          metadata: Json | null
          new_plan: string | null
          new_status: string | null
          previous_plan: string | null
          previous_status: string | null
          stripe_event_id: string | null
          stripe_subscription_id: string | null
        }
        Insert: {
          created_at?: string | null
          dietitian_id?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          new_plan?: string | null
          new_status?: string | null
          previous_plan?: string | null
          previous_status?: string | null
          stripe_event_id?: string | null
          stripe_subscription_id?: string | null
        }
        Update: {
          created_at?: string | null
          dietitian_id?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          new_plan?: string | null
          new_status?: string | null
          previous_plan?: string | null
          previous_status?: string | null
          stripe_event_id?: string | null
          stripe_subscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscription_events_dietitian_id_fkey"
            columns: ["dietitian_id"]
            isOneToOne: false
            referencedRelation: "dietitians"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          ai_generations_per_month: number | null
          created_at: string | null
          currency: string | null
          display_name: string
          features: Json
          id: string
          is_active: boolean | null
          max_clients: number | null
          max_meal_plans: number | null
          name: string
          price_monthly: number
          sort_order: number | null
          stripe_price_id: string
          updated_at: string | null
        }
        Insert: {
          ai_generations_per_month?: number | null
          created_at?: string | null
          currency?: string | null
          display_name: string
          features?: Json
          id?: string
          is_active?: boolean | null
          max_clients?: number | null
          max_meal_plans?: number | null
          name: string
          price_monthly: number
          sort_order?: number | null
          stripe_price_id: string
          updated_at?: string | null
        }
        Update: {
          ai_generations_per_month?: number | null
          created_at?: string | null
          currency?: string | null
          display_name?: string
          features?: Json
          id?: string
          is_active?: boolean | null
          max_clients?: number | null
          max_meal_plans?: number | null
          name?: string
          price_monthly?: number
          sort_order?: number | null
          stripe_price_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      weight_history: {
        Row: {
          client_id: string
          created_at: string | null
          id: string
          notes: string | null
          recorded_date: string | null
          weight: number
        }
        Insert: {
          client_id: string
          created_at?: string | null
          id?: string
          notes?: string | null
          recorded_date?: string | null
          weight: number
        }
        Update: {
          client_id?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          recorded_date?: string | null
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "weight_history_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      help_articles_with_category: {
        Row: {
          category_color: string | null
          category_description: string | null
          category_icon: string | null
          category_id: string | null
          category_title: string | null
          content: string | null
          created_at: string | null
          description: string | null
          difficulty: string | null
          estimated_read_time: number | null
          helpful_count: number | null
          id: string | null
          is_featured: boolean | null
          is_published: boolean | null
          last_updated: string | null
          not_helpful_count: number | null
          sort_order: number | null
          tags: string[] | null
          title: string | null
          updated_at: string | null
          views: number | null
        }
        Relationships: [
          {
            foreignKeyName: "help_articles_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "help_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_analytics: {
        Row: {
          display_name: string | null
          mrr: number | null
          plan_name: string | null
          subscriber_count: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      anonymize_client_data: {
        Args: {
          p_client_id: string
          p_dietitian_id: string
          p_anonymization_type?: string
        }
        Returns: string
      }
      check_data_retention: {
        Args: {
          p_dietitian_id: string
          p_data_category: string
          p_created_at: string
        }
        Returns: boolean
      }
      check_session_limit: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      check_subscription_limit: {
        Args: { p_dietitian_id: string; p_limit_type: string }
        Returns: boolean
      }
      create_data_export_request: {
        Args: {
          p_dietitian_id: string
          p_client_id: string
          p_request_type?: string
        }
        Returns: string
      }
      get_client_conversation: {
        Args: { client_id: string }
        Returns: {
          conversation_id: string
          dietitian_id: string
          subject: string
          last_message_at: string
          unread_count: number
        }[]
      }
      get_user_role: {
        Args: { user_uuid?: string }
        Returns: string
      }
      has_role: {
        Args: { required_role: string; user_uuid?: string }
        Returns: boolean
      }
      increment_unread_count: {
        Args: { conversation_id: string }
        Returns: number
      }
      is_admin: {
        Args: { user_uuid?: string }
        Returns: boolean
      }
      is_trial_expired: {
        Args: { p_dietitian_id: string }
        Returns: boolean
      }
      log_audit_action: {
        Args: {
          p_user_id: string
          p_user_email: string
          p_user_type: string
          p_action: string
          p_resource_type: string
          p_resource_id?: string
          p_details?: Json
          p_ip_address?: unknown
          p_user_agent?: string
          p_session_id?: string
        }
        Returns: string
      }
      log_security_event: {
        Args: {
          p_user_id: string
          p_event_type: string
          p_description?: string
          p_severity?: string
          p_metadata?: Json
          p_ip_address?: unknown
          p_user_agent?: string
          p_device_fingerprint?: string
        }
        Returns: string
      }
      log_subscription_event: {
        Args: {
          p_dietitian_id: string
          p_event_type: string
          p_stripe_event_id?: string
          p_stripe_subscription_id?: string
          p_previous_status?: string
          p_new_status?: string
          p_previous_plan?: string
          p_new_plan?: string
          p_metadata?: Json
        }
        Returns: string
      }
      mark_messages_read: {
        Args: { conversation_id: string; reader_type: string }
        Returns: number
      }
    }
    Enums: {
      feedback_category: "bug" | "suggestion" | "feature_request" | "question"
      feedback_priority: "low" | "medium" | "high"
      feedback_status: "new" | "in_progress" | "resolved" | "closed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      feedback_category: ["bug", "suggestion", "feature_request", "question"],
      feedback_priority: ["low", "medium", ""high"],
      feedback_status: ["new", "in_progress", "resolved", "closed"],
    },
  },
} as const

export type Client = Database["public"]["Tables"]["clients"]["Row"];
export type ClientAccount =
  Database["public"]["Tables"]["client_accounts"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type MealPlan = Database["public"]["Tables"]["meal_plans"]["Row"];
export type Invoice = Database["public"]["Tables"]["invoices"]["Row"];
export type Reminder = Database["public"]["Tables"]["reminders"]["Row"];
export type RecipeTemplate =
  Database["public"]["Tables"]["recipe_templates"]["Row"];
export type MealPlanTemplate =
  Database["public"]["Tables"]["meal_plan_templates"]["Row"];
export type Appointment = Database["public"]["Tables"]["appointments"]["Row"];
export type Conversation = Database["public"]["Tables"]["conversations"]["Row"];
export type AIGeneration = Database["public"]["Tables"]["ai_generations"]["Row"];
export type Message = Database["public"]["Tables"]["messages"]["Row"];
export type Recipe = Database["public"]["Tables"]["recipes"]["Row"];
export type RecipeIngredient = Database["public"]["Tables"]["recipe_ingredients"]["Row"];
export type MealPlanRecipe = Database["public"]["Tables"]["meal_plan_recipes"]["Row"];