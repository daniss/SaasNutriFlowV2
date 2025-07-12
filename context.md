# 🥗 NutriFlow - Professional SaaS for Dietitian Nutritionists

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?logo=next.js&logoColor=white)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

> **Modern SaaS platform dedicated to French dietitian-nutritionists for complete management of their practice and clients.**

---

# 🎯 Vision & Mission

**NutriFlow** is a comprehensive SaaS solution specifically designed for French-speaking dietitian-nutritionists, offering:

- 🤖 AI-assisted meal plan generation (Google Gemini)
- 👥 Secure and complete client management
- 📋 Integrated workflows for appointments, invoices and follow-up
- 🔐 Multi-tenant security with Row Level Security (RLS)
- 🇫🇷 Fully French interface with professional terminology

---

# 🏗️ Complete Technical Architecture

## Frontend Stack

- **Next.js 15** - React framework with App Router
- **React 19** - Modern user interface
- **TypeScript** - Strict typing for security
- **Tailwind CSS** - CSS framework with design system
- **Radix UI** - Accessible base components
- **Lucide React** - Modern and consistent icons
- **React Hook Form + Zod** - Form management with validation
- **Recharts** - Charts and data visualizations

## Backend & Database Stack

- **Supabase** - Backend-as-a-Service with PostgreSQL
- **Row Level Security (RLS)** - User-level data security
- **Supabase Authentication** - Secure authentication
- **Next.js API Routes** - Server API endpoints
- **Real-time subscriptions** - Real-time updates

## AI Integrations & Services

- **Google Gemini AI** - Intelligent meal plan generation
- **SendGrid / Resend** - Transactional email services
- **Twilio / OVH SMS** - SMS notifications (France)
- **Stripe / PayPal** - Payment processing
- **jsPDF** - PDF document generation

## Design System & UI

- **Primary design**: Emerald & Teal (health/nature colors)
- **Palette**: Subtle gradients `from-slate-50 via-white to-emerald-50/30`
- **Components**: Shadcn/ui with French UX customization
- **Typography**: Inter font for professional readability
- **Animations**: Smooth transitions with Tailwind animate

---

# 📋 Complete Menu Structure

## Main Menu (Sidebar)

```
📊 Dashboard (/dashboard)
👥 Clients (/dashboard/clients)
  ├── Client list
  ├── /new - New client
  └── /[id] - Detailed client profile

📄 Meal Plans (/dashboard/meal-plans)
  ├── Plan list
  ├── /generate - AI Generator
  ├── /new - New manual plan
  └── /[id] - Meal plan details

🧮 Nutritional Analysis (/dashboard/nutrition-analysis)
  ├── Food analysis
  ├── Macro calculator
  └── Complete meal analysis

💬 Messages (/dashboard/messages)
  ├── Client conversations
  └── New message

👨‍🍳 Recipe Library (/dashboard/templates)
  ├── Plan templates
  ├── Custom recipes
  └── /new - New template

📅 Appointments (/dashboard/appointments)
  ├── General schedule
  ├── /new - New appointment
  └── /[id] - Appointment details

🔔 Reminders (/dashboard/reminders)
  ├── Automatic reminders
  └── Scheduling

📈 Analytics & Reports (/dashboard/analytics)
  ├── Practice statistics
  ├── Client performance
  └── Data export

📅 Advanced Calendar (/dashboard/calendar)
  ├── Monthly view
  ├── Detailed agenda
  └── External synchronization

🧑‍💼 Client Portal (/client-portal)
  ├── Autonomous client interface
  └── Access to plans and progress

💰 Invoices (/dashboard/invoices)
  ├── Billing management
  ├── /new - New invoice
  └── /[id] - Invoice details

⚙️ Settings (/dashboard/settings)
  ├── Dietitian profile
  ├── Practice configuration
  └── Preferences
```

## Quick Actions (Sidebar Footer)

```
+ Add a client (/dashboard/clients/new)
+ Generate a plan (/dashboard/meal-plans/generate)
```

---

# 📁 Detailed Project Structure

