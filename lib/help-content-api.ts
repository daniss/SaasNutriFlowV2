// New API-based help content service
export interface HelpArticle {
  id: string;
  title: string;
  description: string;
  content: string;
  category: string;
  categoryTitle?: string;
  categoryIcon?: string;
  categoryColor?: string;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedReadTime: number; // in minutes
  lastUpdated: string;
  views?: number;
  helpful?: number;
  featured?: boolean;
}

export interface HelpCategory {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  articles: number; // article count
  sortOrder?: number;
}

// Fetch help categories from API
export async function fetchHelpCategories(): Promise<HelpCategory[]> {
  try {
    const response = await fetch('/api/help/categories', {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch help categories');
    }

    const data = await response.json();
    return data.categories || [];
  } catch (error) {
    console.error('Error fetching help categories:', error);
    return [];
  }
}

// Fetch help articles from API
export async function fetchHelpArticles(options?: {
  category?: string;
  featured?: boolean;
  limit?: number;
  search?: string;
}): Promise<HelpArticle[]> {
  try {
    const params = new URLSearchParams();
    
    if (options?.category) params.append('category', options.category);
    if (options?.featured) params.append('featured', 'true');
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.search) params.append('search', options.search);

    const response = await fetch(`/api/help/articles?${params.toString()}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch help articles');
    }

    const data = await response.json();
    return data.articles || [];
  } catch (error) {
    console.error('Error fetching help articles:', error);
    return [];
  }
}

// Fetch a specific help article from API
export async function fetchHelpArticle(id: string): Promise<HelpArticle | null> {
  try {
    const response = await fetch(`/api/help/articles/${id}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error('Failed to fetch help article');
    }

    const data = await response.json();
    return data.article || null;
  } catch (error) {
    console.error('Error fetching help article:', error);
    return null;
  }
}

// Vote on an article (helpful/not helpful)
export async function voteOnArticle(id: string, vote: 'up' | 'down'): Promise<boolean> {
  try {
    const response = await fetch(`/api/help/articles/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'vote',
        value: vote
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('Error voting on article:', error);
    return false;
  }
}

// Search functionality
export async function searchArticles(query: string, categories?: string[]): Promise<HelpArticle[]> {
  if (!query.trim()) return [];
  
  try {
    return await fetchHelpArticles({
      search: query,
      category: categories?.length === 1 ? categories[0] : undefined
    });
  } catch (error) {
    console.error('Error searching articles:', error);
    return [];
  }
}

// Get article by ID (helper function for backward compatibility)
export async function getArticleById(id: string): Promise<HelpArticle | null> {
  return await fetchHelpArticle(id);
}

// Get category by ID (helper function - needs to be implemented if needed)
export async function getCategoryById(id: string): Promise<HelpCategory | null> {
  const categories = await fetchHelpCategories();
  return categories.find(cat => cat.id === id) || null;
}

// Get popular articles
export async function getPopularArticles(limit: number = 5): Promise<HelpArticle[]> {
  return await fetchHelpArticles({ limit });
}

// Get featured articles
export async function getFeaturedArticles(): Promise<HelpArticle[]> {
  return await fetchHelpArticles({ featured: true });
}