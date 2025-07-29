# CLAUDE.md

**NutriFlow** - Production SaaS Platform for French Dietitian-Nutritionists  
*Comprehensive AI Agent Development Guide*

---

## 🎯 Project Overview

NutriFlow is a production-ready, multi-tenant SaaS platform designed specifically for French dietitian-nutritionists. It provides comprehensive practice management with advanced CRM capabilities, client portal access, AI-powered meal planning, appointment scheduling, real-time messaging, document management, and GDPR-compliant health data tracking.

**Target Market**: French healthcare professionals (dietitians, nutritionists)  
**Architecture**: Multi-tenant B2B SaaS with client portal functionality  
**Compliance**: GDPR-compliant with comprehensive audit logging  

---

## 🛡️ CRITICAL SECURITY IMPERATIVES

### Multi-Tenant Data Isolation (MANDATORY)
```typescript
// ⚠️ EVERY database query MUST include dietitian_id filter
const { data } = await supabase
  .from('table_name')
  .select('*')
  .eq('dietitian_id', dietitianId) // ← REQUIRED FOR ALL QUERIES
```

**Security Rules:**
- **NEVER** expose data across tenant boundaries
- **ALWAYS** filter by `dietitian_id` in database queries
- **VERIFY** Row Level Security (RLS) policies on all tables
- **LIMIT** service role usage to specific admin operations only
- **VALIDATE** user permissions before any data operation

### Dual Authentication Architecture
```typescript
// Nutritionists: Supabase Auth + 2FA (TOTP)
AuthProviderNew → useAuth() → Two-factor verification

// Clients: Custom JWT + HMAC-SHA256
ClientAuthProvider → useClientAuth() → Secure token validation
```

**Authentication Rules:**
- **NEVER** mix nutritionist and client auth contexts
- **ALWAYS** use appropriate auth provider for each user type
- **ENFORCE** 2FA for all nutritionist accounts
- **VALIDATE** JWT tokens with HMAC verification for clients

---

## 🏗️ Technology Stack & Architecture

### Core Technologies
| Category | Technology | Version | Purpose |
|----------|------------|---------|---------|
| **Framework** | Next.js | 15.2.4 | App Router, SSR, API routes |
| **Runtime** | React | 19 | UI components, state management |
| **Language** | TypeScript | 5 | Type safety, developer experience |
| **Database** | Supabase | Latest | PostgreSQL, real-time, auth |
| **Styling** | Tailwind CSS | 3.4.17 | Utility-first CSS framework |
| **Components** | Radix UI + shadcn/ui | Latest | Accessible component library |
| **Forms** | React Hook Form + Zod | 7.54.1 + 3.24.1 | Form validation, type safety |
| **AI** | Google Gemini | Latest | Meal plan generation |
| **Payments** | Stripe | Latest | Subscription management |
| **Testing** | Jest + Testing Library | 29.7.0 | Unit/integration testing |

### Architecture Patterns
- **Multi-tenant SaaS** with tenant isolation at database level
- **Component-driven development** with shadcn/ui patterns
- **Server-side rendering** with Next.js App Router
- **Type-driven development** with Zod runtime validation
- **Security-first design** with comprehensive input validation

---

## 📁 Project Structure

```
├── app/                          # Next.js App Router
│   ├── api/                      # API routes (multi-tenant secure)
│   ├── dashboard/                # Nutritionist protected routes
│   ├── client-portal/            # Client authentication & portal
│   ├── auth/                     # Authentication pages
│   └── globals.css               # Global Tailwind styles
├── components/                   # React components
│   ├── ui/                       # shadcn/ui base components (20+)
│   ├── auth/                     # Dual authentication system
│   ├── dashboard/                # Dashboard-specific features
│   ├── templates/                # Reusable templates system
│   ├── shared/                   # Cross-cutting components
│   └── client-portal/            # Client-specific components
├── lib/                          # Utilities and services
│   ├── supabase/                 # Database clients (client/server)
│   ├── supabase.ts               # Generated TypeScript types
│   ├── security-validation.ts    # Input validation & sanitization
│   ├── client-auth-security.ts   # Client authentication utilities
│   ├── gemini.ts                 # AI meal plan generation
│   └── payment-service.ts        # Stripe integration
├── hooks/                        # Custom React hooks
├── scripts/                      # Database migrations & setup
├── __tests__/                    # Jest tests (70% coverage)
└── middleware.ts                 # Route protection & auth
```

