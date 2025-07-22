# 🚀 NutriFlow Subscription System Setup Guide

This guide walks you through setting up the complete subscription system for NutriFlow, including Stripe integration, database configuration, and environment setup.

## 📋 Prerequisites

- Supabase project configured
- Stripe account (test/production)
- Node.js 18+ installed
- NutriFlow codebase deployed

## 🔧 Environment Variables

Add these variables to your `.env.local` file:

### Required Stripe Variables
```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...                    # Your Stripe secret key
STRIPE_PUBLIC_KEY=pk_test_...                    # Your Stripe public key (optional for server-side)
STRIPE_WEBHOOK_SECRET=whsec_...                  # Webhook endpoint secret from Stripe
```

### Base URL (Important for Redirects)
```env
NEXT_PUBLIC_BASE_URL=http://localhost:3000       # Your app's base URL
```

### Existing Variables (ensure these are set)
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Client Authentication
CLIENT_AUTH_SECRET=your-secure-random-secret      # For client JWT tokens

# AI Integration
GOOGLE_GEMINI_API_KEY=your-gemini-api-key
```

## 💳 Stripe Setup

### 1. Create Stripe Account & Get Keys
1. Sign up at [stripe.com](https://stripe.com)
2. Get your API keys from the Developers section
3. Start in test mode, switch to live mode when ready

### 2. Create Products & Prices in Stripe
Create these products in your Stripe dashboard:

#### Starter Plan
- **Product Name**: NutriFlow Starter
- **Price**: €29.90/month
- **Price ID**: `price_starter_monthly` (set this as the Price ID)
- **Recurring**: Monthly

#### Professional Plan  
- **Product Name**: NutriFlow Professional
- **Price**: €59.90/month
- **Price ID**: `price_professional_monthly` (set this as the Price ID)
- **Recurring**: Monthly

### 3. Configure Stripe Billing Portal
1. Go to Stripe Dashboard → Settings → Billing → Customer Portal
2. Enable customer portal
3. Configure allowed actions:
   - ✅ Update payment methods
   - ✅ View invoices
   - ✅ Cancel subscriptions
   - ❌ Update subscriptions (prevent plan changes outside your app)

### 4. Set Up Webhooks
1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://yourapp.com/api/subscription/webhook`
3. Select these events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.trial_will_end`
4. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

## 🗄️ Database Setup

The database migration has been applied and includes:

### New Tables
- ✅ `subscription_plans` - Available subscription plans
- ✅ `subscription_events` - Audit trail for subscription changes

### Updated Tables  
- ✅ `dietitians` table extended with subscription fields:
  - `stripe_customer_id`
  - `subscription_status` 
  - `subscription_plan`
  - `subscription_id`
  - `trial_ends_at`
  - `subscription_current_period_end`
  - etc.

### Functions
- ✅ `check_subscription_limit()` - Check usage limits
- ✅ `log_subscription_event()` - Log subscription changes

### Sample Data
Default subscription plans have been seeded:
- **Free**: 3 clients, 5 meal plans/month, community support
- **Starter**: 25 clients, 50 meal plans/month, 20 AI generations, email support  
- **Professional**: Unlimited clients & meal plans, 100 AI generations, priority support

## 🚀 Deployment Steps

### 1. Install Dependencies
```bash
npm install
# New packages added: canvas-confetti
```

### 2. Update Stripe Price IDs
If your Stripe price IDs differ from the defaults, update them in the database:

```sql
UPDATE subscription_plans 
SET stripe_price_id = 'your_actual_starter_price_id'
WHERE name = 'starter';

