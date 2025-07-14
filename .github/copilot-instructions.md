# NutriFlow - AI Coding Guidelines

## Project Overview

This is **NutriFlow**, a Next.js 15 SaaS platform for French only market, french dietitian-nutritionists using App Router, React 19, TypeScript, and Supabase. The UI is in French but code/comments are in English.

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

### Navigation Patterns

- Dynamic routes for client/plan details: `/dashboard/clients/[id]` and `/dashboard/meal-plans/[id]`
- Dashboard cards use Link components with hover states for navigation
- Always validate entity IDs exist before navigation to prevent broken links
- Use consistent hover styling: `hover:bg-gray-50 transition-colors duration-200`
- Sidebar "Actions rapides" section links to existing pages (not separate routes)
- "Ajouter un client" links to `/dashboard/clients` where dialog-based creation exists
- **Calendar functionality integrated into `/dashboard/appointments`** with multiple view modes
- Old `/dashboard/calendar` route redirects to unified appointments system

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
- **IMPORTANT**: Never attempt to run database scripts with terminal commands
- **Always provide the SQL script content for manual execution in supabase.com**
- Use Supabase SQL Editor at https://supabase.com/dashboard/project/[project-id]/sql
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

## Current Production Status

### 🚀 **FULLY PRODUCTION READY**

NutriFlow is now a complete, production-ready SaaS platform with all core features implemented:

**✅ Core Features Complete:**

- Client management with full CRUD operations
- Meal plan creation, editing, and AI generation
- Appointment scheduling with calendar integration
- Invoice generation and payment processing
- Real-time analytics dashboard
- Comprehensive messaging system
- Document management with client sharing
- Progress tracking (weight, photos, measurements)
- Mobile-responsive PWA

**✅ Security & Compliance Complete:**

- Two-factor authentication (email-based)
- Role-based access control (dietitian/admin/superadmin)
- Comprehensive audit logging
- GDPR compliance with mandatory consent collection
- Row Level Security (RLS) on all database tables
- Session management with device trust
- Secure file storage and document sharing

**✅ Client Experience Complete:**

- Dual authentication system (nutritionist + client portals)
- Real-time data across all interfaces
- Document access with visibility controls
- Weight tracking with chart visualization
- Appointment management
- GDPR rights management
- Responsive design across all devices

**✅ Technical Architecture Complete:**

- Next.js 15 with App Router and React 19
- TypeScript throughout codebase
- Supabase for database, auth, and storage
- Real-time subscriptions for live updates
- Professional UI with shadcn/ui components
- Comprehensive error handling and validation

The platform is ready for immediate deployment to production with full confidence.

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

### Document Management & Client Portal Integration (Latest)

- **COMPLETE** Document system with nutritionist upload and client access
- Enhanced client portal with real data across all tabs (Profile, Plans, Weight, Appointments, Documents, Messages, GDPR)
- Document categories: general, blood_test, prescription, photo, report, meal_plan, exercise_plan
- Visibility controls: `is_visible_to_client` boolean field controls client access
- Secure downloads: Service role authentication for client document access
- Real-time updates: Document visibility can be toggled post-upload
- Professional UI: Category badges, file size display, upload dates, download buttons
- Complete audit trail: All document operations logged via AuditLogService

### Client Portal Real Data Implementation (Latest)

- **7-tab navigation**: Overview, Mon Plan, Progrès, Rendez-vous, Documents, Messages, Confidentialité
- **Real API integration**: All data comes from `/api/client-auth/data` endpoint
- **Document access**: New `ClientDocuments.tsx` component for secure document viewing
- **Weight tracking**: Real-time weight entry with chart visualization
- **Appointment display**: Real appointments from database with proper formatting
- **Message system**: Real conversation threading with nutritionist
- **GDPR management**: Complete consent management and data rights interface

### GDPR Compliance System (Latest)

- **Mandatory Consent Collection**: Non-dismissible modal for first-time client portal access
- **Complete Admin Interface**: `/dashboard/gdpr` with consent management, data export, deletion requests
- **Client Rights Management**: Full GDPR interface in client portal "Confidentialité" tab
- **Database Schema**: GDPR tables (`consent_records`, `data_retention_policies`, `data_export_requests`, etc.)
- **Email Notifications**: Automatic admin notifications for GDPR requests
- **Consent Categories**: 5 types (data_processing, health_data, photos, marketing, data_sharing)
- **Legal Compliance**: Complete audit trails, retention policies, and right to erasure
- **API Endpoints**: Full GDPR management APIs with service role authentication

### Unified Calendar & Appointments System (Latest)

- **MERGED** `/dashboard/calendar` and `/dashboard/appointments` into single comprehensive system
- Unified appointments page now includes: Today, Week, Month, and List views
- Enhanced sidebar with contextual information, statistics, and quick actions
- Calendar page now redirects to appointments with appropriate view mode
- Removed redundant navigation entry - single "Rendez-vous & Calendrier" menu item
- Real database integration maintained with professional calendar visualization
- Week view component added for better temporal scheduling overview

### Invoice Modal Width Fixed

- Increased invoice details modal width from 700px to 900px for better content display
- Fixed broken layout when clicking "Modifier" button in invoice details
- Improved responsive layout and button arrangement in modal dialogs

