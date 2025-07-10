# 🥗 NutriFlow - Professional Nutrition Management Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?logo=next.js&logoColor=white)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

---

# What is NutriFlow?

**NutriFlow** is a comprehensive SaaS platform for registered dietitians and nutritionists. It streamlines practice management, client care, and meal planning workflows. NutriFlow combines AI-powered meal plan generation, robust client management, analytics, invoicing, and more, all built with modern web technologies and enterprise-grade security.

---

# 🎯 Features Overview

## ✅ Production-Ready Features
- User authentication and profile management (Supabase Auth)
- Client management with progress tracking
- AI-powered meal plan generation (Google Gemini)
- Custom meal plan creation and templates
- Recipe and template library
- Appointment scheduling and calendar
- Settings and preferences
- Dashboard analytics and reporting
- PWA/mobile support

## ⚠️ Partially Implemented Features
- PDF export (UI ready, implementation partial)
- Email/SMS notifications (UI ready, backend integration needed)
- Payment processing (basic invoicing, payment gateway needed)
- Real-time messaging (planned)
- Advanced nutritional analysis (planned)
- Food database integration (planned)

## ❌ Planned Features
- Mobile application (React Native)
- Multi-language support
- Advanced reporting and analytics
- Client self-service portal
- Telehealth/video consultations
- Group coaching, marketplace, EHR integrations

---

# 🏗️ Architecture & Technology Stack

## Frontend
- **Next.js 15** (App Router)
- **React 19**
- **TypeScript**
- **Tailwind CSS**
- **Radix UI**
- **Lucide React**
- **React Hook Form**
- **Zod** (validation)
- **PWA support**

## Backend & Database
- **Supabase** (PostgreSQL, Auth, RLS, real-time)
- **Next.js API routes**
- **Row Level Security (RLS)**

## Integrations
- **Google Gemini AI** (meal plan generation)
- **Stripe, PayPal, SumUp, Lydia Pro** (payments)
- **SendGrid, Resend, Twilio, OVH** (email/SMS)
- **jsPDF** (PDF export)
- **Nutritionix, USDA** (food database, planned)

## DevOps & Tooling
- **ESLint, Prettier**
- **pnpm**
- **PostCSS**
- **Service Worker** (offline/PWA)
- **Sentry, LogRocket** (monitoring)

---

# 📁 Project Structure

```
SaasNutriFlowV2/
├── app/                # Next.js App Router (pages, API, dashboard, auth, portal)
│   ├── dashboard/      # Main dashboard features
│   ├── client-portal/  # Client self-service portal
│   ├── auth/           # Authentication flows
│   ├── api/            # API routes
│   └── ...
├── components/         # Reusable UI components
│   ├── ui/             # Base UI (shadcn/ui)
│   ├── auth/           # Auth components
│   └── ...
├── lib/                # Utility libraries (supabase, AI, PDF, payments, etc.)
├── hooks/              # Custom React hooks
├── scripts/            # Database SQL scripts
├── public/             # Static assets, manifest, service worker
├── styles/             # Global styles
├── __tests__/          # Tests
├── package.json        # Dependencies
└── ...
```

---

# 🧩 Feature-by-Feature Breakdown

## Dashboard
- Real-time stats, recent activity, quick actions, calendar integration

## Clients Management
- CRUD for client profiles, search/filter, weight tracking, notes, goals

## Meal Plans
- AI-powered generation, custom creation, templates, assignment, status
- PDF export (partial), client sharing (planned)

## Recipe Templates
- Create/manage recipes, categorize, track cooking time/difficulty

## Appointments & Calendar
- Scheduling, calendar view, recurring appointments, reminders
- Video integration (basic), external sync (planned)

## Reminders
- Create/schedule reminders, multi-channel (email/SMS), targeting
- Automated workflows (planned)

## Invoices
- Create/manage invoices, billing, status, PDF export (partial)
- Payment integration (planned)

## Messaging
- Internal messaging (planned), templates, attachments (planned)

## Client Portal
- Self-service dashboard for clients (planned)

