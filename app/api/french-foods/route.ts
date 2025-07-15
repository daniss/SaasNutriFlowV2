import { Database } from "@/lib/supabase";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name") || "";
  const barcode = searchParams.get("barcode") || "";
  const category = searchParams.get("category") || "";
  const limit = Number(searchParams.get("limit")) || 20;
  const offset = Number(searchParams.get("offset")) || 0;


  // Get user session for RLS
  const supabaseServer = await createServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabaseServer.auth.getUser();
  if (userError || !user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }


  let query = supabaseServer
    .from("french_foods")
    .select("*")
    .or(`dietitian_id.is.null,dietitian_id.eq.${user.id}`)
    .range(offset, offset + limit - 1);

  if (name) {
    query = query.ilike("name_fr", `%${name}%`);
  }
  if (barcode) {
    query = query.eq("barcode", barcode);
  }
  if (category) {
    query = query.ilike("category", `%${category}%`);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ foods: data });
}
