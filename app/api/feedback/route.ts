import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get profile for tenant isolation (profiles.id = auth.uid() in RLS)
    const dietitianId = user.id; // In this system, user.id is the same as profile.id

    // Parse form data
    const formData = await request.formData();
    
    const category = formData.get('category') as string;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const priority = formData.get('priority') as string || 'medium';
    const contact_email = formData.get('contact_email') as string || null;
    const page_url = formData.get('page_url') as string || null;
    const user_agent = formData.get('user_agent') as string || null;

    // Validate required fields
    if (!category || !title || !description) {
      return NextResponse.json(
        { error: 'Missing required fields: category, title, description' },
        { status: 400 }
      );
    }

    // Validate category and priority values
    const validCategories = ['bug', 'suggestion', 'feature_request', 'question'];
    const validPriorities = ['low', 'medium', 'high'];
    
    if (!validCategories.includes(category)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
    }
    
    if (!validPriorities.includes(priority)) {
      return NextResponse.json({ error: 'Invalid priority' }, { status: 400 });
    }

    // Handle file attachments
    const attachmentUrls: string[] = [];
    const files: File[] = [];
    
    // Extract files from form data
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('attachment_') && value instanceof File) {
        files.push(value);
      }
    }

    // Upload files to Supabase Storage if any
    if (files.length > 0) {
      for (const file of files) {
        // Validate file type and size
        const isValidType = file.type.startsWith('image/') || file.type === 'application/pdf';
        const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB max
        
        if (!isValidType || !isValidSize) {
          continue; // Skip invalid files
        }

        // Generate unique filename
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2);
        const extension = file.name.split('.').pop();
        const filename = `feedback/${dietitianId}/${timestamp}_${randomString}.${extension}`;

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filename, file);

        if (uploadError) {
          console.error('File upload error:', uploadError);
          continue; // Skip failed uploads
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('documents')
          .getPublicUrl(filename);

        if (urlData?.publicUrl) {
          attachmentUrls.push(urlData.publicUrl);
        }
      }
    }

    // Insert feedback into database
    const { data: feedbackData, error: insertError } = await supabase
      .from('feedback')
      .insert({
        dietitian_id: dietitianId,
        category,
        title: title.trim(),
        description: description.trim(),
        priority,
        contact_email: contact_email?.trim() || null,
        page_url,
        user_agent,
        attachments: attachmentUrls.length > 0 ? attachmentUrls : null
      })
      .select()
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to save feedback' },
        { status: 500 }
      );
    }

    // TODO: Send notification email to support team
    // This would typically integrate with a service like SendGrid, Resend, or AWS SES
    // Example:
    // await sendNotificationEmail({
    //   feedbackId: feedbackData.id,
    //   category,
    //   title,
    //   description,
    //   userEmail: user.email,
    //   contactEmail: contact_email
    // });

    return NextResponse.json({
      success: true,
      feedback: {
        id: feedbackData.id,
        category: feedbackData.category,
        title: feedbackData.title,
        status: feedbackData.status,
        created_at: feedbackData.created_at
      }
    });

  } catch (error) {
    console.error('Feedback API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get profile for tenant isolation (profiles.id = auth.uid() in RLS)
    const dietitianId = user.id; // In this system, user.id is the same as profile.id

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status');
    const category = searchParams.get('category');

    // Build query
    let query = supabase
      .from('feedback')
      .select('*')
      .eq('dietitian_id', dietitianId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Add filters
    if (status) {
      query = query.eq('status', status);
    }
    if (category) {
      query = query.eq('category', category);
    }

    const { data: feedbacks, error: fetchError } = await query;

    if (fetchError) {
      console.error('Database fetch error:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch feedback' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      feedbacks,
      pagination: {
        limit,
        offset,
        total: feedbacks?.length || 0
      }
    });

  } catch (error) {
    console.error('Feedback GET API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}