# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NutriFlow is a production-ready SaaS platform for French dietitian-nutritionists. It provides comprehensive practice management with CRM capabilities, client portal, appointment scheduling, meal planning, and health data tracking.

## Critical Security Rules

### Multi-Tenant Data Isolation
- **EVERY** database query must filter by `dietitian_id`
- Never expose data across tenant boundaries
- Use Row Level Security (RLS) on all tables
- Service role should only be used for specific admin operations

### Authentication System
- **Dual authentication**: Nutritionists use `AuthProviderNew`/`useAuth()`, Clients use `ClientAuthProvider`/`useClientAuth()`
- Never mix authentication contexts
- Two-factor authentication is implemented for nutritionists (email-based)
- `/dashboard/*` routes are protected by middleware

## Commands

```bash
# Development
npm run dev          # Start development server with Turbo
npm run build        # Production build
npm test             # Run Jest tests
npm run type-check   # TypeScript validation
npm run lint         # ESLint checking

# Database
# Use Supabase dashboard or scripts in /scripts directory for migrations
```

## Architecture

### Tech Stack
- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **Supabase** (PostgreSQL, Auth, Storage, Realtime)
- **Tailwind CSS** + **shadcn/ui** components
- **React Hook Form** + **Zod** validation
- **Google Gemini AI** for meal plans
- **Stripe** for payments

### Directory Structure
```
app/              # Next.js App Router pages
├── api/          # API routes
├── dashboard/    # Protected nutritionist pages
└── client-portal/# Client authentication & pages

components/       # React components
├── ui/          # shadcn/ui base components
├── auth/        # Authentication components
├── dashboard/   # Dashboard features
└── templates/   # Reusable templates

lib/             # Utilities and services
├── supabase/    # Database clients
└── *.ts         # Service files

hooks/           # Custom React hooks
scripts/         # SQL migrations
__tests__/       # Jest tests
```

## Development Guidelines

### Database Operations
1. Always include `dietitian_id` in queries
2. Use proper error handling with try-catch
3. Return typed responses from API routes
4. Use transactions for multi-table operations
5. Implement proper RLS policies

### Component Development
1. Use shadcn/ui components as base
2. Follow CVA patterns for variants
3. Implement loading and error states
4. Use French labels with English code/comments
5. Ensure mobile responsiveness

### API Routes
```typescript
// Standard pattern
export async function POST(request: Request) {
  try {
    const supabase = createServerComponentClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Get dietitian_id
    const { data: profile } = await supabase
      .from('dietitians')
      .select('id')
      .eq('auth_user_id', user.id)
      .single()
    
    // Your logic here with dietitian_id filter
    
    return NextResponse.json({ success: true, data })
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
```

## UI/UX Standards

- **Primary Colors**: Emerald/Teal (#10b981)
- **Font**: Inter
- **Language**: French UI, English code
- **Notifications**: Use Sonner toasts
- **Forms**: React Hook Form + Zod validation
- **Tables**: DataTable component with sorting/filtering
- **Modals**: Dialog component from shadcn/ui

## Feature Implementation

### Client Management
- Comprehensive profiles with medical history
- GDPR-compliant data handling
- Document visibility controls
- Real-time updates via Supabase

### Meal Plans
- AI-generated using Google Gemini
- PDF export functionality
- Recipe templates system
- Nutritional analysis (being enhanced)

### Documents
- File upload to Supabase Storage
- Visibility controls (private/shared)
- Automatic PDF conversion for images
- Client portal access

### Messaging
- Real-time chat using Supabase Realtime
- Unread message indicators
- File attachments support

### GDPR Compliance
- Mandatory consent management
- Data retention policies
- Export/deletion capabilities
- Comprehensive audit logging

## Testing & Quality

```bash
# Run tests
npm test

# Type checking
npm run type-check

# Linting
npm run lint

# Before committing
npm run type-check && npm run lint && npm test
```

## Important Don'ts

1. **Never** expose `SUPABASE_SERVICE_ROLE_KEY` to client
2. **Never** query without `dietitian_id` filter
3. **Never** mix client and nutritionist auth contexts
4. **Never** store sensitive data in localStorage
5. **Never** bypass RLS policies
6. **Never** commit .env files

## Recent Updates

- Production deployment completed (January 2025)
- Two-factor authentication implemented
- Client portal with separate auth
- GDPR compliance features
- French foods database integration (ANSES-CIQUAL)
- Weight tracking with visualizations
- Progress photo management

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GOOGLE_GEMINI_API_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

## Common Tasks

### Adding a New Feature
1. Create feature folder in `/components`
2. Add route in `/app/dashboard`
3. Update navigation in `DashboardNav`
4. Add database tables with RLS
5. Create API routes if needed
6. Add tests in `__tests__`

### Database Changes
1. Create SQL script in `/scripts`
2. Apply via Supabase dashboard
3. Update TypeScript types
4. Test RLS policies

### Deployment
- Automated via Vercel
- Environment variables in Vercel dashboard
- Database migrations via Supabase dashboard