```txt
nutriflow/
├── 📂 app/                             # Next.js App Router
│   ├── 📂 dashboard/                   # Main dietitian interface
│   │   ├── layout.tsx                  # Layout with sidebar + auth
│   │   ├── page.tsx                    # Main dashboard
│   │   ├── 📂 analytics/               # Analytics and reports
│   │   │   └── page.tsx                # Practice statistics
│   │   ├── 📂 appointments/            # Appointment management
│   │   │   ├── page.tsx                # Appointment list
│   │   │   ├── 📂 new/                 # New appointment
│   │   │   └── 📂 [id]/                # Appointment details
│   │   ├── 📂 calendar/                # Advanced calendar
│   │   │   └── page.tsx                # Calendar view
│   │   ├── 📂 clients/                 # Client management
│   │   │   ├── page.tsx                # Client list with search
│   │   │   ├── 📂 new/                 # New client
│   │   │   └── 📂 [id]/                # Client profile + history
│   │   ├── 📂 invoices/                # Billing
│   │   │   ├── page.tsx                # Invoice list
│   │   │   ├── 📂 new/                 # New invoice
│   │   │   └── 📂 [id]/                # Invoice details + PDF
│   │   ├── 📂 meal-plans/              # Meal plans
│   │   │   ├── page.tsx                # Plan list with filters
│   │   │   ├── 📂 generate/            # AI Generator (Gemini)
│   │   │   ├── 📂 new/                 # Manual plan
│   │   │   └── 📂 [id]/                # Plan details + PDF export
│   │   ├── 📂 messages/                # Communication
│   │   │   └── page.tsx                # Messaging interface
│   │   ├── 📂 nutrition-analysis/      # Nutritional tools
│   │   │   └── page.tsx                # Food analysis + calculations
│   │   ├── 📂 reminders/               # Automatic reminders
│   │   │   └── page.tsx                # Reminder management
│   │   ├── 📂 settings/                # Configuration
│   │   │   └── page.tsx                # Dietitian settings
│   │   └── 📂 templates/               # Recipe library
│   │       └── page.tsx                # Templates and recipes
│   ├── 📂 client-portal/               # Autonomous client portal
│   │   └── page.tsx                    # Client dashboard
│   ├── 📂 auth/                        # Authentication
│   │   ├── 📂 callback/                # OAuth callback
│   │   ├── 📂 confirm/                 # Email confirmation
│   │   ├── 📂 reset-password/          # Password reset
│   │   └── 📂 auth-code-error/         # Auth error handling
│   ├── 📂 api/                         # Backend API
│   │   ├── 📂 auth/                    # Authentication endpoints
│   │   ├── 📂 health/                  # Health check
│   │   ├── 📂 notifications/           # Email/SMS API
│   │   ├── 📂 payments/                # Payment processing
│   │   │   └── 📂 webhook/             # Stripe/PayPal webhooks
│   │   └── 📂 test-health/             # Health tests
│   ├── layout.tsx                      # Root layout with AuthProvider
│   ├── page.tsx                        # Landing page
│   └── globals.css                     # Global styles

├── 📂 components/                      # Reusable components
│   ├── app-sidebar.tsx                 # Main sidebar menu
│   ├── dashboard-header.tsx            # Dashboard header
│   ├── landing-page.tsx                # Landing page
│   ├── theme-provider.tsx              # Theme manager
│   ├── 📂 auth/                        # Authentication components
│   │   ├── AuthProviderNew.tsx         # Supabase auth provider
│   │   └── ProtectedRoute.tsx          # Route protection HOC
│   ├── 📂 dashboard/                   # Dashboard-specific components
│   │   └── MonthlyAgenda.tsx           # Monthly agenda
│   ├── 📂 invoices/                    # Billing components
│   │   └── InvoicePreview.tsx          # Invoice preview
│   ├── 📂 shared/                      # Shared components
│   │   ├── error-boundary.tsx          # React error handling
│   │   ├── loading.tsx                 # Loading indicators
│   │   └── skeletons.tsx               # Loading skeletons
│   ├── 📂 templates/                   # Template components
│   │   ├── MealPlanTemplateDialog.tsx  # Plan template dialog
│   │   └── RecipeTemplateDialog.tsx    # Recipe template dialog
│   └── 📂 ui/                          # Design system (Shadcn/ui)
│       ├── accordion.tsx               # Accordion
│       ├── alert-dialog.tsx            # Alert dialogs
│       ├── badge.tsx                   # Badges and labels
│       ├── button.tsx                  # Buttons (variants)
│       ├── card.tsx                    # Container cards
│       ├── dialog.tsx                  # Modal dialogs
│       ├── form.tsx                    # Form components
│       ├── input.tsx                   # Input fields
│       ├── select.tsx                  # Dropdown selectors
│       ├── sidebar.tsx                 # Sidebar system
│       ├── table.tsx                   # Data tables
│       ├── tabs.tsx                    # Tab navigation
│       ├── toast.tsx                   # Toast notifications
│       └── ... (40+ UI components)

├── 📂 hooks/                           # Custom React hooks
│   ├── use-mobile.tsx                  # Mobile detection
│   ├── use-toast.ts                    # Toast management
│   └── useAuthNew.ts                   # Authentication hook

├── 📂 lib/                             # Utilities and services
│   ├── api.ts                          # Centralized API client
│   ├── email.ts                        # Enhanced email service
│   ├── error-handling.ts               # Global error handling
│   ├── errors.ts                       # Error types
│   ├── formatters.ts                   # Data formatting
│   ├── gemini.ts                       # Gemini AI integration
│   ├── notification-service.ts         # Multi-provider notification service
│   ├── payment-service.ts              # Payment service
│   ├── pdf-generator.ts                # Meal plan PDF generation
│   ├── pdf.ts                          # Invoice PDF generation
│   ├── status.ts                       # Status utilities
│   ├── supabase.ts                     # Main Supabase client
│   ├── utils.ts                        # General utilities
│   └── 📂 supabase/                    # Supabase configuration
│       ├── client.ts                   # Browser-side client
│       ├── middleware.ts               # Next.js middleware
│       └── server.ts                   # Server-side client

├── 📂 public/                          # Static assets
│   ├── favicon.png                     # Site icon
│   ├── manifest.json                   # PWA manifest
│   ├── sw.js                           # Service Worker
│   └── placeholder-*.{jpg,svg}         # Placeholder images

├── 📂 scripts/                         # Database scripts
│   ├── create-tables.sql               # Table creation
│   ├── enhanced-schema.sql             # Complete schema
│   ├── seed-data.sql                   # Test data
│   └── *.sql                           # Various scripts

├── 📂 styles/                          # Styles
│   └── globals.css                     # CSS variables + Tailwind

├── 📂 __tests__/                       # Tests
│   ├── button.test.tsx                 # Component tests
│   └── 📂 api/                         # API tests

├── components.json                     # Shadcn/ui config
├── middleware.ts                       # Next.js auth middleware
├── package.json                        # Dependencies
├── tailwind.config.ts                  # Tailwind configuration
├── tsconfig.json                       # TypeScript configuration
└── README_ENHANCED.md                  # Complete documentation
```

