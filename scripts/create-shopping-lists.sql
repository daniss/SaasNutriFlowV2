-- Enhanced Shopping List System
-- Builds upon existing basic shopping list functionality in meal plans
-- Adds standalone shopping list management with categories, quantities, and persistence

-- Create shopping lists table
CREATE TABLE IF NOT EXISTS shopping_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dietitian_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  
  -- List details
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  is_template BOOLEAN DEFAULT false,
  template_category TEXT,
  
  -- Statistics
  total_items INTEGER DEFAULT 0,
  completed_items INTEGER DEFAULT 0,
  
  -- Links to meal plans and templates
  meal_plan_id UUID REFERENCES meal_plans(id) ON DELETE SET NULL,
  template_id UUID REFERENCES meal_plan_templates(id) ON DELETE SET NULL,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create shopping list items table
CREATE TABLE IF NOT EXISTS shopping_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shopping_list_id UUID NOT NULL REFERENCES shopping_lists(id) ON DELETE CASCADE,
  
  -- Item details
  name TEXT NOT NULL,
  quantity TEXT,
  unit TEXT,
  category TEXT NOT NULL DEFAULT 'other',
  is_purchased BOOLEAN DEFAULT false,
  notes TEXT,
  
  -- Links to meal plans and templates
  meal_plan_id UUID REFERENCES meal_plans(id) ON DELETE SET NULL,
  template_id UUID REFERENCES meal_plan_templates(id) ON DELETE SET NULL,
  
  -- Ordering
  order_index INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create shopping list templates table
CREATE TABLE IF NOT EXISTS shopping_list_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dietitian_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Template details
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  usage_count INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT false,
  tags TEXT[] DEFAULT '{}',
  
  -- Template items (stored as JSONB for flexibility)
  items JSONB NOT NULL DEFAULT '[]',
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create shopping list categories table
CREATE TABLE IF NOT EXISTS shopping_list_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default categories
INSERT INTO shopping_list_categories (id, name, icon, color, order_index, is_default) VALUES
  ('fruits-vegetables', 'Fruits & Légumes', '🥬', '#10b981', 1, true),
  ('proteins', 'Protéines', '🥩', '#ef4444', 2, true),
  ('dairy', 'Produits laitiers', '🥛', '#3b82f6', 3, true),
  ('grains', 'Céréales & Féculents', '🌾', '#f59e0b', 4, true),
  ('condiments', 'Condiments & Épices', '🧂', '#8b5cf6', 5, true),
  ('beverages', 'Boissons', '🥤', '#06b6d4', 6, true),
  ('frozen', 'Produits surgelés', '❄️', '#0ea5e9', 7, true),
  ('bakery', 'Boulangerie', '🥖', '#d97706', 8, true),
  ('other', 'Autres', '🛒', '#6b7280', 9, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  icon = EXCLUDED.icon,
  color = EXCLUDED.color,
  order_index = EXCLUDED.order_index;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_shopping_lists_dietitian ON shopping_lists(dietitian_id);
CREATE INDEX IF NOT EXISTS idx_shopping_lists_client ON shopping_lists(client_id);
CREATE INDEX IF NOT EXISTS idx_shopping_lists_status ON shopping_lists(status);
CREATE INDEX IF NOT EXISTS idx_shopping_lists_meal_plan ON shopping_lists(meal_plan_id);
CREATE INDEX IF NOT EXISTS idx_shopping_lists_template ON shopping_lists(template_id);

CREATE INDEX IF NOT EXISTS idx_shopping_list_items_list ON shopping_list_items(shopping_list_id);
CREATE INDEX IF NOT EXISTS idx_shopping_list_items_category ON shopping_list_items(category);
CREATE INDEX IF NOT EXISTS idx_shopping_list_items_purchased ON shopping_list_items(is_purchased);
CREATE INDEX IF NOT EXISTS idx_shopping_list_items_order ON shopping_list_items(order_index);

CREATE INDEX IF NOT EXISTS idx_shopping_list_templates_dietitian ON shopping_list_templates(dietitian_id);
CREATE INDEX IF NOT EXISTS idx_shopping_list_templates_category ON shopping_list_templates(category);
CREATE INDEX IF NOT EXISTS idx_shopping_list_templates_public ON shopping_list_templates(is_public);
CREATE INDEX IF NOT EXISTS idx_shopping_list_templates_usage ON shopping_list_templates(usage_count);

-- Add RLS policies
ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_list_templates ENABLE ROW LEVEL SECURITY;

-- Policies for shopping_lists
CREATE POLICY "Dietitians can manage their shopping lists" ON shopping_lists
  FOR ALL USING (dietitian_id = auth.uid());

-- Policies for shopping_list_items
CREATE POLICY "Dietitians can manage items in their shopping lists" ON shopping_list_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM shopping_lists 
      WHERE id = shopping_list_items.shopping_list_id 
      AND dietitian_id = auth.uid()
    )
  );

-- Policies for shopping_list_templates
CREATE POLICY "Dietitians can manage their shopping list templates" ON shopping_list_templates
  FOR ALL USING (dietitian_id = auth.uid());

