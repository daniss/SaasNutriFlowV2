# 🚀 Production Deployment Guide for NutriFlow

This guide covers deploying NutriFlow to production with security, performance, and reliability best practices.

## 📋 Pre-Deployment Checklist

### 🔐 Security Requirements
- [ ] All environment variables are set with secure values
- [ ] Database Row Level Security (RLS) policies are enabled
- [ ] API keys are rotated and stored securely
- [ ] HTTPS is enforced in production
- [ ] Security headers are configured
- [ ] Rate limiting is enabled
- [ ] File upload restrictions are in place
- [ ] Input validation is implemented

### 🔧 Environment Configuration
- [ ] Production environment variables are configured
- [ ] Database connection strings are correct
- [ ] External service API keys are valid
- [ ] CDN and static asset configuration
- [ ] Monitoring and logging services are set up

### 🧪 Testing & Quality Assurance
- [ ] All tests pass (`npm run test`)
- [ ] TypeScript compilation succeeds (`npm run type-check`)
- [ ] ESLint checks pass (`npm run lint`)
- [ ] Performance tests are completed
- [ ] Security scanning is performed
- [ ] Database migrations are tested

## 🌐 Deployment Platforms

### Vercel (Recommended)

#### 1. Deploy to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Set environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
# ... add all other environment variables
```

#### 2. Configure Vercel Project
```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  }
}
```

### Netlify

#### 1. Build Configuration
Create `netlify.toml`:
```toml
[build]
  command = "npm run build"
  publish = ".next"

[build.environment]
  NODE_ENV = "production"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

#### 2. Deploy
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod --dir=.next
```

### Docker Deployment

#### 1. Create Dockerfile
```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml* ./
RUN corepack enable pnpm && pnpm i --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1
RUN corepack enable pnpm && pnpm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

#### 2. Docker Compose
```yaml
version: '3.8'
services:
  nutriflow:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
    restart: unless-stopped
    
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - nutriflow
    restart: unless-stopped
```

## 🗄️ Database Setup

### Supabase Production Configuration

#### 1. Database Migration
```sql
-- Run the enhanced schema
\i scripts/enhanced-schema.sql

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can only see their own data" ON profiles
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Nutritionists can see their clients" ON clients
  FOR ALL USING (auth.uid() = nutritionist_id);

-- Add more RLS policies as needed...
```

#### 2. Database Backup Strategy
```bash
# Set up automated backups
pg_dump -h db.xxx.supabase.co -U postgres -d postgres > backup.sql

# Schedule regular backups (crontab)
0 2 * * * pg_dump -h db.xxx.supabase.co -U postgres -d postgres > /backups/nutriflow-$(date +\%Y\%m\%d).sql
```

## 🔒 Security Hardening

### Environment Variables
```bash
# Production environment variables
export NODE_ENV=production
export NEXT_PUBLIC_APP_URL=https://yourdomain.com
export NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
export NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
export SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
export AUTH_SECRET=$(openssl rand -hex 32)
export SESSION_SECRET=$(openssl rand -hex 32)
export ENCRYPTION_KEY=$(openssl rand -hex 32)

# Payment processing (if enabled)
export STRIPE_SECRET_KEY=sk_live_...
export NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
export STRIPE_WEBHOOK_SECRET=whsec_...

# Email service
export RESEND_API_KEY=re_...

# Monitoring
export SENTRY_DSN=https://...
export GOOGLE_ANALYTICS_ID=G-...
```

### SSL/TLS Configuration
```nginx
# nginx.conf
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;

    location / {
        proxy_pass http://nutriflow:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 📊 Monitoring & Observability

### 1. Application Monitoring
```typescript
// lib/monitoring.ts - Already implemented
import { initMonitoring } from '@/lib/monitoring'

// Initialize monitoring in production
if (process.env.NODE_ENV === 'production') {
  initMonitoring()
}
```

### 2. Health Checks
Create `app/api/health/route.ts`:
```typescript
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    // Check database connection
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)

    if (error) {
      throw error
    }

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        application: 'running'
      }
    })
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
```

### 3. Logging Configuration
```typescript
// lib/logger.ts
import winston from 'winston'

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error'
    }),
    new winston.transports.File({
      filename: 'logs/combined.log'
    })
  ]
})

export default logger
```

## 🚦 Performance Optimization

### 1. Next.js Optimization
```javascript
// next.config.mjs additions
const nextConfig = {
  // ... existing config
  
  // Performance optimizations
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons']
  },
  
  // Image optimization
  images: {
    domains: ['your-domain.com'],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60
  },
  
  // Compression
  compress: true,
  
  // Bundle analysis
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      }
    }
    return config
  }
}
```

### 2. CDN Configuration
```javascript
// Configure static asset CDN
const nextConfig = {
  assetPrefix: process.env.NODE_ENV === 'production' 
    ? 'https://cdn.yourdomain.com' 
    : '',
}
```

## 🔄 CI/CD Pipeline

### GitHub Actions
Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm run test
      - run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run build
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

## 📈 Scaling Considerations

### 1. Database Scaling
- Set up read replicas for read-heavy operations
- Implement connection pooling
- Use database indexes for frequently queried fields
- Consider partitioning large tables

### 2. Application Scaling
- Use serverless functions for API routes
- Implement caching at multiple levels
- Use CDN for static assets
- Consider implementing a Redis cache for sessions

### 3. Monitoring Scaling
```typescript
// Implement application metrics
const metrics = {
  apiRequests: new prometheus.Counter({
    name: 'api_requests_total',
    help: 'Total API requests'
  }),
  
  responseTime: new prometheus.Histogram({
    name: 'api_response_time_seconds',
    help: 'API response time'
  })
}
```

## 🆘 Disaster Recovery

### 1. Backup Strategy
- Automated daily database backups
- Application code backup (Git)
- Environment configuration backup
- SSL certificate backup

### 2. Recovery Procedures
1. Database restoration from backup
2. Application redeployment from Git
3. Environment variable restoration
4. DNS failover procedures

### 3. Incident Response
- Monitor application health continuously
- Set up alerting for critical failures
- Document incident response procedures
- Regular disaster recovery testing

---

## 📞 Production Support

For production issues:
1. Check application logs
2. Verify database connectivity
3. Check external service status
4. Review monitoring dashboards
5. Follow incident response procedures

Remember to regularly update dependencies, monitor security advisories, and perform security audits in production.
