-- Template Sharing Network Database Schema
-- Professional template marketplace for nutritionists

-- Table for shared templates (both recipes and meal plans)
CREATE TABLE IF NOT EXISTS shared_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL, -- References either recipe_templates or meal_plan_templates
    template_type VARCHAR(20) NOT NULL CHECK (template_type IN ('recipe', 'meal_plan')),
    author_id UUID NOT NULL, -- The nutritionist who shared the template
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    tags TEXT[], -- Array of tags for better discovery
    difficulty VARCHAR(20) CHECK (difficulty IN ('easy', 'medium', 'hard')),
    prep_time INTEGER, -- In minutes
    servings INTEGER,
    nutritional_info JSONB, -- Structured nutritional information
    sharing_level VARCHAR(20) NOT NULL DEFAULT 'public' CHECK (sharing_level IN ('public', 'professional', 'private')),
    price_credits INTEGER DEFAULT 0, -- Cost in credits to access the template
    download_count INTEGER DEFAULT 0,
    rating_average DECIMAL(3,2) DEFAULT 0.0,
    rating_count INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT false,
    is_approved BOOLEAN DEFAULT true,
    metadata JSONB, -- Additional metadata like dietary restrictions, health conditions
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key constraints
    CONSTRAINT fk_shared_templates_author 
        FOREIGN KEY (author_id) 
        REFERENCES dietitians(id) 
        ON DELETE CASCADE,
    
    -- Indexes for performance
    CREATE INDEX IF NOT EXISTS idx_shared_templates_author ON shared_templates(author_id),
    CREATE INDEX IF NOT EXISTS idx_shared_templates_category ON shared_templates(category),
    CREATE INDEX IF NOT EXISTS idx_shared_templates_type ON shared_templates(template_type),
    CREATE INDEX IF NOT EXISTS idx_shared_templates_rating ON shared_templates(rating_average DESC),
    CREATE INDEX IF NOT EXISTS idx_shared_templates_downloads ON shared_templates(download_count DESC),
    CREATE INDEX IF NOT EXISTS idx_shared_templates_featured ON shared_templates(is_featured) WHERE is_featured = true,
    CREATE INDEX IF NOT EXISTS idx_shared_templates_tags ON shared_templates USING GIN(tags)
);

-- Table for template ratings and reviews
CREATE TABLE IF NOT EXISTS template_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shared_template_id UUID NOT NULL,
    reviewer_id UUID NOT NULL, -- The nutritionist who reviewed the template
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    is_verified_purchase BOOLEAN DEFAULT false,
    helpfulness_score INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key constraints
    CONSTRAINT fk_template_reviews_shared_template 
        FOREIGN KEY (shared_template_id) 
        REFERENCES shared_templates(id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_template_reviews_reviewer 
        FOREIGN KEY (reviewer_id) 
        REFERENCES dietitians(id) 
        ON DELETE CASCADE,
    
    -- Prevent duplicate reviews from same reviewer
    UNIQUE(shared_template_id, reviewer_id)
);

-- Table for template purchases/downloads
CREATE TABLE IF NOT EXISTS template_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shared_template_id UUID NOT NULL,
    buyer_id UUID NOT NULL, -- The nutritionist who purchased/downloaded the template
    purchase_type VARCHAR(20) NOT NULL CHECK (purchase_type IN ('free', 'credits', 'subscription')),
    credits_spent INTEGER DEFAULT 0,
    download_url TEXT, -- Temporary download URL
    download_expires_at TIMESTAMP WITH TIME ZONE,
    downloaded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key constraints
    CONSTRAINT fk_template_purchases_shared_template 
        FOREIGN KEY (shared_template_id) 
        REFERENCES shared_templates(id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_template_purchases_buyer 
        FOREIGN KEY (buyer_id) 
        REFERENCES dietitians(id) 
        ON DELETE CASCADE,
    
    -- Prevent duplicate purchases
    UNIQUE(shared_template_id, buyer_id)
);