---

# 🎨 Design System & Visual Identity

## Main Color Palette

- **Primary**: Emerald (`emerald-500` #10b981, `emerald-600` #059669)
- **Secondary**: Teal (`teal-500` #14b8a6, `teal-600` #0d9488)
- **Accent**: Slate (`slate-50` #f8fafc, `slate-900` #0f172a)
- **Main gradient**: `bg-gradient-to-br from-slate-50 via-white to-emerald-50/30`

## Branding & Logo

- **Logo**: Gradient circle `from-emerald-500 to-teal-600` with "N"
- **Name**: "NutriFlow" in font-semibold
- **Tagline**: "Dietitian Dashboard"

## Standard Visual Components

- **Primary buttons**: `bg-emerald-600 hover:bg-emerald-700`
- **Cards**: `bg-white/80 backdrop-blur-sm border-slate-100 shadow-sm rounded-xl`
- **Sidebar**: Collapsible design with tooltips
- **Loading**: Emerald spinners with Tailwind animations

---

# 🚀 Complete Features

## ✅ Production Features

### 🏠 Dashboard

- Real-time statistics (clients, plans, appointments)
- Practice KPIs with charts
- Integrated monthly agenda
- Contextual quick actions

### 👥 Client Management

- Complete CRUD with Zod validation
- Advanced search and filters
- Weight/measurements tracking with charts
- Progress photos
- Session notes system
- Complete history

### 📋 Meal Plans

- **AI Generator**: French prompts for Gemini
- **Manual editing**: Drag-and-drop interface
- **PDF export**: Professional layout
- **Client sharing**: Automatic email with PDF
- **Templates**: Customizable library
- **Tracking**: Status and client feedback

### 🧮 Nutritional Analysis

- **Food database**: 100+ French foods
- **Macro calculator**: BMR/TDEE with formulas
- **Meal analysis**: Nutritional balance
- **Qualitative assessments**: Fiber, sodium, sugars

### 📅 Appointments & Calendar

- Integrated scheduling with multiple views
- External calendar synchronization
- Automatic email/SMS reminders
- Video conference support

### 💰 Billing & Payments

- Automatic invoice generation
- PDF export with branding
- Stripe/PayPal integration
- Payment tracking and follow-ups

### 🔔 Multi-Channel Notifications

- **Email**: SendGrid/Resend
- **SMS**: Twilio/OVH (France)
- Predefined French templates
- Advanced customization

## ⚠️ In Development

- Teleconsultation module
- EHR/DMP integration
- Advanced analytics with BI
- Public API for partners

---

# 🔧 Development Configuration

## Environment Variables (.env.local)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI
GEMINI_API_KEY=

# Email (choose a provider)
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=
# or RESEND_API_KEY=

# SMS (French provider)
SMS_PROVIDER=ovh
OVH_APPLICATION_KEY=
OVH_APPLICATION_SECRET=
OVH_CONSUMER_KEY=
OVH_SERVICE_NAME=

# Payments
STRIPE_PUBLIC_KEY=
STRIPE_SECRET_KEY=
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
```

## Development Commands

```bash
npm run dev       # Development server
npm run build     # Production build
npm test          # Unit tests
npm run type-check # TypeScript verification
npm run lint      # ESLint linting
```

---

# 📊 Supabase Database

## Main Tables

- **profiles**: Dietitian profiles with RLS
- **clients**: Clients with health data
- **meal_plans**: Meal plans and content
- **appointments**: Appointments and scheduling
- **invoices**: Billing and payments
- **notifications**: Communication history
- **meal_plan_templates**: Reusable templates

## RLS Security

- Complete isolation by `dietitian_id`
- Strict policies on all tables
- Automatic audit trail

---

# 🇫🇷 French Specificities

## Professional Terminology

- Use of French dietetics vocabulary
- Compliance with PNNS recommendations
- Adaptation to French practice methods

## Regulatory Compliance

- GDPR preparation with consents
- Health data security
- Billing compliant with French regulations

## Local Integrations

- French SMS providers (OVH)
- Euro and French VAT support
- French calendars (public holidays)

This architecture guarantees a modern, secure SaaS solution perfectly adapted to the needs of French dietitian-nutritionists. 🥗
