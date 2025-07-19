import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch help categories with article counts
    const { data: categories, error } = await supabase
      .from('help_categories')
      .select(`
        *,
        help_articles:help_articles(count)
      `)
      .eq('is_active', true)
      .order('sort_order');

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch help categories' },
        { status: 500 }
      );
    }

    // Transform the data to match the frontend expectations
    const transformedCategories = categories.map(category => ({
      id: category.id,
      title: category.title,
      description: category.description,
      icon: category.icon,
      color: category.color,
      articles: category.help_articles[0]?.count || 0,
      sortOrder: category.sort_order
    }));

    return NextResponse.json({
      success: true,
      categories: transformedCategories
    });

  } catch (error) {
    console.error('Help categories API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}