-- Create function to update shopping list totals
CREATE OR REPLACE FUNCTION update_shopping_list_totals()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the shopping list totals
  UPDATE shopping_lists 
  SET 
    total_items = (
      SELECT COUNT(*) FROM shopping_list_items 
      WHERE shopping_list_id = COALESCE(NEW.shopping_list_id, OLD.shopping_list_id)
    ),
    completed_items = (
      SELECT COUNT(*) FROM shopping_list_items 
      WHERE shopping_list_id = COALESCE(NEW.shopping_list_id, OLD.shopping_list_id)
      AND is_purchased = true
    ),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.shopping_list_id, OLD.shopping_list_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update totals
CREATE OR REPLACE TRIGGER trigger_update_shopping_list_totals_on_insert
  AFTER INSERT ON shopping_list_items
  FOR EACH ROW
  EXECUTE FUNCTION update_shopping_list_totals();

CREATE OR REPLACE TRIGGER trigger_update_shopping_list_totals_on_update
  AFTER UPDATE ON shopping_list_items
  FOR EACH ROW
  EXECUTE FUNCTION update_shopping_list_totals();

CREATE OR REPLACE TRIGGER trigger_update_shopping_list_totals_on_delete
  AFTER DELETE ON shopping_list_items
  FOR EACH ROW
  EXECUTE FUNCTION update_shopping_list_totals();

-- Create function to increment template usage
CREATE OR REPLACE FUNCTION increment_template_usage()
RETURNS TRIGGER AS $$
BEGIN
  -- Increment usage count when a shopping list is created from a template
  IF NEW.template_id IS NOT NULL THEN
    UPDATE shopping_list_templates
    SET usage_count = usage_count + 1
    WHERE id = NEW.template_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to increment template usage
CREATE OR REPLACE TRIGGER trigger_increment_template_usage
  AFTER INSERT ON shopping_lists
  FOR EACH ROW
  EXECUTE FUNCTION increment_template_usage();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update updated_at
CREATE OR REPLACE TRIGGER trigger_shopping_lists_updated_at
  BEFORE UPDATE ON shopping_lists
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER trigger_shopping_list_items_updated_at
  BEFORE UPDATE ON shopping_list_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER trigger_shopping_list_templates_updated_at
  BEFORE UPDATE ON shopping_list_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE shopping_lists IS 'Enhanced shopping lists with categories, quantities, and persistence';
COMMENT ON TABLE shopping_list_items IS 'Items in shopping lists with categories and purchase status';
COMMENT ON TABLE shopping_list_templates IS 'Reusable shopping list templates';
COMMENT ON TABLE shopping_list_categories IS 'Categories for organizing shopping list items';

COMMENT ON COLUMN shopping_lists.is_template IS 'Whether this list is used as a template';
COMMENT ON COLUMN shopping_lists.template_category IS 'Category of the template (if is_template = true)';
COMMENT ON COLUMN shopping_lists.total_items IS 'Total number of items in the list';
COMMENT ON COLUMN shopping_lists.completed_items IS 'Number of purchased items';
COMMENT ON COLUMN shopping_lists.meal_plan_id IS 'Link to meal plan if generated from one';
COMMENT ON COLUMN shopping_lists.template_id IS 'Link to template if generated from one';

COMMENT ON COLUMN shopping_list_items.category IS 'Category for organizing items (fruits-vegetables, proteins, etc.)';
COMMENT ON COLUMN shopping_list_items.is_purchased IS 'Whether the item has been purchased';
COMMENT ON COLUMN shopping_list_items.order_index IS 'Order of the item in the list';
COMMENT ON COLUMN shopping_list_items.meal_plan_id IS 'Link to meal plan if item came from one';
COMMENT ON COLUMN shopping_list_items.template_id IS 'Link to template if item came from one';

COMMENT ON COLUMN shopping_list_templates.items IS 'Template items stored as JSON array';
COMMENT ON COLUMN shopping_list_templates.usage_count IS 'Number of times this template has been used';
COMMENT ON COLUMN shopping_list_templates.is_public IS 'Whether this template is shared with other dietitians';
COMMENT ON COLUMN shopping_list_templates.tags IS 'Tags for categorizing and searching templates';

-- Create view for shopping list statistics
CREATE OR REPLACE VIEW shopping_list_stats AS
SELECT 
  sl.id,
  sl.name,
  sl.dietitian_id,
  sl.client_id,
  sl.status,
  sl.total_items,
  sl.completed_items,
  CASE 
    WHEN sl.total_items = 0 THEN 0
    ELSE ROUND((sl.completed_items::float / sl.total_items::float) * 100, 2)
  END as completion_percentage,
  sl.created_at,
  sl.updated_at,
  c.name as client_name,
  COALESCE(mp.name, mpt.name) as source_name
FROM shopping_lists sl
LEFT JOIN clients c ON sl.client_id = c.id
LEFT JOIN meal_plans mp ON sl.meal_plan_id = mp.id
LEFT JOIN meal_plan_templates mpt ON sl.template_id = mpt.id;

-- Create view for category statistics
CREATE OR REPLACE VIEW shopping_category_stats AS
SELECT 
  sli.category,
  slc.name as category_name,
  slc.icon,
  slc.color,
  COUNT(*) as total_items,
  COUNT(*) FILTER (WHERE sli.is_purchased = true) as purchased_items,
  sl.dietitian_id
FROM shopping_list_items sli
JOIN shopping_lists sl ON sli.shopping_list_id = sl.id
LEFT JOIN shopping_list_categories slc ON sli.category = slc.id
GROUP BY sli.category, slc.name, slc.icon, slc.color, sl.dietitian_id;