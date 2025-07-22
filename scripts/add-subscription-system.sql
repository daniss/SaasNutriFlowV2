-- Add subscription fields to dietitians table
ALTER TABLE public.dietitians 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'free' CHECK (subscription_status IN ('free', 'trialing', 'active', 'past_due', 'canceled', 'incomplete', 'incomplete_expired')),
ADD COLUMN IF NOT EXISTS subscription_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS subscription_current_period_end TIMESTAMPTZ;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_dietitians_subscription ON public.dietitians(subscription_status, subscription_plan);
CREATE INDEX IF NOT EXISTS idx_dietitians_stripe_customer ON public.dietitians(stripe_customer_id);

-- Create subscription plans table
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  stripe_price_id TEXT UNIQUE NOT NULL,
  price_monthly DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'eur',
  features JSONB NOT NULL DEFAULT '{}',
  max_clients INTEGER,
  max_meal_plans INTEGER,
  ai_generations_per_month INTEGER,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create subscription events table for audit trail
CREATE TABLE IF NOT EXISTS public.subscription_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dietitian_id UUID REFERENCES public.dietitians(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  stripe_event_id TEXT UNIQUE,
  stripe_subscription_id TEXT,
  previous_status TEXT,
  new_status TEXT,
  previous_plan TEXT,
  new_plan TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for subscription events
CREATE INDEX IF NOT EXISTS idx_subscription_events_dietitian ON public.subscription_events(dietitian_id);
CREATE INDEX IF NOT EXISTS idx_subscription_events_stripe ON public.subscription_events(stripe_event_id);
CREATE INDEX IF NOT EXISTS idx_subscription_events_created ON public.subscription_events(created_at DESC);

-- Insert default subscription plans
INSERT INTO public.subscription_plans (name, display_name, stripe_price_id, price_monthly, features, max_clients, max_meal_plans, ai_generations_per_month, sort_order)
VALUES 
  ('free', 'Gratuit', 'free', 0, '{
    "client_management": true,
    "meal_plans": true,
    "document_storage": true,
    "messaging": true,
    "support": "community"
  }', 3, 5, 0, 0),
  ('starter', 'Starter', 'price_starter_monthly', 29.90, '{
    "client_management": true,
    "meal_plans": true,
    "document_storage": true,
    "messaging": true,
    "ai_meal_plans": true,
    "email_support": true,
    "support": "email"
  }', 25, 50, 20, 1),
  ('professional', 'Professional', 'price_professional_monthly', 59.90, '{
    "client_management": true,
    "meal_plans": true,
    "document_storage": true,
    "messaging": true,
    "ai_meal_plans": true,
    "email_support": true,
    "priority_support": true,
    "api_access": true,
    "custom_branding": true,
    "support": "priority"
  }', -1, -1, 100, 2)
ON CONFLICT (stripe_price_id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  price_monthly = EXCLUDED.price_monthly,
  features = EXCLUDED.features,
  max_clients = EXCLUDED.max_clients,
  max_meal_plans = EXCLUDED.max_meal_plans,
  ai_generations_per_month = EXCLUDED.ai_generations_per_month,
  updated_at = NOW();

-- RLS Policies for subscription plans (public read)
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active subscription plans" ON public.subscription_plans
  FOR SELECT USING (is_active = true);

-- RLS Policies for subscription events (dietitians can view their own)
ALTER TABLE public.subscription_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dietitians can view own subscription events" ON public.subscription_events
  FOR SELECT USING (
    dietitian_id IN (
      SELECT id FROM public.dietitians WHERE auth_user_id = auth.uid()
    )
  );

-- Function to check subscription limits
CREATE OR REPLACE FUNCTION public.check_subscription_limit(
  p_dietitian_id UUID,
  p_limit_type TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_subscription_plan TEXT;
  v_max_clients INTEGER;
  v_max_meal_plans INTEGER;
  v_current_count INTEGER;
BEGIN
  -- Get current subscription plan
  SELECT subscription_plan INTO v_subscription_plan
  FROM public.dietitians
  WHERE id = p_dietitian_id;

  -- Get plan limits
  IF p_limit_type = 'clients' THEN
    SELECT max_clients INTO v_max_clients
    FROM public.subscription_plans
    WHERE name = v_subscription_plan;
    
    -- -1 means unlimited
    IF v_max_clients = -1 THEN
      RETURN true;
    END IF;
    
    -- Count current clients
    SELECT COUNT(*) INTO v_current_count
    FROM public.clients
    WHERE dietitian_id = p_dietitian_id;
    
    RETURN v_current_count < v_max_clients;
    
  ELSIF p_limit_type = 'meal_plans' THEN
    SELECT max_meal_plans INTO v_max_meal_plans
    FROM public.subscription_plans
    WHERE name = v_subscription_plan;
    
    -- -1 means unlimited
    IF v_max_meal_plans = -1 THEN
      RETURN true;
    END IF;
    
    -- Count current meal plans
    SELECT COUNT(*) INTO v_current_count
    FROM public.meal_plans
    WHERE dietitian_id = p_dietitian_id
    AND created_at > NOW() - INTERVAL '30 days';
    
    RETURN v_current_count < v_max_meal_plans;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log subscription events
CREATE OR REPLACE FUNCTION public.log_subscription_event(
  p_dietitian_id UUID,
  p_event_type TEXT,
  p_stripe_event_id TEXT DEFAULT NULL,
  p_stripe_subscription_id TEXT DEFAULT NULL,
  p_previous_status TEXT DEFAULT NULL,
  p_new_status TEXT DEFAULT NULL,
  p_previous_plan TEXT DEFAULT NULL,
  p_new_plan TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_event_id UUID;
BEGIN
  INSERT INTO public.subscription_events (
    dietitian_id,
    event_type,
    stripe_event_id,
    stripe_subscription_id,
    previous_status,
    new_status,
    previous_plan,
    new_plan,
    metadata
  ) VALUES (
    p_dietitian_id,
    p_event_type,
    p_stripe_event_id,
    p_stripe_subscription_id,
    p_previous_status,
    p_new_status,
    p_previous_plan,
    p_new_plan,
    p_metadata
  ) RETURNING id INTO v_event_id;
  
  RETURN v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create view for subscription analytics
CREATE OR REPLACE VIEW public.subscription_analytics AS
SELECT 
  sp.name as plan_name,
  sp.display_name,
  COUNT(d.id) as subscriber_count,
  SUM(sp.price_monthly) as mrr
FROM public.subscription_plans sp
LEFT JOIN public.dietitians d ON d.subscription_plan = sp.name AND d.subscription_status = 'active'
GROUP BY sp.name, sp.display_name, sp.sort_order
ORDER BY sp.sort_order;

-- Grant permissions
GRANT SELECT ON public.subscription_analytics TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_subscription_limit TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_subscription_event TO authenticated;

COMMENT ON COLUMN public.dietitians.stripe_customer_id IS 'Stripe customer ID for billing';
COMMENT ON COLUMN public.dietitians.subscription_status IS 'Current subscription status from Stripe';
COMMENT ON COLUMN public.dietitians.subscription_id IS 'Stripe subscription ID';
COMMENT ON COLUMN public.dietitians.subscription_plan IS 'Current subscription plan (free, starter, professional)';
COMMENT ON COLUMN public.dietitians.trial_ends_at IS 'When the trial period ends';
COMMENT ON COLUMN public.dietitians.subscription_current_period_end IS 'When the current billing period ends';