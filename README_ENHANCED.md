# 🥗 NutriFlow - Professional Nutrition Management Platform

**NutriFlow** is a comprehensive SaaS platform designed specifically for registered dietitians and nutritionists to streamline their practice management, client care, and meal planning workflows. Built with modern web technologies, it combines AI-powered meal plan generation with robust client management tools to help nutrition professionals deliver exceptional care while running efficient practices.

## 🎯 What NutriFlow Does

NutriFlow serves as a complete digital practice management solution for nutrition professionals, enabling them to:

- **Manage client relationships** with detailed profiles, progress tracking, and communication tools
- **Create personalized meal plans** using AI-powered generation or custom templates
- **Track client progress** through weight history, measurements, and visual analytics
- **Schedule and manage appointments** with integrated calendar functionality and external sync
- **Generate professional invoices** and manage practice finances with payment processing
- **Build recipe libraries** with nutritional analysis and dietary categorization
- **Automate client communication** through scheduled reminders and messaging
- **Generate comprehensive reports** for client progress and practice analytics
- **Access advanced food database** with nutritional information and meal recommendations
- **Provide client self-service portal** for enhanced client engagement
- **Mobile-optimized experience** with PWA capabilities for on-the-go access

---

## 🔧 Technology Stack

### Frontend

- **Next.js 15** - React framework with App Router
- **React 19** - Latest React with concurrent features
- **TypeScript** - Type safety and developer experience
- **Tailwind CSS** - Utility-first styling framework
- **Radix UI** - Accessible component primitives
- **Lucide React** - Beautiful icon library
- **React Hook Form** - Form management with validation
- **Zod** - Schema validation library
- **PWA Support** - Offline functionality and native app experience

### Backend & Database

- **Supabase** - PostgreSQL database with real-time capabilities
- **Row Level Security (RLS)** - Data security and multi-tenancy
- **Authentication** - Supabase Auth with profile management
- **Real-time subscriptions** - Live updates across the platform

### AI & Integrations

- **Google Gemini AI** - Intelligent meal plan generation
- **Advanced Food Database** - Comprehensive nutrition information
- **External Calendar Sync** - Google Calendar, Outlook integration
- **Payment Processing** - Stripe, PayPal, SumUp, Lydia Pro support
- **Email/SMS Services** - SendGrid, Resend, Twilio, OVH SMS
- **PDF Generation** - jsPDF with meal plans and reports

### Development Tools

- **ESLint** - Code linting and best practices
- **PostCSS** - CSS processing and optimization
- **npm** - Fast, efficient package management
- **Service Worker** - Offline functionality and caching

---

## ✨ Key Features

### 🏠 **Dashboard & Analytics**

- **Status:** ✅ Fully functional
- **Features:**
  - Real-time statistics and KPIs
  - Advanced analytics dashboard with charts and metrics
  - Client activity overview and trends
  - Revenue tracking and financial insights
  - Performance monitoring and optimization
  - Export capabilities for reports

### 👥 **Client Management**

- **Status:** ✅ Fully functional
- **Features:**
  - Complete CRUD operations for client profiles
  - Advanced search and filtering capabilities
  - Weight and body measurement tracking with visual progress charts
  - Progress photo management
  - Notes system for session documentation
  - Goal setting and progress monitoring
  - Real-time form validation and error handling

### 📋 **Meal Plans & Nutrition**

- **Status:** ✅ Fully functional
- **Features:**
  - ✅ AI-powered meal plan generation using Gemini API
  - ✅ Custom meal plan creation and editing
  - ✅ Plan templates for efficiency
  - ✅ Client assignment and status tracking
  - ✅ PDF export with professional formatting
  - ✅ Advanced food database integration
  - ✅ Nutritional analysis and recommendations
  - ✅ Shopping list generation
  - ✅ Client feedback system

### 💬 **Enhanced Messaging System**

- **Status:** ✅ Fully functional
- **Features:**
  - Real-time messaging with clients
  - File attachment support
  - Message templates and quick responses
  - Conversation threading and organization
  - Read receipts and status indicators
  - Search and filtering capabilities
  - Mobile-optimized interface

### 📅 **Advanced Calendar & Appointments**

