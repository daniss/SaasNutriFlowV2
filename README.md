# 🥗 NutriFlow - Professional Nutrition Management Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?logo=next.js&logoColor=white)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

**NutriFlow** is a comprehensive, production-ready SaaS platform designed specifically for registered dietitians and nutritionists to streamline their practice management, client care, and meal planning workflows. Built with modern web technologies and enterprise-grade security, it combines AI-powered meal plan generation with robust client management tools to help nutrition professionals deliver exceptional care while running efficient practices.

## ✨ Key Features

### 🔐 **Authentication & Security**
- Secure user authentication with Supabase Auth
- Row-level security (RLS) for data protection
- Role-based access control (Nutritionist/Client)
- Security headers and CSRF protection
- Rate limiting and API security

### 👥 **Client Management**
- Complete client profiles with medical history
- Progress tracking with weight, measurements, and photos
- Dietary restrictions and preference management
- Goal setting and achievement tracking
- Communication history and notes

### 🍽️ **Intelligent Meal Planning**
- AI-powered meal plan generation using Google Gemini
- Custom meal plan creation tools
- Recipe database with nutritional analysis
- Dietary restriction compliance
- Meal plan templates and duplication
- PDF export for client distribution

### 📊 **Advanced Analytics & Reporting**
- Comprehensive dashboard with key metrics
- Client progress visualization
- Revenue tracking and financial insights
- Custom date range filtering
- Exportable reports (PDF, CSV)
- Performance monitoring

### 📅 **Calendar & Appointment Management**
- Integrated scheduling system
- Appointment types and duration management
- Recurring appointment support
- External calendar synchronization
- Automated reminders via email/SMS
- Agenda and month views

### 💰 **Financial Management**
- Professional invoice generation
- Payment tracking and status management
- Revenue reporting and analytics
- Multiple payment method support
- Automated payment reminders
- Financial dashboard

### 📧 **Communication & Notifications**
- Email notification system (Resend/SendGrid)
- SMS notifications (Twilio integration)
- Automated appointment reminders
- Custom message templates
- Client portal messaging
- System notifications

### 🏥 **Client Portal**
- Self-service client dashboard
- Meal plan access and tracking
- Progress monitoring tools
- Appointment scheduling
- Direct messaging with nutritionist
- Resource downloads

### 📱 **Modern User Experience**
- Responsive design for all devices
- Progressive Web App (PWA) support
- Offline functionality
- Dark/light theme support
- Intuitive navigation
- Accessibility compliance

### 🔧 **Advanced Integrations**
- Food database APIs (Nutritionix, USDA)
- Payment processing (Stripe, PayPal)
- Email services (Resend, SendGrid, SMTP)
- SMS services (Twilio)
- External calendar sync
- File storage (AWS S3)

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

### Backend & Database
- **Supabase** - PostgreSQL database with real-time capabilities
- **Row Level Security (RLS)** - Data security and multi-tenancy
- **Authentication** - Supabase Auth with profile management

### AI & Integrations
- **Google Gemini AI** - Intelligent meal plan generation
- **jsPDF** - PDF generation for reports and meal plans
- **React Charts** - Data visualization for progress tracking

### Development Tools
- **ESLint** - Code linting and best practices
- **PostCSS** - CSS processing and optimization
- **pnpm** - Fast, efficient package management

---

## 🧩 Page-by-Page Feature Breakdown

### 🏠 **Tableau de bord (Dashboard)**
- **Status:** ✅ Fully functional
- **Features:** 
  - Real-time statistics (total clients, active meal plans)
  - Recent client activity overview
  - Quick action buttons for common tasks
  - Monthly appointment calendar integration
  - Professional welcome interface with personalization

### 👥 **Clients Management**
- **Status:** ✅ Fully functional
- **Features:**
  - Complete CRUD operations for client profiles
  - Advanced search and filtering capabilities
  - Weight tracking with visual progress charts
  - Notes system for session documentation
  - Goal setting and progress monitoring
  - Real-time form validation and error handling

### 📋 **Plans Alimentaires (Meal Plans)**
- **Status:** ⚠️ Core functional, some features in progress
- **Features:**
  - ✅ AI-powered meal plan generation using Gemini API
  - ✅ Custom meal plan creation and editing
  - ✅ Plan templates for efficiency
  - ✅ Client assignment and status tracking
  - ⚠️ Individual meal editing (UI ready, logic partial)
  - ❌ PDF export (button ready, implementation needed)
  - ❌ Client sharing (UI ready, backend needed)