-- Table for template collections/favorites
CREATE TABLE IF NOT EXISTS template_collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dietitian_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key constraints
    CONSTRAINT fk_template_collections_dietitian 
        FOREIGN KEY (dietitian_id) 
        REFERENCES dietitians(id) 
        ON DELETE CASCADE
);

-- Junction table for templates in collections
CREATE TABLE IF NOT EXISTS collection_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collection_id UUID NOT NULL,
    shared_template_id UUID NOT NULL,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key constraints
    CONSTRAINT fk_collection_templates_collection 
        FOREIGN KEY (collection_id) 
        REFERENCES template_collections(id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_collection_templates_shared_template 
        FOREIGN KEY (shared_template_id) 
        REFERENCES shared_templates(id) 
        ON DELETE CASCADE,
    
    -- Prevent duplicate templates in same collection
    UNIQUE(collection_id, shared_template_id)
);

-- Table for nutritionist credits system
CREATE TABLE IF NOT EXISTS dietitian_credits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dietitian_id UUID NOT NULL,
    credits_balance INTEGER DEFAULT 0,
    total_earned INTEGER DEFAULT 0,
    total_spent INTEGER DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key constraints
    CONSTRAINT fk_dietitian_credits_dietitian 
        FOREIGN KEY (dietitian_id) 
        REFERENCES dietitians(id) 
        ON DELETE CASCADE,
    
    -- Ensure only one record per dietitian
    UNIQUE(dietitian_id)
);

-- Table for credit transactions
CREATE TABLE IF NOT EXISTS credit_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dietitian_id UUID NOT NULL,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('earn', 'spend', 'refund', 'bonus')),
    amount INTEGER NOT NULL,
    description TEXT,
    reference_id UUID, -- Could reference template_purchases, shared_templates, etc.
    reference_type VARCHAR(50), -- 'purchase', 'template_share', 'bonus', etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key constraints
    CONSTRAINT fk_credit_transactions_dietitian 
        FOREIGN KEY (dietitian_id) 
        REFERENCES dietitians(id) 
        ON DELETE CASCADE
);

-- Row Level Security Policies
ALTER TABLE shared_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE dietitian_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- Policies for shared_templates
CREATE POLICY "Anyone can view public shared templates" ON shared_templates
    FOR SELECT USING (sharing_level = 'public' AND is_approved = true);

CREATE POLICY "Nutritionists can view professional shared templates" ON shared_templates
    FOR SELECT USING (sharing_level IN ('public', 'professional') AND is_approved = true);

CREATE POLICY "Authors can manage their own shared templates" ON shared_templates
    FOR ALL USING (author_id = auth.uid());

-- Policies for template_reviews
CREATE POLICY "Anyone can view approved reviews" ON template_reviews
    FOR SELECT USING (true);

CREATE POLICY "Nutritionists can create reviews" ON template_reviews
    FOR INSERT WITH CHECK (reviewer_id = auth.uid());

CREATE POLICY "Reviewers can update their own reviews" ON template_reviews
    FOR UPDATE USING (reviewer_id = auth.uid());

-- Policies for template_purchases
CREATE POLICY "Users can view their own purchases" ON template_purchases
    FOR SELECT USING (buyer_id = auth.uid());

CREATE POLICY "Users can create purchases" ON template_purchases
    FOR INSERT WITH CHECK (buyer_id = auth.uid());

-- Policies for template_collections
CREATE POLICY "Users can view public collections and their own" ON template_collections
    FOR SELECT USING (is_public = true OR dietitian_id = auth.uid());

CREATE POLICY "Users can manage their own collections" ON template_collections
    FOR ALL USING (dietitian_id = auth.uid());

-- Policies for collection_templates
CREATE POLICY "Users can view collection templates based on collection access" ON collection_templates
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM template_collections 
            WHERE id = collection_id 
            AND (is_public = true OR dietitian_id = auth.uid())
        )
    );

