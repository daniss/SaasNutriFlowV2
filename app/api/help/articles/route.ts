import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('category');
    const featured = searchParams.get('featured') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search');

    // Build query
    let query = supabase
      .from('help_articles_with_category')
      .select('*')
      .eq('is_published', true)
      .order('views', { ascending: false })
      .limit(limit);

    // Add filters
    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }
    
    if (featured) {
      query = query.eq('is_featured', true);
    }

    // Add search functionality
    if (search && search.trim()) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,content.ilike.%${search}%`);
    }

    const { data: articles, error } = await query;

    if (error) {
      // TODO: Log database error to monitoring service
      return NextResponse.json(
        { error: 'Failed to fetch help articles' },
        { status: 500 }
      );
    }

    // Transform the data to match the frontend expectations
    const transformedArticles = articles.map(article => ({
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
      views: article.views || 0,
      helpful: article.helpful_count || 0,
      featured: article.is_featured || false
    }));

    return NextResponse.json({
      success: true,
      articles: transformedArticles
    });

  } catch (error) {
    // TODO: Log API error to monitoring service
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}