UPDATE subscription_plans 
SET stripe_price_id = 'your_actual_professional_price_id' 
WHERE name = 'professional';
```

### 3. Test the Integration

#### Test Checkout Flow
1. Navigate to `/pricing`
2. Click "Commencer l'essai gratuit" on Starter plan
3. Complete Stripe checkout with test card: `4242 4242 4242 4242`
4. Verify redirect to `/dashboard/subscription/success`
5. Check subscription status in dashboard

#### Test Webhooks
Use Stripe CLI to forward webhooks to localhost:
```bash
stripe listen --forward-to localhost:3000/api/subscription/webhook
```

#### Test Feature Gating
1. Try accessing `/dashboard/meal-plans/generate` without subscription
2. Should redirect to `/dashboard/upgrade`
3. Subscribe and try again - should have access

## 🔒 Security Checklist

- ✅ Webhook signature verification implemented
- ✅ Row Level Security (RLS) policies active
- ✅ Service role key not exposed to client
- ✅ Subscription status validation in middleware
- ✅ Multi-tenant data isolation preserved

## 📱 User Journey

### Free User → Pro Subscriber
1. **Discovery**: User hits limit or sees upgrade prompts
2. **Pricing**: Views `/pricing` page with plan comparison
3. **Checkout**: Stripe Checkout with 14-day trial
4. **Success**: `/dashboard/subscription/success` with onboarding
5. **Access**: Pro features unlocked, middleware enforces access
6. **Management**: Can manage subscription via billing portal

### Pro Features Available
- 🤖 AI meal plan generation (`/dashboard/meal-plans/generate`)
- 📊 Advanced analytics (`/dashboard/analytics`)
- 🔧 API access (`/dashboard/api`)
- 🎨 Custom branding (`/dashboard/branding`)
- 👥 Unlimited clients (Starter: 25, Pro: unlimited)
- 📋 Unlimited meal plans

## 🎛️ Admin Features

### Subscription Analytics
Query subscription metrics:
```sql
SELECT * FROM subscription_analytics;
```

### Manual Subscription Management
```sql
-- Update a user's subscription
UPDATE dietitians 
SET subscription_status = 'active',
    subscription_plan = 'professional'
WHERE email = 'user@example.com';
```

## 🐛 Troubleshooting

### Common Issues

#### Webhook Not Receiving Events
- Check webhook URL is correct and accessible
- Verify webhook secret matches Stripe dashboard
- Check server logs for webhook errors

#### Checkout Session Fails
- Verify Stripe keys are correct
- Check price IDs match between database and Stripe
- Ensure customer creation is working

#### Users Can't Access Pro Features  
- Check subscription status in database
- Verify middleware is working
- Check RLS policies aren't blocking access

#### Database Issues
```sql
-- Check subscription events
SELECT * FROM subscription_events 
WHERE dietitian_id = 'user-id' 
ORDER BY created_at DESC;

-- Verify plan limits
SELECT * FROM subscription_plans WHERE is_active = true;
```

## 📞 Support

### For Development Issues
- Check server logs for error details
- Use Stripe Dashboard logs for payment issues
- Review Supabase logs for database problems

### For Business Questions
- Monitor subscription metrics via `subscription_analytics` view
- Track user conversion in `subscription_events` table
- Use Stripe Dashboard for revenue analytics

## 🎉 What's Included

### ✅ Complete Implementation
- Payment processing with Stripe
- Subscription management
- Webhook handling  
- Feature gating & access control
- Usage tracking & limits
- Trial period management
- Billing portal integration
- Comprehensive UI components

### ✅ Pages & Components
- `/pricing` - Public pricing page
- `/dashboard/upgrade` - Upgrade prompts
- `/dashboard/subscription/success` - Post-checkout success
- Subscription status widgets
- Upgrade prompt components
- Feature limit notifications

### ✅ API Routes
- `/api/subscription/create-checkout` - Create Stripe checkout
- `/api/subscription/portal` - Billing portal access
- `/api/subscription/webhook` - Handle Stripe webhooks
- `/api/subscription/status` - Get subscription data
- `/api/subscription/plans` - List available plans
- `/api/subscription/usage` - Check usage limits

The subscription system is now fully operational! 🚀