CREATE POLICY "Users can manage their own collection templates" ON collection_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM template_collections 
            WHERE id = collection_id 
            AND dietitian_id = auth.uid()
        )
    );

-- Policies for dietitian_credits
CREATE POLICY "Users can view their own credits" ON dietitian_credits
    FOR SELECT USING (dietitian_id = auth.uid());

CREATE POLICY "Users can update their own credits" ON dietitian_credits
    FOR UPDATE USING (dietitian_id = auth.uid());

-- Policies for credit_transactions
CREATE POLICY "Users can view their own transactions" ON credit_transactions
    FOR SELECT USING (dietitian_id = auth.uid());

-- Functions for updating template ratings
CREATE OR REPLACE FUNCTION update_template_rating()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the average rating and count for the shared template
    UPDATE shared_templates
    SET 
        rating_average = (
            SELECT AVG(rating)::DECIMAL(3,2) 
            FROM template_reviews 
            WHERE shared_template_id = COALESCE(NEW.shared_template_id, OLD.shared_template_id)
        ),
        rating_count = (
            SELECT COUNT(*) 
            FROM template_reviews 
            WHERE shared_template_id = COALESCE(NEW.shared_template_id, OLD.shared_template_id)
        ),
        updated_at = NOW()
    WHERE id = COALESCE(NEW.shared_template_id, OLD.shared_template_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Triggers for updating template ratings
CREATE TRIGGER update_template_rating_trigger
    AFTER INSERT OR UPDATE OR DELETE ON template_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_template_rating();

-- Function for updating download count
CREATE OR REPLACE FUNCTION update_download_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the download count when a template is downloaded
    IF NEW.downloaded_at IS NOT NULL AND OLD.downloaded_at IS NULL THEN
        UPDATE shared_templates
        SET 
            download_count = download_count + 1,
            updated_at = NOW()
        WHERE id = NEW.shared_template_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updating download count
CREATE TRIGGER update_download_count_trigger
    AFTER UPDATE ON template_purchases
    FOR EACH ROW
    EXECUTE FUNCTION update_download_count();

-- Function for managing credit transactions
CREATE OR REPLACE FUNCTION process_credit_transaction()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the dietitian's credit balance
    INSERT INTO dietitian_credits (dietitian_id, credits_balance, total_earned, total_spent)
    VALUES (
        NEW.dietitian_id,
        CASE 
            WHEN NEW.transaction_type IN ('earn', 'bonus', 'refund') THEN NEW.amount
            ELSE -NEW.amount
        END,
        CASE 
            WHEN NEW.transaction_type IN ('earn', 'bonus', 'refund') THEN NEW.amount
            ELSE 0
        END,
        CASE 
            WHEN NEW.transaction_type = 'spend' THEN NEW.amount
            ELSE 0
        END
    )
    ON CONFLICT (dietitian_id) DO UPDATE SET
        credits_balance = dietitian_credits.credits_balance + 
            CASE 
                WHEN NEW.transaction_type IN ('earn', 'bonus', 'refund') THEN NEW.amount
                ELSE -NEW.amount
            END,
        total_earned = dietitian_credits.total_earned + 
            CASE 
                WHEN NEW.transaction_type IN ('earn', 'bonus', 'refund') THEN NEW.amount
                ELSE 0
            END,
        total_spent = dietitian_credits.total_spent + 
            CASE 
                WHEN NEW.transaction_type = 'spend' THEN NEW.amount
                ELSE 0
            END,
        last_updated = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for processing credit transactions
CREATE TRIGGER process_credit_transaction_trigger
    AFTER INSERT ON credit_transactions
    FOR EACH ROW
    EXECUTE FUNCTION process_credit_transaction();

-- Initial data setup
-- Give all existing nutritionists some initial credits
INSERT INTO dietitian_credits (dietitian_id, credits_balance, total_earned)
SELECT id, 100, 100 FROM dietitians
ON CONFLICT (dietitian_id) DO NOTHING;

-- Add some sample shared templates (you can customize these)
-- This would typically be done through the application interface