## Settings
- Profile, notifications, practice info, security

---

# 🗄️ Database Schema (Main Tables)

- `profiles` - Dietitian profiles
- `clients` - Client records
- `meal_plans` - Meal plans (JSON content)
- `weight_history` - Client weight tracking
- `messages` - Dietitian-client communication
- `appointments` - Scheduling
- `reminders` - Automated reminders
- `invoices` - Billing
- `recipe_templates` - Recipe library
- `meal_plan_templates` - Plan templates

All tables use **Row Level Security (RLS)** for data isolation.

---

# 🔐 Security & Compliance

- **Supabase Auth** for secure authentication
- **RLS** on all tables (multi-tenancy)
- **HIPAA-minded** design
- **Data encryption** in transit and at rest
- **Audit logging** and regular security updates
- **Rate limiting** on API endpoints
- **CSRF protection, security headers**

---

# 🌐 API Overview

See `API_DOCUMENTATION.md` for full details. Highlights:

- **RESTful API** via Next.js API routes
- **Auth endpoints**: `/api/auth/signup`, `/api/auth/signin`, `/api/auth/signout`
- **Client management**: `/api/clients` (CRUD)
- **Meal plans**: `/api/meal-plans` (CRUD, AI generation)
- **Appointments**: `/api/appointments`
- **Invoices**: `/api/invoices`
- **Reminders**: `/api/reminders`
- **Nutrition analysis**: `/api/nutrition/analyze`
- **Webhooks**: Real-time event notifications
- **Rate limiting**: Per-user and per-IP
- **Consistent error handling**

---

# 🚀 Setup & Local Development

## Prerequisites
- Node.js 18+
- pnpm (or npm/yarn)
- Supabase account

## 1. Clone the Repository
```bash
git clone [repository-url]
cd SaasNutriFlowV2
```

## 2. Install Dependencies
```bash
pnpm install
```

## 3. Environment Setup
Create a `.env.local` file:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GEMINI_API_KEY=your_google_gemini_api_key
# ... (see README_ENHANCED.md for all options)
```

## 4. Database Setup
```bash
# Run schema in Supabase SQL editor
cat scripts/enhanced-schema.sql
# Optionally seed data
cat scripts/seed-data.sql
```

## 5. Start Development Server
```bash
pnpm dev
```

## 6. Access the App
Open [http://localhost:3000](http://localhost:3000)

## 7. Build for Production
```bash
pnpm build
pnpm start
```

---

# 🛡️ Deployment & Production

- **Vercel** (recommended), Netlify, or custom server
- Set all environment variables securely
- Enable HTTPS, security headers, rate limiting
- Run all tests, type checks, and linting before deploy
- See `DEPLOYMENT.md` for full checklist

---

# 👥 Target Audience & Use Cases

- **Registered Dietitians & Nutritionists** (solo, clinics, sports, clinical, wellness)
- **Use Cases:**
  - Private practice management
  - Clinical nutrition therapy
  - Sports nutrition
  - Corporate wellness
  - Telehealth/remote consultations

---

# 🗺️ Roadmap

1. **Core features**: PDF export, messaging, advanced analytics
2. **AI/ML**: Predictive analytics, smart recommendations
3. **Mobile app**: React Native, offline, push notifications
4. **Integrations**: EHR, fitness trackers, third-party apps
5. **Enterprise**: Multi-location, staff/role management, advanced compliance

---

# 🤝 Contributing

We welcome contributions! Please:
- Report bugs and issues
- Suggest new features
- Submit pull requests
- Follow our coding standards (see `DEVELOPMENT.md`)

---

# 📞 Support

- **Documentation**: [Link to docs]
- **Community Forum**: [Link to forum]
- **Email**: support@nutriflow.com
- **Issue Tracker**: GitHub Issues

---

**NutriFlow** represents the future of nutrition practice management, combining the efficiency of modern technology with the personal touch that clients expect from their nutrition professionals. Built by developers who understand the unique needs of dietitians and nutritionists in today's digital healthcare landscape.
