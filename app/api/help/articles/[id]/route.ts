import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const articleId = params.id;

    // Fetch the specific article
    const { data: article, error } = await supabase
      .from('help_articles_with_category')
      .select('*')
      .eq('id', articleId)
      .eq('is_published', true)
      .single();

    if (error || !article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      );
    }

    // Increment view count
    await supabase
      .from('help_articles')
      .update({ views: (article.views || 0) + 1 })
      .eq('id', articleId);

    // Transform the data to match the frontend expectations
    const transformedArticle = {
      id: article.id,
      title: article.title,
      description: article.description,
      content: article.content,
      category: article.category_id,
      categoryTitle: article.category_title,
      categoryIcon: article.category_icon,
      categoryColor: article.category_color,
      tags: article.tags || [],
      difficulty: article.difficulty,
      estimatedReadTime: article.estimated_read_time,
      lastUpdated: article.last_updated,
      views: (article.views || 0) + 1, // Include the incremented view
      helpful: article.helpful_count || 0,
      featured: article.is_featured || false
    };

    return NextResponse.json({
      success: true,
      article: transformedArticle
    });

  } catch (error) {
    console.error('Help article API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const articleId = params.id;
    const body = await request.json();
    const { action, value } = body;

    if (action === 'vote') {
      const field = value === 'up' ? 'helpful_count' : 'not_helpful_count';
      
      // Get current count
      const { data: current } = await supabase
        .from('help_articles')
        .select(field)
        .eq('id', articleId)
        .single();

      // Increment the count
      const { error } = await supabase
        .from('help_articles')
        .update({ [field]: ((current as any)?.[field] || 0) + 1 })
        .eq('id', articleId);

      if (error) {
        return NextResponse.json(
          { error: 'Failed to update vote' },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Help article vote API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}