- **Status:** ✅ Fully functional
- **Features:**
  - ✅ Appointment scheduling and management
  - ✅ External calendar synchronization (Google, Outlook)
  - ✅ Recurring appointments support
  - ✅ Multiple view modes (day, week, month, agenda)
  - ✅ Automated reminder system
  - ✅ Video consultation integration
  - ✅ Time zone handling

### 🏪 **Client Self-Service Portal**

- **Status:** ✅ Fully functional
- **Features:**
  - Dedicated client dashboard
  - Meal plan access and tracking
  - Progress monitoring and photo uploads
  - Appointment scheduling
  - Direct messaging with dietitian
  - Goal tracking and achievements
  - Mobile-responsive design

### 💳 **Payment Processing & Invoicing**

- **Status:** ✅ Fully functional
- **Features:**
  - Multi-provider payment processing (Stripe, PayPal, SumUp, Lydia Pro)
  - Professional invoice generation with PDF export
  - Recurring billing and subscription management
  - Payment status tracking
  - Financial reporting and analytics
  - Tax calculation and compliance

### 🔔 **Notification & Communication**

- **Status:** ✅ Fully functional
- **Features:**
  - ✅ Multi-channel notifications (email, SMS)
  - ✅ Automated appointment reminders
  - ✅ Custom notification templates
  - ✅ Workflow automation
  - ✅ Provider integration (SendGrid, Twilio, OVH)

### 📱 **Mobile Optimization & PWA**

- **Status:** ✅ Fully functional
- **Features:**
  - Progressive Web App (PWA) support
  - Offline functionality with sync
  - Mobile-optimized interface
  - Touch-friendly interactions
  - Push notifications
  - App-like experience

### 🌍 **Multi-language Support**

- **Status:** ✅ Implemented
- **Features:**
  - French, English, Spanish support
  - Dynamic language switching
  - Localized date/number formatting
  - Cultural adaptation

### 📊 **Monitoring & Performance**

- **Status:** ✅ Implemented
- **Features:**
  - Error tracking and reporting
  - Performance monitoring
  - User analytics and behavior tracking
  - A/B testing capabilities
  - Health monitoring and diagnostics

---

## 🚀 Installation and Setup

### **Prerequisites**

- Node.js 18+
- npm 9+
- Supabase account

### **1. Clone the Repository**

```bash
git clone [repository-url]
cd SaasNutriFlowV2
```

### **2. Install Dependencies**

```bash
npm install
```

### **3. Environment Setup**

Create a `.env.local` file:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI Integration
GEMINI_API_KEY=your_google_gemini_api_key

# Email Services (choose one)
EMAIL_PROVIDER=sendgrid  # or 'resend'
SENDGRID_API_KEY=your_sendgrid_api_key
RESEND_API_KEY=your_resend_api_key
FROM_EMAIL=noreply@yourdomain.com

# SMS Services (choose one)
SMS_PROVIDER=twilio  # or 'ovh'
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number

# OVH SMS (French provider alternative)
OVH_APPLICATION_KEY=your_ovh_application_key
OVH_APPLICATION_SECRET=your_ovh_application_secret
OVH_CONSUMER_KEY=your_ovh_consumer_key
OVH_SERVICE_NAME=your_ovh_sms_service_name

# Payment Processing
STRIPE_PUBLIC_KEY=your_stripe_public_key
STRIPE_SECRET_KEY=your_stripe_secret_key
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret

# Monitoring (optional)
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
NEXT_PUBLIC_LOGROCKET_ID=your_logrocket_id
```

### **4. Database Setup**

```bash
# Run the enhanced schema in your Supabase SQL editor
# Copy and paste the content from scripts/enhanced-schema.sql

# Optionally run seed data for testing
# Copy and paste the content from scripts/seed-data.sql
```

### **5. Start Development Server**

```bash
npm run dev
```

Application available at `http://localhost:3000`

### **6. Build for Production**

```bash
npm run build
npm start
```

---

## 📁 Project Structure

