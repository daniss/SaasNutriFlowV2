-- Remove free plan and implement mandatory 2-week trial system
-- All users must subscribe to paid plans after trial period

-- 1. Deactivate the free plan
UPDATE public.subscription_plans 
SET is_active = false, updated_at = NOW()
WHERE name = 'free';

-- 2. Update existing free users to trialing status with 2-week trial
-- Set trial_ends_at to 2 weeks from now for existing free users
UPDATE public.dietitians 
SET 
  subscription_status = 'trialing',
  subscription_plan = 'starter', -- Default to starter plan during trial
  trial_ends_at = NOW() + INTERVAL '14 days',
  updated_at = NOW()
WHERE 
  subscription_status = 'free' 
  AND subscription_plan = 'free'
  AND trial_ends_at IS NULL;

-- 3. Update the signup trigger to start users on trial instead of free
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile record
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name'
  );
  
  -- Create dietitian record with 2-week trial
  INSERT INTO public.dietitians (
    auth_user_id,
    email,
    first_name,
    last_name,
    phone,
    address,
    subscription_status,
    subscription_plan,
    trial_ends_at,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'firstName',
    NEW.raw_user_meta_data->>'lastName',
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'address',
    'trialing',
    'starter', -- Default trial plan
    NOW() + INTERVAL '14 days', -- 2-week trial
    NOW(),
    NOW()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Update subscription status constraints to remove 'free' option
ALTER TABLE public.dietitians 
DROP CONSTRAINT IF EXISTS dietitians_subscription_status_check;

ALTER TABLE public.dietitians 
ADD CONSTRAINT dietitians_subscription_status_check 
CHECK (subscription_status IN ('trialing', 'active', 'past_due', 'canceled', 'incomplete', 'incomplete_expired'));

-- 5. Create function to check if trial has expired
CREATE OR REPLACE FUNCTION public.is_trial_expired(p_dietitian_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_trial_ends_at TIMESTAMPTZ;
  v_subscription_status TEXT;
BEGIN
  SELECT trial_ends_at, subscription_status
  INTO v_trial_ends_at, v_subscription_status
  FROM public.dietitians
  WHERE id = p_dietitian_id;
  
  -- If not trialing, return false (not applicable)
  IF v_subscription_status != 'trialing' THEN
    RETURN false;
  END IF;
  
  -- Check if trial has expired
  RETURN v_trial_ends_at IS NOT NULL AND v_trial_ends_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;