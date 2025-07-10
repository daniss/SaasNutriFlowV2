# 🥗 NutriFlow - Professional Nutrition Management Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?logo=next.js&logoColor=white)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

---

# <!-- copilot:section --> 🚀 What is NutriFlow?

NutriFlow is a full-featured SaaS platform for nutrition professionals. It includes:

- AI-assisted meal planning (via Google Gemini)
- Secure client management
- Invoice and appointment workflows
- Role-based access control and audit logging (via Supabase RLS)

---

# <!-- copilot:section --> 🎯 Features Overview

## ✅ Production-Ready
- Auth via Supabase
- Meal plan management (AI + manual)
- Appointments, recipes, invoices
- Dashboard + analytics
- Fully responsive PWA
- **Enhanced PDF export** (invoices & meal plans)
- **Email/SMS notifications** (multi-provider support)
- **Payment processing** (Stripe, PayPal integration)

## ⚠️ Recently Implemented
- PDF generation with professional formatting
- Multi-provider notification system (SendGrid, Resend, Twilio, OVH)
- Payment gateway integration with webhook support
- API endpoints for payments and notifications

## ❌ Planned
- Telehealth, EHR integration, advanced analytics

---

# <!-- copilot:stack --> 🏗️ Architecture & Tech Stack

## Frontend
- `Next.js 15` (App Router)
- `React 19`, `TypeScript`, `Tailwind CSS`
- `Radix UI`, `Lucide`, `React Hook Form`, `Zod`

## Backend & Infra
- `Supabase` (PostgreSQL, RLS, real-time)
- `Next.js API routes`
- AI: `Google Gemini API`
- Payments: Stripe, PayPal, SumUp, Lydia Pro

## DevOps
- Linting: ESLint + Prettier
- Monitoring: Sentry, LogRocket
- PWA: Service Worker, Manifest

---

# <!-- copilot:structure --> 📁 Project Structure

```txt
SaasNutriFlowV2/
├── app/                # Next.js App Router (pages, API, dashboard, auth)
│   ├── dashboard/      # Main UI
│   ├── api/            # REST-like API endpoints
│   │   ├── auth/       # Authentication endpoints
│   │   ├── payments/   # Payment processing & webhooks
│   │   └── notifications/ # Email/SMS notification API
│   ├── auth/           # Auth logic (sign-in/out, etc.)
│   └── client-portal/  # Planned client-side views
├── components/         # Reusable UI (incl. Shadcn)
│   ├── ui/             # Design system
│   ├── auth/           # Auth-specific components
│   └── shared/         # Shared components (error boundary, loading)
├── lib/                # Core logic: supabase client, pdf utils, AI helpers
│   ├── supabase/       # Database client configuration
│   ├── pdf.ts          # Enhanced PDF generation for invoices
│   ├── pdf-generator.ts # Enhanced PDF generation for meal plans
│   ├── notification-service.ts # Multi-provider email/SMS service
│   ├── payment-service.ts # Payment gateway integration
│   ├── email.ts        # Enhanced email service
│   └── gemini.ts       # AI meal plan generation
├── hooks/              # Custom React hooks
├── scripts/            # SQL for Supabase (schema, seed)
├── styles/             # Tailwind/global styles
├── public/             # PWA manifest + assets
├── __tests__/          # Unit/integration tests
└── .env.local          # Local environment config
```

## 🆕 New Features Added

### Enhanced PDF Generation
- Professional invoice PDFs with branding
- Meal plan PDFs with proper formatting and page breaks
- Error handling and download utilities

### Multi-Provider Notifications
- **Email**: SendGrid, Resend support
- **SMS**: Twilio, OVH SMS support
- Pre-built templates for common notifications
- Fallback to mailto for unconfigured services

### Payment Integration
- **Stripe & PayPal** support with webhooks
- Secure payment intent creation
- Automatic invoice status updates
- Comprehensive error handling

### API Endpoints
- `/api/payments` - Payment processing
- `/api/payments/webhook` - Payment webhooks
- `/api/notifications` - Send emails/SMS
