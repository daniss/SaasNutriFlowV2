# NutriFlow - Dietitian Dashboard 🥗

A modern SaaS platform designed for independent dietitians to streamline their practice management, featuring client management, AI-powered meal planning, automated reminders, and integrated invoicing.

## 🚀 Features

- **Client Management**: Comprehensive client profiles with health goals, dietary restrictions, and progress tracking
- **AI-Powered Meal Planning**: Generate personalized meal plans using Google's Gemini AI
- **Automated Reminders**: Send appointment and follow-up reminders to clients
- **Invoice Management**: Create and track invoices for your services
- **Dashboard Analytics**: Overview of practice metrics and performance
- **Secure Authentication**: User authentication and authorization with Supabase
- **Responsive Design**: Modern UI built with Tailwind CSS and Radix UI components

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, Radix UI components
- **Backend**: Supabase (PostgreSQL database, authentication, real-time)
- **AI Integration**: Google Gemini AI for meal plan generation
- **Package Manager**: npm (comes with Node.js), pnpm, or yarn
- **Deployment**: Optimized for Vercel deployment

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (version 18 or higher) - includes npm
- **Git**
- **Package Manager**: npm (included with Node.js) or pnpm/yarn if preferred

## ⚡ Quick Start

1. **Clone and Install**:
   ```bash
   git clone <your-repository-url>
   cd nutriflow
   npm install --legacy-peer-deps
   ```

2. **Set up Environment**: Copy your `.env` file or create `.env.local` with your Supabase and Google API keys

3. **⚠️ IMPORTANT - Set up Database**: 
   - Go to your Supabase SQL Editor
   - Copy and paste the contents of `scripts/supabase-schema.sql`
   - Execute the script to create all necessary tables
   - **This step is required before the app will work properly!**

4. **Run Development Server**:
   ```bash
   npm run dev
   ```

