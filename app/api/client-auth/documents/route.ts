import { validateClientAuth } from "@/lib/client-auth-security";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // SECURITY FIX: Use secure client authentication
    const authResult = await validateClientAuth(request);
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }
    const { clientId } = authResult;

    // Use service role client to bypass RLS for client authentication
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Fetch documents that are visible to the client, excluding progress photos
    const { data: documents, error } = await supabase
      .from("documents")
      .select(
        `
        id,
        name,
        file_path,
        file_size,
        mime_type,
        category,
        description,
        upload_date,
        is_visible_to_client,
        metadata,
        dietitian:profiles!dietitian_id(first_name, last_name)
      `
      )
      .eq("client_id", clientId)
      .eq("is_visible_to_client", true)
      .order("upload_date", { ascending: false });

    // Filter out progress photos on the server side
    const filteredDocuments = documents?.filter(doc => {
      if (doc.metadata && typeof doc.metadata === 'object' && 
          'type' in doc.metadata && doc.metadata.type === 'progress_photo') {
        return false;
      }
      return true;
    }) || [];

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to fetch documents" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      documents: filteredDocuments,
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