---

## 🔧 Development Commands

```bash
# Development
npm run dev              # Turbo development server (preferred)
npm run dev:webpack      # Webpack fallback server
npm run build            # Production build
npm run start            # Production server
npm run type-check       # TypeScript validation (REQUIRED)
npm run lint             # ESLint checking (REQUIRED)

# Testing
npm test                 # Run Jest test suite
npm run test:watch       # Watch mode for development
npm run test:coverage    # Coverage report (70% minimum)

# Quality Gates (Run before commits)
npm run type-check && npm run lint && npm test

# Database
# Use Supabase dashboard or /scripts directory for migrations
# Test specific: npm test -- --testPathPattern="specific-test-name"
```

---

## 🎨 UI/UX Standards & Design System

### Design Tokens
- **Primary Colors**: Emerald/Teal (#10b981, #0f766e)
- **Typography**: Inter font family with French typography considerations
- **Language**: French UI with English code/comments
- **Spacing**: Tailwind spacing scale with consistent 4px grid
- **Shadows**: Subtle depth with professional appearance

### Component Library
```typescript
// shadcn/ui + Radix UI Foundation
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Form } from '@/components/ui/form'

// CVA Pattern for variants
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md",
  {
    variants: {
      variant: {
        default: "bg-emerald-600 text-white hover:bg-emerald-700",
        outline: "border border-input bg-background hover:bg-accent"
      }
    }
  }
)
```

### UI Patterns
- **Notifications**: Sonner toast system for user feedback
- **Loading States**: Skeleton components and loading spinners
- **Error Handling**: User-friendly error messages with recovery options
- **Mobile-First**: Responsive design with Tailwind breakpoints
- **Accessibility**: WCAG 2.1 AA compliance via Radix UI

---

## 🔐 Security Implementation Guide

### Input Validation & Sanitization
```typescript
// Zod schema validation (REQUIRED for all inputs)
const CreateClientSchema = z.object({
  email: z.string().email().max(255),
  name: z.string().min(1).max(100).refine(
    (val) => !containsMaliciousContent(val),
    "Invalid characters detected"
  ),
  phone: z.string().regex(/^(\+33|0)[1-9](\d{8})$/, "Format français requis")
})

// API route pattern
export async function POST(request: Request) {
  try {
    // 1. Parse and validate input
    const body = await request.json()
    const validatedData = CreateClientSchema.parse(body)
    
    // 2. Authenticate user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return unauthorizedResponse()
    
    // 3. Get dietitian for tenant isolation
    const { data: dietitian } = await supabase
      .from('dietitians')
      .select('id')
      .eq('auth_user_id', user.id)
      .single()
    
    if (!dietitian) return unauthorizedResponse()
    
    // 4. Database operation with tenant filter
    const { data, error } = await supabase
      .from('clients')
      .insert({
        ...validatedData,
        dietitian_id: dietitian.id // ← MANDATORY
      })
    
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Server error' }, 
      { status: 500 }
    )
  }
}
```

### Security Headers (next.config.mjs)
```javascript
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
  { key: 'Content-Security-Policy', value: cspHeader },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' }
]
```

### Client Authentication Pattern
```typescript
// Client portal authentication
export async function validateClientAuth(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return { error: 'Missing token', status: 401 }
  }
  
  const token = authHeader.substring(7)
  try {
    const payload = jwt.verify(token, process.env.CLIENT_AUTH_SECRET!) as JWTPayload
    return { clientId: payload.clientId }
  } catch (error) {
    return { error: 'Invalid token', status: 401 }
  }
}
```

---

## 🗄️ Database Schema & Patterns

### Core Tables (43 total)
```sql
-- Primary tenant anchor
profiles (nutritionists) → dietitians (extended data)

-- Multi-tenant data
clients → dietitian_id (FK)
meal_plans → dietitian_id (FK)
recipes → dietitian_id (FK)
documents → dietitian_id (FK)
messages → dietitian_id (FK via conversation)

-- Template system (reusable assets)
meal_plan_templates → dietitian_id (FK)
recipe_templates → dietitian_id (FK)

-- GDPR compliance
consent_records → client_id (FK)
data_export_requests → client_id (FK)
audit_logs → comprehensive tracking
```

### RLS Policies (MANDATORY)
```sql
-- Example RLS policy for clients table
CREATE POLICY "Dietitians can only access their clients"
  ON clients FOR ALL
  USING (dietitian_id = (
    SELECT id FROM dietitians 
    WHERE auth_user_id = auth.uid()
  ));
```

### Migration Pattern
```sql
-- scripts/YYYYMMDD_migration_name.sql
-- 1. Create tables with proper constraints
-- 2. Add RLS policies
-- 3. Create indexes for performance
-- 4. Add foreign key relationships
-- 5. Insert default data if needed
```

---

## 🤖 AI Integration Patterns

### Google Gemini Integration
```typescript
// lib/gemini.ts
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!)

export async function generateMealPlan(params: MealPlanParams) {
  // 1. Input validation with Zod
  const validatedParams = MealPlanParamsSchema.parse(params)
  
  // 2. Prompt construction with injection protection
  const prompt = constructSecurePrompt(validatedParams)
  
  // 3. AI generation with error handling
  const model = genAI.getGenerativeModel({ model: "gemini-pro" })
  const result = await model.generateContent(prompt)
  
  // 4. Response validation and sanitization
  return validateAndSanitizeAIResponse(result.response.text())
}
```

### AI Safety Measures
- **Prompt injection protection** with pattern detection
- **Response validation** with Zod schemas
- **Content sanitization** against malicious outputs
- **Usage tracking** for subscription limits
- **Error fallbacks** for AI service unavailability

---

## 💳 Subscription & Payment Integration

### Stripe Integration
```typescript
// lib/payment-service.ts
export async function createSubscription(
  customerId: string, 
  planId: string
) {
  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: planId }],
    payment_behavior: 'default_incomplete',
    payment_settings: { save_default_payment_method: 'on_subscription' },
    expand: ['latest_invoice.payment_intent']
  })
  
  return subscription
}
```

### Usage Tracking
```typescript
// Track AI generations for subscription limits
await supabase
  .from('ai_generations')
  .insert({
    dietitian_id: dietitianId,
    generation_type: 'meal_plan',
    tokens_used: tokenCount,
    created_at: new Date().toISOString()
  })
```

---

## 📝 Testing Strategy & Coverage

### Test Structure
```typescript
// __tests__/components/RecipeCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { RecipeCard } from '@/components/meal-plans/RecipeCard'

describe('RecipeCard', () => {
  it('displays recipe information correctly', () => {
    const mockRecipe = createMockRecipe()
    render(<RecipeCard recipe={mockRecipe} onRemove={jest.fn()} />)
    
    expect(screen.getByText(mockRecipe.name)).toBeInTheDocument()
    expect(screen.getByText(/ingredients/i)).toBeInTheDocument()
  })
})
```

### Coverage Requirements
- **Minimum 70% coverage** across all metrics (lines, branches, functions, statements)
- **API routes** must have comprehensive integration tests
- **Components** require unit tests for core functionality
- **Security functions** need thorough edge case testing

---

## 🌍 Internationalization & Localization

### French-First Design
- **UI Language**: French with proper typography (accents, spacing)
- **Date Formats**: DD/MM/YYYY format with French month names
- **Number Formats**: European formatting (comma for decimals)
- **Phone Validation**: French phone number patterns
- **Address Format**: French postal code and address structure

### Content Guidelines
```typescript
// Proper French UI text
const labels = {
  email: "Adresse e-mail",
  password: "Mot de passe", 
  confirmPassword: "Confirmer le mot de passe",
  required: "Ce champ est requis",
  invalidEmail: "Adresse e-mail invalide"
}
```

---

## 🚀 Performance Optimization

### Next.js Optimizations
```javascript
// next.config.mjs
const nextConfig = {
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons']
  },
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 31536000
  },
  compress: true
}
```

### Database Performance
- **Indexed foreign keys** for fast tenant filtering
- **Proper select statements** to avoid over-fetching
- **Connection pooling** via Supabase
- **Real-time subscriptions** for live updates
- **Query optimization** with EXPLAIN ANALYZE

### Frontend Performance
- **Code splitting** at route level with dynamic imports
- **Tree shaking** with ES modules
- **SWR caching** for API responses with intelligent revalidation
- **Image optimization** with Next.js Image component
- **Bundle analysis** with @next/bundle-analyzer

---

## 📋 Development Workflow & Best Practices

### Code Quality Gates
1. **TypeScript compilation** must pass (`npm run type-check`)
2. **ESLint** validation with no errors (`npm run lint`)
3. **Test suite** must pass with 70%+ coverage (`npm test`)
4. **Build process** must succeed (`npm run build`)

### Git Workflow
```bash
# Before committing
npm run type-check && npm run lint && npm test

# Commit message format
🐛 Fix: Brief description of bug fix
🔧 Feature: Brief description of new feature  
🧹 Refactor: Brief description of refactoring
📝 Docs: Brief description of documentation change
🚀 Performance: Brief description of performance improvement

# CRITICAL: Always commit AND push changes when task is completed
git add .
git commit -m "descriptive message"
git push  # ← REQUIRED: Never leave changes uncommitted locally
```

### AI Agent Workflow Requirements
- **ALWAYS** commit changes after completing a task or feature
- **ALWAYS** push commits to remote repository immediately
- **NEVER** leave work uncommitted or only committed locally
- Use clear, descriptive commit messages with appropriate emoji prefixes
- Commit frequently during development, not just at the end

### Component Development
```typescript
// Standard component structure
'use client' // Add if client-side features needed

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ComponentProps {
  className?: string
  children?: React.ReactNode
}

export function Component({ className, children }: ComponentProps) {
  const [state, setState] = useState()
  
  return (
    <div className={cn("base-classes", className)}>
      {children}
    </div>
  )
}
```

---

## 🔒 GDPR Compliance Implementation

### Data Protection Features
```typescript
// Consent management
export async function recordConsent(
  clientId: string, 
  consentType: ConsentType,
  granted: boolean
) {
  await supabase
    .from('consent_records')
    .insert({
      client_id: clientId,
      consent_type: consentType,
      granted,
      recorded_at: new Date().toISOString(),
      ip_address: getClientIP(), // For audit purposes
      user_agent: getUserAgent()
    })
}

// Data export (Right to portability)
export async function generateDataExport(clientId: string) {
  const clientData = await supabase
    .from('clients')
    .select('*, documents(*), meal_plans(*)')
    .eq('id', clientId)
    .single()
  
  return {
    personal_data: sanitizePersonalData(clientData),
    export_date: new Date().toISOString(),
    format_version: '1.0'
  }
}
```

### Audit Logging
```typescript
// Comprehensive audit trail
export async function logDataAccess(
  userId: string,
  action: string,
  resourceType: string,
  resourceId: string,
  details?: Record<string, any>
) {
  await supabase
    .from('audit_logs')
    .insert({
      user_id: userId,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      details,
      ip_address: getClientIP(),
      user_agent: getUserAgent(),
      timestamp: new Date().toISOString()
    })
}
```

---

## ⚠️ Critical Restrictions & Guidelines

### Absolute Prohibitions
- **NEVER** expose `SUPABASE_SERVICE_ROLE_KEY` to client-side code
- **NEVER** query database without `dietitian_id` filter in multi-tenant contexts
- **NEVER** mix nutritionist and client authentication contexts
- **NEVER** commit sensitive data (API keys, passwords) to repository
- **NEVER** bypass Row Level Security policies
- **NEVER** expose internal error details to end users
- **NEVER** store sensitive data in localStorage or sessionStorage

### Security Requirements
- **ALWAYS** validate input with Zod schemas
- **ALWAYS** sanitize user-generated content
- **ALWAYS** use parameterized queries (Supabase handles this)
- **ALWAYS** implement proper error boundaries
- **ALWAYS** log security events for audit purposes
- **ALWAYS** verify user permissions before data operations

### Development Requirements
- **MUST** maintain 70% test coverage minimum
- **MUST** use TypeScript strict mode
- **MUST** follow French UI language standards
- **MUST** implement proper loading and error states
- **MUST** ensure mobile responsiveness
- **MUST** validate GDPR compliance for new features
- **MUST** commit and push all changes when task is completed

---

## 🎯 Key Business Logic Patterns

### Meal Planning System
```typescript
// Three-tier architecture: Plans → Recipes → Templates
interface MealPlanHierarchy {
  meal_plans: {
    id: string
    dietitian_id: string // ← MANDATORY tenant filter
    plan_content: AIGeneratedPlan | ManualMealPlan
    template_id?: string // Optional template reference
  }
  recipes: {
    id: string
    dietitian_id: string // ← MANDATORY tenant filter
    recipe_ingredients: RecipeIngredient[]
    template_id?: string
  }
  templates: {
    meal_plan_templates: { dietitian_id: string }
    recipe_templates: { dietitian_id: string }
  }
}
```

### Client Management
```typescript
// Comprehensive client profiles with medical history
interface ClientProfile {
  personal_info: PersonalDetails
  medical_history: MedicalConditions[]
  dietary_restrictions: DietaryRestriction[]
  goals: NutritionalGoals
  progress_tracking: ProgressRecord[]
  consent_records: ConsentRecord[]
}
```

### Document Management
```typescript
// Supabase Storage with visibility controls
interface DocumentAccess {
  visibility: 'private' | 'shared_with_client'
  access_logs: DocumentAccessLog[]
  retention_policy: RetentionPolicy
}
```

---

## 📚 Environment Variables

### Required Configuration
```bash
# Supabase (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key # SERVER ONLY

# Client Authentication (REQUIRED)
CLIENT_AUTH_SECRET=your-hmac-secret-256-bits # Generate with crypto

# AI Integration (REQUIRED for meal planning)
GOOGLE_GEMINI_API_KEY=your-gemini-api-key

# Payment Processing (REQUIRED for subscriptions)
STRIPE_SECRET_KEY=sk_test_or_live_key
STRIPE_WEBHOOK_SECRET=whsec_webhook_secret

# Optional Configurations
NEXT_PUBLIC_APP_URL=https://your-domain.com
SMTP_HOST=smtp.provider.com # For email notifications
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password
```

---

## 🎉 Success Criteria for AI Agents

When working with this codebase, ensure you:

1. **✅ Security First**: Always implement multi-tenant data isolation
2. **✅ Type Safety**: Use TypeScript and Zod for all data operations  
3. **✅ French Standards**: Follow French UI/UX and data format conventions
4. **✅ Test Coverage**: Maintain minimum 70% test coverage
5. **✅ GDPR Compliance**: Implement proper consent and audit logging
6. **✅ Performance**: Optimize for production-grade performance
7. **✅ Accessibility**: Ensure WCAG 2.1 AA compliance
8. **✅ Code Quality**: Follow established patterns and conventions

This codebase represents a production-ready, sophisticated SaaS platform with enterprise-grade security, performance, and compliance features. Treat it with the professionalism and attention to detail it deserves.

---

*Last updated: 2025-01-24 - NutriFlow SaaS v2.0*