### 👨‍🍳 **Bibliothèque de recettes (Recipe Templates)**
- **Status:** ✅ Fully functional
- **Features:**
  - Recipe template creation with detailed ingredients
  - Meal plan template library
  - Categorization by dietary preferences
  - Cooking time and difficulty tracking
  - Reusable template system for efficiency

### 📅 **Rendez-vous (Appointments)**
- **Status:** ⚠️ Core functional, integrations needed
- **Features:**
  - ✅ Appointment scheduling and management
  - ✅ Client assignment and status tracking
  - ✅ Calendar view with time slot management
  - ⚠️ Virtual meeting integration (basic implementation)
  - ❌ Email notifications (UI ready)
  - ❌ Calendar sync (planned feature)

### � **Rappels (Reminders)**
- **Status:** ⚠️ UI complete, backend integration needed
- **Features:**
  - ✅ Reminder creation and scheduling
  - ✅ Multi-channel preferences (email, SMS)
  - ✅ Client targeting and personalization
  - ❌ Actual email/SMS delivery (integration needed)
  - ❌ Automated reminder workflows

### 💰 **Factures (Invoices)**
- **Status:** ⚠️ Core functional, payment integration needed
- **Features:**
  - ✅ Invoice creation and management
  - ✅ Client billing and service tracking
  - ✅ Status management (draft, sent, paid)
  - ⚠️ PDF generation (partial implementation)
  - ❌ Payment processing integration
  - ❌ Automated payment reminders

### ⚙️ **Paramètres (Settings)**
- **Status:** ✅ Fully functional
- **Features:**
  - Complete profile management for dietitians
  - Notification preferences configuration
  - Practice information and contact details
  - Account security and password management

### **🏠 Dashboard Principal**
```
/dashboard - Tableau de bord principal
├── Stats générales (clients, plans actifs)
├── Activité récente
├── Clients récents
└── Plans alimentaires récents
```

### **👥 Gestion des Clients**
```
/dashboard/clients - Liste des clients
├── Recherche et filtres
├── Ajout nouveau client (avec validation)
├── Statuts et badges
└── Actions rapides

/dashboard/clients/[id] - Détail client
├── Onglet "Progrès" (graphiques de poids)
├── Onglet "Profil complet" (informations personnelles)
├── Onglet "Notes privées" (notes du diététicien)
├── Suivi du poids avec historique
└── Édition des informations
```

### **� Plans Alimentaires**
```
/dashboard/meal-plans - Liste des plans
├── Création de nouveaux plans
├── Attribution aux clients
├── Gestion des statuts
├── Duplication de plans
└── Filtres par statut

/dashboard/meal-plans/[id] - Détail du plan
├── Aperçu du plan (durée, calories)
├── Plans repas quotidiens
├── Informations client
├── Actions rapides (partage, export)
└── Édition des paramètres

/dashboard/meal-plans/generate - Générateur IA (prévu)
```

### **👨‍🍳 Bibliothèque de Ressources**
```
/dashboard/templates - Modèles et recettes
├── Onglet "Recettes" (modèles de recettes)
├── Onglet "Plans alimentaires" (modèles de plans)
├── Catégorisation
├── Système de favoris
└── Recherche avancée
```

### **📅 Agenda & Rendez-vous**
```
/dashboard/appointments - Gestion des rendez-vous
├── Vue calendrier
├── Création/édition de rendez-vous
├── Gestion des types (consultation, suivi)
├── Support vidéo (liens de réunion)
├── Statuts (programmé, terminé, annulé)
└── Durée personnalisable
```

### **🔔 Système de Rappels**
```
/dashboard/reminders - Gestion des rappels
├── Rappels programmés
├── Types multiples (check-in, rendez-vous, suivi)
├── Récurrence (quotidien, hebdomadaire)
├── Canaux multiples (email, SMS prévu)
├── Suivi des statuts
└── Templates de messages
```

### **💳 Facturation**
```
/dashboard/invoices - Gestion des factures
├── Liste des factures
├── Création/édition
├── Statuts (brouillon, envoyée, payée)
├── Gestion des échéances
├── Association aux clients
└── Génération PDF (prévu)
```

### **⚙️ Configuration**
```
/dashboard/settings - Paramètres
├── Profil professionnel
├── Informations de contact
├── Préférences de notifications
├── Configuration de la pratique (prévu)
└── Gestion des données
```

---

## 📊 **Base de Données - Schema Principal**

### **Tables Principales**
```sql
profiles - Profils des diététiciens
clients - Base clients avec informations détaillées
meal_plans - Plans alimentaires avec contenu JSON
weight_history - Historique de poids des clients
messages - Communication diététicien-client
appointments - Rendez-vous et consultations
reminders - Système de rappels automatiques
invoices - Facturation et paiements
recipe_templates - Bibliothèque de recettes
meal_plan_templates - Modèles de plans alimentaires
```

