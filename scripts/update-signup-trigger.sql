-- Update the handle_new_user function to create both profiles and dietitians records
-- This ensures every new signup automatically gets both records

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
  
  -- Create dietitian record with data from user metadata
  INSERT INTO public.dietitians (
    auth_user_id,
    email,
    first_name,
    last_name,
    phone,
    address,
    subscription_status,
    subscription_plan,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',   -- Fixed: using snake_case from signup form
    NEW.raw_user_meta_data->>'last_name',    -- Fixed: using snake_case from signup form
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'address',
    'free',
    'free',
    NOW(),
    NOW()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: The trigger on_auth_user_created already exists and will use this updated function