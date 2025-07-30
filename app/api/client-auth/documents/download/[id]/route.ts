import { validateClientAuth } from "@/lib/client-auth-security";
import { checkRateLimit } from "@/lib/security-validation";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params before using
    const { id: documentId } = await params;

    // Rate limiting by IP
    const clientIP =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const rateLimit = checkRateLimit(`download:${clientIP}`, 20, 60 * 1000); // 20 downloads per minute

    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Trop de requêtes de téléchargement. Veuillez patienter." },
        { status: 429 }
      );
    }

    // SECURITY: Use secure client authentication
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

    // Verify the document belongs to the client and is visible
    const { data: document, error: docError } = await supabase
      .from("documents")
      .select("id, name, file_path, is_visible_to_client, mime_type")
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
      .download(document.file_path);

    if (downloadError || !fileData) {
      // TODO: Log error to monitoring service
      return NextResponse.json(
        { error: "Failed to download file" },
        { status: 500 }
      );
    }

    // Return the file as a response
    return new NextResponse(fileData, {
      headers: {
        "Content-Type": document.mime_type || fileData.type || "application/octet-stream",
        "Cache-Control": "public, max-age=3600", // Cache for 1 hour
      },
    });
  } catch (error) {
    // TODO: Log error to monitoring service
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}