5. **Open in Browser**: Visit [http://localhost:3000](http://localhost:3000)

> **Note**: You'll need to set up Supabase database and Google AI API for full functionality. See detailed setup instructions below.

## 🔧 Installation & Setup

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd nutriflow
```

### 2. Install Dependencies

Using npm (recommended for most users):
```bash
npm install --legacy-peer-deps
```

> **Note**: The `--legacy-peer-deps` flag is needed to resolve dependency conflicts between `date-fns` and `react-day-picker`.

Or using pnpm (if you prefer):
```bash
pnpm install
```

Or using yarn:
```bash
yarn install
```

### 3. Environment Configuration

Copy the environment variables and configure them with your own values:

```bash
cp .env.example .env.local
```

Update the `.env.local` file with your configuration:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Database Configuration (Supabase)
POSTGRES_URL=your_postgres_connection_string
POSTGRES_USER=postgres
POSTGRES_HOST=your_postgres_host
POSTGRES_PASSWORD=your_postgres_password
POSTGRES_DATABASE=postgres

# Google AI Configuration
NEXT_PUBLIC_GEMINI_API_KEY=your_google_gemini_api_key
```

### 4. Database Setup

#### Supabase Setup
1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings > API to get your project URL and API keys
3. Go to Settings > Database to get your database connection string

#### Database Schema
Run the SQL scripts to set up your database:

1. Navigate to your Supabase SQL Editor
2. Copy and paste the contents of `scripts/supabase-schema.sql`
3. Execute the script to create all necessary tables
4. Optionally, run `scripts/seed-data.sql` for sample data

### 5. Google AI Setup

1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Create an API key for Gemini AI
3. Add the API key to your environment variables as `NEXT_PUBLIC_GEMINI_API_KEY`

> **⚠️ Important**: The Google AI API key is **required** for the meal planning feature to work. Without a valid API key, the meal plan generation will fail with an error message.

## 🚀 Running the Application

### Development Mode

Using npm:
```bash
npm run dev
```

Using pnpm:
```bash
pnpm dev
```

Using yarn:
```bash
yarn dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

### Build for Production

Using npm:
```bash
npm run build
```

Using pnpm:
```bash
pnpm build
```

### Start Production Server

Using npm:
```bash
npm start
```

Using pnpm:
```bash
pnpm start
```

### Linting

Using npm:
```bash
npm run lint
```

Using pnpm:
```bash
pnpm lint
```

## 📁 Project Structure

```
nutriflow/
├── app/                        # Next.js App Router
│   ├── auth/                   # Authentication pages
│   ├── dashboard/              # Main dashboard pages
│   │   ├── clients/           # Client management
│   │   ├── meal-plans/        # Meal planning
│   │   ├── reminders/         # Reminder system
│   │   ├── invoices/          # Invoice management
│   │   └── settings/          # Settings page
│   ├── login/                 # Login page
│   └── signup/                # Registration page
├── components/                 # Reusable React components
│   ├── auth/                  # Authentication components
│   ├── ui/                    # UI component library
│   └── [other-components]     # Feature-specific components
├── hooks/                     # Custom React hooks
├── lib/                       # Utility libraries
│   ├── supabase.ts           # Supabase client configuration
│   ├── gemini.ts             # Google AI integration
│   └── utils.ts              # General utilities
├── scripts/                   # Database scripts
│   ├── supabase-schema.sql   # Database schema
│   └── seed-data.sql         # Sample data
└── public/                    # Static assets
```

## 🔐 Authentication Flow

1. **Registration**: Users sign up with email/password
2. **Email Verification**: Supabase sends verification email
3. **Profile Creation**: Additional profile information is stored
4. **Dashboard Access**: Authenticated users access the dashboard

## 📊 Key Features Guide

### Client Management
- Add new clients with detailed profiles
- Track dietary restrictions and health goals
- Monitor client progress over time

### Meal Planning
- Generate AI-powered meal plans
- Customize based on dietary restrictions
- Save and reuse meal plan templates

### Reminders
- Set up automated client reminders
- Schedule follow-up appointments
- Track reminder delivery status

### Invoicing
- Create professional invoices
- Track payment status
- Generate financial reports

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically

### Other Platforms

The application is built with Next.js and can be deployed to:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 🔧 Troubleshooting

### Common Issues

1. **Database Connection Issues**
   - Verify your Supabase credentials
   - Check if your IP is whitelisted in Supabase
   - Ensure RLS policies are properly configured
   - **Most Important**: Run the database schema first! Many errors are caused by missing tables
   - If you see "relation does not exist" errors, you need to create the database tables

2. **AI Integration Issues**
   - Verify your Google AI API key is correct
   - Check API quotas and limits in Google AI Studio
   - Ensure the Gemini AI service is enabled
   - **Meal plans require a valid API key** - the feature will not work without it
   - If you see "Gemini API key is required" error, add `NEXT_PUBLIC_GEMINI_API_KEY` to your `.env.local`
   - Restart the development server after adding the API key

3. **Build Errors**
   - Clear `.next` folder and reinstall dependencies
   - Check TypeScript errors in the build output
   - Verify all environment variables are set

4. **Dependency Resolution Issues (npm)**
   - Use `npm install --legacy-peer-deps` instead of `npm install`
   - Or try `npm install --force` as an alternative
   - This resolves conflicts between date-fns and react-day-picker versions
   - If you see "Can't resolve 'react-is'" error, install it manually: `npm install react-is --legacy-peer-deps`

5. **Supabase Import Errors**
   - If you see `'auth' is not exported from '@/lib/supabase'` or `auth is undefined`, restart the development server
   - Clear `.next` folder: `rm -rf .next` and restart
   - The auth methods are accessed via `supabase.auth`, not a separate export
   - This error can appear in multiple files (`AuthProvider.tsx`, `useAuth.ts`) - all need to be fixed

6. **Authentication Errors**
   - `Invalid login credentials` is normal when:
     - Database tables haven't been created yet (run the SQL schema first)
     - Trying to log in with non-existent account (create account via signup)
     - Email/password combination is incorrect
   - Create a test account via `/signup` page or Supabase dashboard

### Getting Help

- Check the [Issues](your-repo-issues-url) page for known problems
- Review Supabase documentation for database issues
- Check Next.js documentation for framework-related questions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit your changes: `git commit -am 'Add new feature'`
4. Push to the branch: `git push origin feature/new-feature`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) for the React framework
- [Supabase](https://supabase.com/) for backend services
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Radix UI](https://www.radix-ui.com/) for accessible components
- [Google AI](https://ai.google.dev/) for AI-powered features
- [Vercel](https://vercel.com/) for deployment platform

---

**NutriFlow** - Empowering dietitians with modern technology to deliver exceptional client care.