### **Sécurité**
- **RLS (Row Level Security)** activé sur toutes les tables
- Politique d'accès basée sur `dietitian_id`
- Authentification Supabase avec JWT
- Validation côté client et serveur

---

## 🚀 **Installation et Lancement Local**

### **Prérequis**
- Node.js 18+ 
- npm/yarn/pnpm
- Compte Supabase

### **1. Cloner le Projet**
```bash
git clone [URL_DU_REPO]
cd SaasNutriFlowV2
```

### **2. Installation des Dépendances**
```bash
npm install
# ou
pnpm install
```

### **3. Configuration Environnement**
Créer `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=votre_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_cle_publique
SUPABASE_SERVICE_ROLE_KEY=votre_cle_service
GEMINI_API_KEY=votre_cle_gemini
```

### **4. Configuration Base de Données**
```bash
# Exécuter le schema SQL sur Supabase
psql -h [HOST] -U [USER] -d [DB] -f scripts/supabase-schema.sql

# Optionnel: données de test
psql -h [HOST] -U [USER] -d [DB] -f scripts/seed-data.sql
```

### **5. Lancement en Développement**
```bash
npm run dev
```

Application disponible sur `http://localhost:3000`

### **6. Build de Production**
```bash
npm run build
npm start
```

---

## 🚀 Local Development Setup

### Prerequisites
- **Node.js 18+** - JavaScript runtime
- **pnpm** - Package manager (or npm/yarn)
- **Supabase account** - For database and authentication

### Installation Steps

1. **Clone the repository:**
```bash
git clone [repository-url]
cd SaasNutriFlowV2
```

2. **Install dependencies:**
```bash
pnpm install
```

3. **Environment setup:**
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GEMINI_API_KEY=your_google_gemini_api_key
```

4. **Database setup:**
```bash
# Run the schema setup in your Supabase SQL editor
cat scripts/supabase-schema.sql
# Then optionally run seed data
cat scripts/seed-data.sql
```

5. **Start development server:**
```bash
pnpm dev
```

6. **Access the application:**
Open [http://localhost:3000](http://localhost:3000) in your browser

### Development Commands
```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
```

## 🤝 Target Audience

### Primary Users: Registered Dietitians & Nutritionists
- **Solo practitioners** looking to digitize their practice
- **Nutrition clinics** needing client management solutions
- **Sports nutritionists** working with athletes and teams
- **Clinical dietitians** in healthcare settings
- **Wellness coaches** focusing on nutrition guidance

### Use Cases:
- **Private practice management** - Client intake, meal planning, progress tracking
- **Clinical nutrition** - Medical nutrition therapy and patient care
- **Sports nutrition** - Performance optimization and athlete support
- **Corporate wellness** - Employee nutrition programs
- **Telehealth nutrition** - Remote client consultations and support

## 📊 Current Feature Status

### ✅ Production Ready Features
- User authentication and profile management
- Client management with progress tracking
- Basic meal plan creation and management
- Recipe and template library
- Appointment scheduling
- Settings and preferences

### ⚠️ Partially Implemented Features
- AI meal plan generation (functional but needs refinement)
- PDF export functionality (UI ready, implementation needed)
- Email notifications (UI ready, backend integration needed)
- Payment processing (basic invoicing, payment gateway needed)

### ❌ Planned Features
- Real-time client messaging system
- Advanced nutritional analysis tools
- Food database integration
- Mobile application
- Multi-language support
- Advanced reporting and analytics
- Client self-service portal

## 🔒 Security & Compliance

- **Row Level Security (RLS)** - Ensures data isolation between practices
- **HIPAA considerations** - Built with healthcare data privacy in mind
- **Secure authentication** - Supabase Auth with modern security practices
- **Data encryption** - All data encrypted in transit and at rest

## 📈 Future Roadmap

1. **Phase 1:** Complete core feature implementation (PDF export, messaging)
2. **Phase 2:** Advanced nutrition analysis and food database integration
3. **Phase 3:** Mobile application and client portal
4. **Phase 4:** Practice analytics and reporting suite
5. **Phase 5:** Third-party integrations (calendars, EMR systems)

---

**NutriFlow** represents the future of nutrition practice management, combining the efficiency of modern technology with the personal touch that clients expect from their nutrition professionals. Built by developers who understand the unique needs of dietitians and nutritionists in today's digital healthcare landscape.
