import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateClientAuth } from '@/lib/client-auth-security';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // Verify client authentication
    const authResult = await validateClientAuth(request);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { clientId } = authResult;
    const formData = await request.formData();
    const photo = formData.get('photo') as File;
    const isVisibleToNutritionist = formData.get('isVisibleToNutritionist') === 'true';
    const notes = formData.get('notes') as string;

    if (!photo) {
      return NextResponse.json({ error: 'No photo provided' }, { status: 400 });
    }

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(photo.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }

    // Validate file size (5MB max)
    if (photo.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large' }, { status: 400 });
    }

    // Get client information to get dietitian_id
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .select('dietitian_id, name')
      .eq('id', clientId)
      .single();

    if (clientError || !clientData) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = photo.name.split('.').pop();
    const fileName = `progress_${clientId}_${timestamp}.${fileExtension}`;
    const filePath = `documents/${fileName}`;

    // Upload file to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, photo, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json({ error: 'Failed to upload photo' }, { status: 500 });
    }

    // Create document record
    const { data: documentData, error: documentError } = await supabase
      .from('documents')
      .insert({
        client_id: clientId,
        dietitian_id: clientData.dietitian_id,
        name: `Photo de progrès - ${new Date().toLocaleDateString('fr-FR')}`,
        file_path: filePath,
        file_size: photo.size,
        mime_type: photo.type,
        category: 'photo',
        description: notes || 'Photo de progrès ajoutée par le client',
        is_visible_to_client: true,
        metadata: {
          type: 'progress_photo',
          uploaded_by: 'client',
          weight_entry: true,
          visible_to_nutritionist: isVisibleToNutritionist
        }
      })
      .select()
      .single();

    if (documentError) {
      console.error('Document creation error:', documentError);
      
      // Clean up uploaded file if document creation failed
      await supabase.storage
        .from('documents')
        .remove([filePath]);
      
      return NextResponse.json({ error: 'Failed to create document record' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: documentData.id,
        name: documentData.name,
        uploadDate: documentData.upload_date,
        isVisibleToNutritionist
      }
    });

  } catch (error) {
    console.error('Progress photo upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}