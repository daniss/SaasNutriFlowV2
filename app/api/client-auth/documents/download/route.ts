import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { clientId, documentId, filePath } = await request.json();

    if (!clientId || !documentId || !filePath) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

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

    // Verify the document belongs to the client and is visible
    const { data: document, error: docError } = await supabase
      .from("documents")
      .select("id, name, file_path, is_visible_to_client")
      .eq("id", documentId)
      .eq("client_id", clientId)
      .eq("is_visible_to_client", true)
      .single();

    if (docError || !document) {
      return NextResponse.json(
        { error: "Document not found or not accessible" },
        { status: 404 }
      );
    }

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("documents")
      .download(filePath);

    if (downloadError || !fileData) {
      console.error("Storage download error:", downloadError);
      return NextResponse.json(
        { error: "Failed to download file" },
        { status: 500 }
      );
    }

    // Return the file as a blob
    return new NextResponse(fileData, {
      headers: {
        "Content-Type": fileData.type || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${document.name}"`,
      },
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
