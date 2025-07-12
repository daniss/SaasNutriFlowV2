# NutriFlow - AI Coding Guidelines

## Project Overview

This is **NutriFlow**, a Next.js 15 SaaS platform for French dietitian-nutritionists using App Router, React 19, TypeScript, and Supabase. The UI is in French but code/comments are in English.

## Architecture Patterns

### Multi-Tenant Security via Supabase RLS

- **Critical**: Every table uses `dietitian_id` foreign key and Row Level Security (RLS)
- All database policies filter by `auth.uid() = dietitian_id`
- Never bypass RLS - data isolation is enforced at DB level
- Example: `CREATE POLICY "policy_name" ON table_name FOR SELECT USING (dietitian_id = auth.uid());`

### Authentication Flow

- Uses `AuthProviderNew.tsx` context wrapping the entire app
- `ProtectedRoute.tsx` HOC guards dashboard routes
- Middleware in `middleware.ts` handles auth redirects for `/dashboard/*` paths
- Three Supabase clients: `client.ts` (browser), `server.ts` (SSR), `middleware.ts` (Edge)
- Landing page navbar adapts based on auth state using `useAuth()` hook

### Dashboard Layout Hierarchy

```
app/layout.tsx (root)
  → app/dashboard/layout.tsx (ProtectedRoute + AppSidebar)
    → app/dashboard/[feature]/page.tsx
```

## Development Workflow

### Commands

```bash
npm run dev          # Development server
npm run build        # Production build
npm test             # Jest unit tests
npm run type-check   # TypeScript validation
npm run lint         # ESLint check
```

### Database Operations

- SQL scripts in `/scripts/` for schema management
- Use `supabase` CLI for migrations: `supabase db push`
- Always enable RLS on new tables with dietitian_id policies
- Use `npm install` for package management (never use pnpm or legacy-peer-deps)

## Component Patterns

### UI System (shadcn/ui)

- Base components in `/components/ui/` using CVA (Class Variance Authority)
- Example: `<Button variant="default" size="lg">Label</Button>`
- Use `cn()` utility from `/lib/utils.ts` for conditional classes
- Design system: Emerald/Teal primary colors, Inter font

### Form Handling

- React Hook Form + Zod validation pattern
- Example import: `import { useForm } from "react-hook-form"`
- French UI labels but English field names/validation

### Auth-Aware Navigation

- Landing page navbar uses conditional rendering based on `isAuthenticated` from `useAuth()`
- **Authenticated users**: Profile dropdown with display name, "Mon espace" link, "Se déconnecter" option
- **Unauthenticated users**: "Connexion" link and "Commencer" signup button
- Mobile navigation follows same auth patterns with appropriate styling
- Use `DropdownMenu` from shadcn/ui for profile menus
- Display name priority: `first_name last_name` > `first_name` > `email prefix` > "Mon Compte"

### French Interface Standards

- Sidebar navigation in French: "Tableau de bord", "Clients", "Plans alimentaires"
- Landing page navbar: "Connexion" for login, "Commencer" for signup
- Auth dropdown menu: "Mon espace" (dashboard), "Se déconnecter" (logout)
- API responses can be English, but UI text must be French
- Error messages and notifications in French

## Service Integration

### Supabase Patterns

- Import from `/lib/supabase/client.ts` for browser operations
- Server actions use `/lib/supabase/server.ts`
- Type definitions in `/lib/supabase.ts` with Database interface
- Always handle auth state in components with `useAuth()` hook

### AI Integration (Gemini)

- Meal plan generation in `/lib/gemini.ts`
- French prompts for nutritional AI requests
- Example: `generateMealPlan({ prompt: "Plan pour diabétique", duration: 7 })`

### File Structure Rules

- Feature-based organization under `/app/dashboard/[feature]/`
- Shared components in `/components/[category]/`
- Services and utilities in `/lib/`
- Database types generated from Supabase schema

## Critical Don'ts

- Never expose SUPABASE_SERVICE_ROLE_KEY in client-side code
- Don't bypass RLS policies or query tables without dietitian_id filter
- Avoid mixing Next.js patterns (don't use pages/ directory)
- Don't import from `/lib/supabase/server.ts` in client components

## Testing Strategy

- Jest config uses Next.js helper for proper module resolution
- Test files in `__tests__/` directory
- Mock Supabase client for unit tests
- French UI text should be tested with exact string matches

When adding new features, follow the existing patterns: RLS-enabled database tables, French UI labels, proper client/server separation, and multi-tenant isolation by dietitian_id.

## Recent Updates

### Auth-Aware Landing Page (Latest)

- Landing page navbar dynamically adapts to authentication state
- Implemented profile dropdown with user display name and logout functionality
- French UI labels: "Connexion", "Commencer", "Mon espace", "Se déconnecter"
- Mobile navigation follows same auth patterns
- Uses `useAuth()` hook for seamless auth state management