### Calendar Component Fixed

- Fixed broken calendar layout in appointments page from vertical list to proper grid
- Updated CSS classes to use `grid grid-cols-7` for proper calendar table structure
- Calendar now displays correctly with proper week/day grid layout
- Compatible with react-day-picker v9.8.0

### Clickable Dashboard Cards

- Dashboard client and meal plan cards are now clickable Link components
- Navigate to `/dashboard/clients/[id]` for client details
- Navigate to `/dashboard/meal-plans/[id]` for plan details
- Added hover states with consistent gray background and smooth transitions

### Auth-Aware Landing Page

- Landing page navbar dynamically adapts to authentication state
- Implemented profile dropdown with user display name and logout functionality
- French UI labels: "Connexion", "Commencer", "Mon espace", "Se déconnecter"
- Mobile navigation follows same auth patterns
- Uses `useAuth()` hook for seamless auth state management

### Weight Tracking System

- **Automatic Synchronization**: Client's `current_weight` field automatically syncs with weight measurements
- **Adding Measurements**: New weight entries automatically update the client's `current_weight`
- **Removing Measurements**: Deleting a weight entry updates `current_weight` to the most recent remaining measurement
- **Initial Weight**: Creating a client with a `current_weight` automatically creates an initial measurement record
- **Database Tables**: `clients.current_weight` and `weight_history` table work in tandem
- **French UI**: "nouvelle mesure", "poids actuel" terminology for nutrition practice

### Client Portal Authentication System (Latest)

- **Dual Authentication Architecture**: Complete separation between nutritionist (`useAuth`) and client (`useClientAuth`) authentication systems
- **Client Authentication Flow**:
  - New `ClientAuthProvider` context for client session management
  - Client login at `/client-login` with emerald gradient professional styling
  - Client portal at `/client-portal` with real data integration and weight tracking
  - `ClientProtectedRoute` component guards client-only pages
- **Database Schema**: `client_accounts` table with RLS policies for client authentication
- **API Endpoints**:
  - `/api/client-auth/login` - Client authentication with service role bypass
  - `/api/client-auth/logout` - Client session termination
  - `/api/client-auth/data` - Client profile and meal plan data
  - `/api/client-auth/weight` - Weight tracking with instant UI updates
  - `/api/client-auth/documents` - Client document access (visible only)
  - `/api/client-auth/documents/download` - Secure document downloads
  - `/api/client-auth/gdpr/consents` - GDPR consent management
- **Cross-Authentication Protection**:
  - Nutritionists cannot access `/client-login` (redirected to `/dashboard`)
  - Clients cannot access `/login` (redirected to `/client-portal`)
  - Both `ClientAuthProvider` and `AuthProvider` available app-wide via root layout
- **Professional UI Consistency**:
  - Both login pages use emerald gradient background (`from-emerald-50 via-white to-teal-50`)
  - Consistent logo positioning, card styling, and form layouts
  - Activity icon for nutritionist login, Heart icon for client login
  - "Retour au site principal" navigation links on both pages
- **Client Data Integration**: Real client data display with tabs for profile, meal plans, weight tracking with chart visualization, documents, and GDPR rights
- **Hydration Fixes**: Resolved HTML validation issues (no `<div>` inside `<p>` elements) for clean rendering

### Document Management System (Latest)

- **Complete Document Lifecycle**: Upload, categorization, visibility control, and secure client access
- **Nutritionist Interface**:
  - Document upload in `/dashboard/clients/[id]` with 7 categories (general, blood_test, prescription, photo, report, meal_plan, exercise_plan)
  - Visibility toggle per document (`is_visible_to_client` boolean)
  - Document management with download, visibility control, and deletion
  - Audit logging for all document operations
- **Client Portal Integration**:
  - New "Documents" tab in client portal (`/client-portal`)
  - `ClientDocuments.tsx` component for secure document viewing
  - Only shows documents marked as `is_visible_to_client: true`
  - Secure download functionality with proper authentication
- **Database Schema**:
  - `documents` table with RLS policies and visibility controls
  - Supabase Storage bucket with proper access policies
  - File organization: `/dietitian_id/client_id/filename`
- **Security Features**:
  - Service role authentication for client document access
  - Validation of document ownership and visibility
  - File type validation (PDF, images, Word docs)
  - 10MB file size limit
- **API Implementation**:
  - Real-time visibility updates in dashboard
  - Secure download through backend proxy
  - Proper error handling and user feedback

### GDPR Compliance System (Latest)

- **Mandatory Consent Collection**: Non-dismissible modal for first-time client portal access
- **Complete Admin Interface**: `/dashboard/gdpr` with consent management, data export, deletion requests
- **Client Rights Management**: Full GDPR interface in client portal "Confidentialité" tab
- **Database Schema**: GDPR tables (`consent_records`, `data_retention_policies`, `data_export_requests`, etc.)
- **Email Notifications**: Automatic admin notifications for GDPR requests
- **Consent Categories**: 5 types (data_processing, health_data, photos, marketing, data_sharing)
- **Legal Compliance**: Complete audit trails, retention policies, and right to erasure
- **API Endpoints**: Full GDPR management APIs with service role authentication
