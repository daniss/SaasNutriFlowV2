"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, AlertCircle, Loader2, Database, Play } from "lucide-react"
import { supabase } from "@/lib/supabase"

/**
 * Component to help set up the database tables
 * This will run the SQL scripts to create all necessary tables
 */
export function DatabaseSetup() {
  const [status, setStatus] = useState<"idle" | "checking" | "creating" | "success" | "error">("idle")
  const [message, setMessage] = useState<string>("")
  const [tablesExist, setTablesExist] = useState<boolean>(false)

  const checkTables = async () => {
    setStatus("checking")
    setMessage("Checking if database tables exist...")

    try {
      // Try to query the profiles table to see if it exists
      const { error } = await supabase.from("profiles").select("count").limit(1)

      if (error && error.message.includes('relation "profiles" does not exist')) {
        setTablesExist(false)
        setMessage("Database tables need to be created.")
        setStatus("idle")
      } else if (error) {
        throw error
      } else {
        setTablesExist(true)
        setMessage("✅ Database tables already exist!")
        setStatus("success")
      }
    } catch (err) {
      setStatus("error")
      setMessage(`Error checking tables: ${err instanceof Error ? err.message : "Unknown error"}`)
    }
  }

  const createTables = async () => {
    setStatus("creating")
    setMessage("Creating database tables... This may take a moment.")

    try {
      // Read the SQL file content (in a real app, you'd have this as a string or import it)
      const sqlScript = `
        -- Enable Row Level Security (RLS) for all tables
        CREATE TABLE IF NOT EXISTS profiles (
          id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
          first_name TEXT,
          last_name TEXT,
          email TEXT UNIQUE NOT NULL,
          phone TEXT,
          title TEXT DEFAULT 'Registered Dietitian',
          bio TEXT,
          address TEXT,
          license_number TEXT,
          years_experience INTEGER,
          avatar_url TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS clients (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          dietitian_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          phone TEXT,
          address TEXT,
          age INTEGER,
          height TEXT,
          current_weight DECIMAL,
          goal_weight DECIMAL,
          goal TEXT NOT NULL,
          plan_type TEXT DEFAULT 'Standard',
          status TEXT DEFAULT 'Active',
          tags TEXT[] DEFAULT '{}',
          notes TEXT,
          emergency_contact TEXT,
          join_date DATE DEFAULT CURRENT_DATE,
          last_session TIMESTAMP WITH TIME ZONE,
          next_appointment TIMESTAMP WITH TIME ZONE,
          progress_percentage INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Enable RLS
        ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
        ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

        -- Create policies
        DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
        CREATE POLICY "Users can view own profile" ON profiles
          FOR SELECT USING (auth.uid() = id);

        DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
        CREATE POLICY "Users can update own profile" ON profiles
          FOR UPDATE USING (auth.uid() = id);

        DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
        CREATE POLICY "Users can insert own profile" ON profiles
          FOR INSERT WITH CHECK (auth.uid() = id);

        -- Create function to handle user profile creation
        CREATE OR REPLACE FUNCTION public.handle_new_user()
        RETURNS TRIGGER AS $$
        BEGIN
          INSERT INTO public.profiles (id, email, first_name, last_name)
          VALUES (
            NEW.id,
            NEW.email,
            NEW.raw_user_meta_data->>'first_name',
            NEW.raw_user_meta_data->>'last_name'
          );
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;

        -- Drop existing trigger if it exists
        DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

        -- Create trigger
        CREATE TRIGGER on_auth_user_created
          AFTER INSERT ON auth.users
          FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
      `

      // Execute the SQL using Supabase RPC
      const { error } = await supabase.rpc("exec_sql", { sql: sqlScript })

      if (error) {
        throw error
      }

      setStatus("success")
      setMessage("✅ Database tables created successfully!")
      setTablesExist(true)
    } catch (err) {
      setStatus("error")
      setMessage(`Error creating tables: ${err instanceof Error ? err.message : "Unknown error"}`)
    }
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Database Setup
        </CardTitle>
        <CardDescription>Set up your NutriFlow database tables</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {status === "idle" && !tablesExist && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Your database tables need to be created before you can use NutriFlow. Click "Check Tables" to verify the
              current status.
            </AlertDescription>
          </Alert>
        )}

        {status === "success" && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{message}</AlertDescription>
          </Alert>
        )}

        {status === "error" && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        {(status === "checking" || status === "creating") && (
          <Alert>
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        {message && status !== "checking" && status !== "creating" && status !== "success" && status !== "error" && (
          <Alert>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2">
          <Button onClick={checkTables} disabled={status === "checking" || status === "creating"} variant="outline">
            {status === "checking" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Check Tables
          </Button>

          {!tablesExist && (
            <Button onClick={createTables} disabled={status === "checking" || status === "creating"}>
              {status === "creating" ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              Create Tables
            </Button>
          )}
        </div>

        <div className="text-sm text-gray-600">
          <p className="font-medium mb-2">Manual Setup (Alternative):</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Go to your Supabase dashboard</li>
            <li>Navigate to the SQL Editor</li>
            <li>
              Copy and paste the SQL from <code>scripts/create-tables.sql</code>
            </li>
            <li>Run the script</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  )
}
