# Environment Setup Guide

This guide helps you set up the development environment securely with all required API keys and configuration.

## 🔐 Required Environment Variables

Create a `.env.local` file in the project root with the following variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# AI Services
GOOGLE_GEMINI_API_KEY=your_gemini_api_key_here

# Authentication
CLIENT_AUTH_SECRET=your_secure_random_string_here

# Payment Processing (optional)
STRIPE_SECRET_KEY=your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret_here

# MCP Server (for development with Claude Code)
SUPABASE_ACCESS_TOKEN=your_supabase_access_token_here
```

## 🛠️ Setup Steps

### 1. Supabase Configuration
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to Settings → API
3. Copy the Project URL → `NEXT_PUBLIC_SUPABASE_URL`
4. Copy the anon/public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Copy the service_role key → `SUPABASE_SERVICE_ROLE_KEY`

### 2. Google Gemini API
1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Create an API key
3. Copy the key → `GOOGLE_GEMINI_API_KEY`

### 3. Client Authentication Secret
Generate a secure random string:
```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Using OpenSSL
openssl rand -hex 32
```

### 4. MCP Configuration (for Claude Code)
1. Copy the template: `cp .mcp.json.template .mcp.json`
2. Get your Supabase access token from Settings → Access Tokens
3. Set the environment variable: `export SUPABASE_ACCESS_TOKEN="your_token"`
4. Update the project reference in `.mcp.json` if needed

### 5. Stripe (Optional - for payments)
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Navigate to Developers → API keys
3. Copy the secret key → `STRIPE_SECRET_KEY`
4. Set up webhooks and copy the signing secret → `STRIPE_WEBHOOK_SECRET`

## 🔒 Security Checklist

- [ ] All API keys are in `.env.local` (not committed to git)
- [ ] `.mcp.json` is configured with environment variables
- [ ] No hardcoded secrets in source code
- [ ] Environment variables are set in deployment platform
- [ ] Old/leaked keys have been revoked and regenerated

## 🚀 Running the Application

```bash
# Install dependencies
npm install

# Run type checking
npm run type-check

# Start development server
npm run dev

# Build for production
npm run build
```

## ⚠️ Security Notes

1. **Never commit** `.env.local` or `.mcp.json` to version control
2. **Rotate keys regularly** especially if they may have been exposed
3. **Use least privilege** - only grant necessary permissions
4. **Monitor usage** of API keys for unusual activity
5. **Keep dependencies updated** to avoid security vulnerabilities

## 🆘 If Keys Are Compromised

1. **Immediately revoke** the compromised keys
2. **Generate new keys** with fresh credentials
3. **Update environment variables** in all environments
4. **Review logs** for any unauthorized usage
5. **Notify team members** if in a shared environment