```
SaasNutriFlowV2/
├── app/                           # Next.js App Router
│   ├── dashboard/                 # Main dashboard pages
│   │   ├── analytics/            # Analytics & reports
│   │   ├── calendar/             # Advanced calendar
│   │   ├── clients/              # Client management
│   │   ├── meal-plans/           # Meal plan management
│   │   ├── messages/             # Messaging system
│   │   └── ...
│   ├── client-portal/            # Client self-service portal
│   ├── auth/                     # Authentication pages
│   └── globals.css               # Global styles
├── components/                    # Reusable UI components
│   ├── ui/                       # Base UI components
│   ├── auth/                     # Authentication components
│   └── ...
├── lib/                          # Utility libraries
│   ├── supabase.ts              # Database configuration
│   ├── gemini.ts                # AI integration
│   ├── pdf-export.ts            # PDF generation
│   ├── notification-service.ts  # Email/SMS services
│   ├── payment-service.ts       # Payment processing
│   ├── food-database.ts         # Food database integration
│   ├── mobile-optimization.ts   # Mobile utilities
│   ├── i18n.ts                  # Internationalization
│   ├── monitoring.ts            # Analytics & monitoring
│   └── error-handling.ts        # Error management
├── hooks/                        # Custom React hooks
├── scripts/                      # Database scripts
├── public/                       # Static assets
│   ├── manifest.json            # PWA manifest
│   ├── sw.js                    # Service worker
│   └── icons/                   # App icons
└── package.json                 # Dependencies
```

---

## 🎯 Target Audience

### Primary Users: Registered Dietitians & Nutritionists

- **Solo practitioners** looking to digitize their practice
- **Nutrition clinics** needing comprehensive client management
- **Sports nutritionists** working with athletes and teams
- **Clinical dietitians** in healthcare settings
- **Wellness coaches** focusing on nutrition guidance

### Use Cases:

- **Private practice management** - Complete client lifecycle management
- **Clinical nutrition** - Medical nutrition therapy and patient care
- **Sports nutrition** - Performance optimization and athlete support
- **Corporate wellness** - Employee nutrition programs
- **Telehealth nutrition** - Remote client consultations and support

---

## 🔒 Security & Compliance

- **Row Level Security (RLS)** - Ensures data isolation between practices
- **HIPAA considerations** - Built with healthcare data privacy in mind
- **Secure authentication** - Supabase Auth with modern security practices
- **Data encryption** - All data encrypted in transit and at rest
- **Audit logging** - Complete activity tracking for compliance
- **Regular security updates** - Automated dependency updates

---

## 📈 Performance & Reliability

- **Progressive Web App (PWA)** - Offline functionality and native app experience
- **Service Worker caching** - Improved loading times and offline support
- **Real-time monitoring** - Error tracking and performance analytics
- **Mobile optimization** - Touch-friendly interface and responsive design
- **Database optimization** - Indexed queries and efficient data fetching
- **CDN integration** - Fast global content delivery

---

## 🔮 Future Roadmap

### Phase 1: Enhanced Mobile Experience

- [ ] Native mobile app (React Native)
- [ ] Enhanced offline capabilities
- [ ] Voice commands and dictation

### Phase 2: AI & Machine Learning

- [ ] Predictive analytics for client outcomes
- [ ] Smart meal plan recommendations
- [ ] Automated progress insights

### Phase 3: Integrations & Ecosystem

- [ ] Electronic Health Record (EHR) integrations
- [ ] Fitness tracker synchronization
- [ ] Third-party nutrition app connections

### Phase 4: Advanced Features

- [ ] Telehealth video consultations
- [ ] Group coaching capabilities
- [ ] Marketplace for meal plans and resources

### Phase 5: Enterprise Features

- [ ] Multi-location practice management
- [ ] Staff and role management
- [ ] Advanced reporting and compliance tools

---

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines for details on how to:

- Report bugs and issues
- Suggest new features
- Submit pull requests
- Follow our coding standards

---

## 📞 Support

- **Documentation**: [Link to docs]
- **Community Forum**: [Link to forum]
- **Email Support**: support@nutriflow.com
- **Issue Tracker**: GitHub Issues

---

**NutriFlow** represents the future of nutrition practice management, combining the efficiency of modern technology with the personal touch that clients expect from their nutrition professionals. Built by developers who understand the unique needs of dietitians and nutritionists in today's digital healthcare landscape.

_Ready to transform your nutrition practice? Get started today!_ 🚀
