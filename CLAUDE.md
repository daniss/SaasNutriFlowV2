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
- Two-factor authentication is implemented for nutritionists (TOTP-based)
- `/dashboard/*` routes are protected by middleware

## Commands

```bash
# Development
npm run dev          # Start development server with Turbo
npm run dev:webpack  # Start development server with Webpack (fallback)
npm run build        # Production build
npm run start        # Start production server
npm run type-check   # TypeScript validation
npm run lint         # ESLint checking

# Testing
npm test             # Run Jest tests
npm run test:watch   # Run Jest tests in watch mode
npm run test:coverage # Run Jest tests with coverage report (70% threshold)

# Database
# Use Supabase dashboard or scripts in /scripts directory for migrations
# Run specific test: npm test -- --testPathPattern="specific-test-name"
```

## Architecture

### Tech Stack
- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **Supabase** (PostgreSQL, Auth, Storage, Realtime)
- **Tailwind CSS** + **shadcn/ui** components
- **React Hook Form** + **Zod** validation
- **Google Gemini AI** for meal plans
- **Stripe** for payments
- **bcryptjs** for client password hashing
- **jsPDF** for PDF generation
- **Recharts** for data visualization

### Directory Structure
```
app/              # Next.js App Router pages
├── api/          # API routes (multi-tenant secure)
├── dashboard/    # Protected nutritionist pages
├── client-portal/# Client authentication & pages
├── login/        # Authentication pages
└── globals.css   # Global styles

components/       # React components
├── ui/          # shadcn/ui base components
├── auth/        # Authentication components (dual system)
├── dashboard/   # Dashboard features
├── templates/   # Reusable templates (recipes, meal plans)
└── shared/      # Shared components

lib/             # Utilities and services
├── supabase/    # Database clients (client.ts, server.ts)
├── supabase.ts  # Main database types & exports
├── gemini.ts    # AI meal plan generation
├── payment-service.ts # Stripe integration
├── client-auth-security.ts # Client authentication
└── *.ts         # Other service files

hooks/           # Custom React hooks
scripts/         # SQL migrations and database setup
__tests__/       # Jest tests with 70% coverage threshold
middleware.ts    # Route protection & auth handling
```

### Core Architecture Patterns

#### Multi-Tenant Data Model
- **Dietitians**: Primary tenant entities (Row Level Security anchor)
- **Clients**: Belong to dietitians, isolated by `dietitian_id`
- **All data**: Filtered by `dietitian_id` in queries and RLS policies
- **Templates**: Reusable meal plan/recipe structures per dietitian

#### Authentication Architecture
```typescript
// Dual authentication system
Nutritionists: Supabase Auth → AuthProviderNew → useAuth()
Clients: Custom JWT → ClientAuthProvider → useClientAuth()
```

#### Database Layer
- **Supabase Client**: `/lib/supabase/client.ts` (client-side)
- **Supabase Server**: `/lib/supabase/server.ts` (server-side)
- **Type Safety**: Generated TypeScript types in `/lib/supabase.ts`
- **RLS Policies**: Enforce tenant isolation at database level

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
// Standard nutritionist API pattern
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Get dietitian_id for tenant isolation
    const { data: dietitian } = await supabase
      .from('dietitians')
      .select('id')
      .eq('auth_user_id', user.id)
      .single()
    
    if (!dietitian) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Your logic here with dietitian.id filter
    
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// Client API pattern (uses custom authentication)
export async function POST(request: Request) {
  try {
    const authResult = await validateClientAuth(request)
    
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }
    
    const { clientId } = authResult
    
    // Your logic here with clientId filter
    
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Client API Error:', error)
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

## Key Features & Business Logic

### Meal Planning System
- **AI Generation**: `/dashboard/meal-plans/generate` - Advanced AI meal planning with Google Gemini
- **Template System**: Reusable meal plan and recipe templates per dietitian
- **Three-Tier Structure**: Plans → Recipes → Templates (for efficiency and consistency)
- **PDF Export**: Professional meal plan exports with nutritional analysis

### Client Management
- **Dual Portal System**: Nutritionist dashboard + separate client portal
- **Progress Tracking**: Weight, measurements, photos with visual charts
- **Document Management**: File upload with visibility controls
- **GDPR Compliance**: Data export, deletion, and consent management

### Authentication Security
- **Password Hashing**: bcryptjs with salt for client accounts
- **Session Management**: Secure HMAC tokens with expiration
- **Rate Limiting**: Prevents brute force attacks
- **Two-Factor Auth**: TOTP-based 2FA for nutritionists

### Database Security
- **Row Level Security**: All tables have RLS policies
- **Multi-Tenant Isolation**: Every query filters by `dietitian_id`
- **Service Role Protection**: Limited use with proper validation
- **Data Encryption**: Sensitive data properly encrypted

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=          # Used sparingly, bypasses RLS
CLIENT_AUTH_SECRET=                 # For client JWT tokens (must be set)
GOOGLE_GEMINI_API_KEY=             # For AI meal plan generation
STRIPE_SECRET_KEY=                 # For payment processing
STRIPE_WEBHOOK_SECRET=             # For payment webhooks
```

## Common Tasks

### Adding a New Feature
1. Create feature folder in `/components`
2. Add route in `/app/dashboard` or `/app/client-portal`
3. Update navigation in `DashboardNav`
4. Add database tables with RLS policies
5. Create API routes with proper authentication
6. Add tests in `__tests__` (maintain 70% coverage)
7. Update TypeScript types in `/lib/supabase.ts`

### Database Changes
1. Create SQL script in `/scripts`
2. Apply via Supabase dashboard
3. Update TypeScript types in `/lib/supabase.ts`
4. Test RLS policies thoroughly
5. Verify tenant isolation works correctly

### Security Considerations
- **Client Authentication**: Use `validateClientAuth()` for client APIs
- **Password Handling**: Always use `hashPassword()` and `comparePassword()`
- **Environment Variables**: Never expose service role key to client
- **Input Validation**: Use Zod schemas for all inputs
- **Error Handling**: Don't expose internal error details

### Deployment
- Automated via Vercel
- Environment variables in Vercel dashboard
- Database migrations via Supabase dashboard
- Monitor for RLS policy violations

## Workflow Guidelines

### Confirmation Before Commit
**IMPORTANT**: Always follow this workflow when completing tasks:

1. **Complete the requested work** (implement features, fix bugs, etc.)
2. **Summarize what was accomplished** with a clear list of:
   - New functionality added
   - Changes made to existing features
   - Files modified or created
   - Any breaking changes or important notes
3. **Ask for confirmation** with "Is this OK?" or similar
4. **Wait for user approval** (user responds with "ok", "yes", "looks good", etc.)
5. **Only then commit and push** the changes

**Example workflow:**
```
✅ Completed: Added user authentication system
- New login/signup pages with validation
- JWT token management
- Protected route middleware
- Updated 3 components, created 2 new files

Is this OK to commit and push?
```

This ensures no changes are committed without explicit approval and gives the user a chance to request modifications before finalizing the work.