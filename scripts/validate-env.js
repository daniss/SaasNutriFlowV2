#!/usr/bin/env node

/**
 * Environment Variable Validation Script
 * 
 * This script validates all required environment variables before the application starts.
 * Run this as part of your deployment pipeline to catch configuration issues early.
 * 
 * Usage:
 *   node scripts/validate-env.js
 *   npm run validate-env
 */

const { z } = require('zod');
const path = require('path');

// Load environment variables from .env.local
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

// Define required environment variables with validation rules
const envSchema = z.object({
  // Supabase Configuration (REQUIRED)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('Invalid Supabase URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(50, 'Supabase anon key too short'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(50, 'Service role key too short'),
  
  // Client Authentication (REQUIRED)
  CLIENT_AUTH_SECRET: z.string().min(32, 'Client auth secret must be at least 32 characters'),
  
  // AI Integration (REQUIRED for meal planning)
  GEMINI_API_KEY: z.string().min(20, 'Gemini API key required'),
  
  // Payment Processing (REQUIRED for subscriptions)
  STRIPE_SECRET_KEY: z.string().regex(/^sk_(test_|live_)/, 'Invalid Stripe secret key format'),
  STRIPE_WEBHOOK_SECRET: z.string().regex(/^whsec_/, 'Invalid Stripe webhook secret format'),
  
  // Optional configurations
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_USER: z.string().optional(), 
  SMTP_PASS: z.string().optional(),
  
  // Runtime environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

function validateEnvironment() {
  console.log('🔍 Validating environment variables...\n');

  // Check for sensitive variables accidentally exposed as public
  const sensitiveVars = [
    'SUPABASE_SERVICE_ROLE_KEY',
    'CLIENT_AUTH_SECRET', 
    'GEMINI_API_KEY',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'SMTP_PASS'
  ];

  let hasSecurityIssues = false;

  sensitiveVars.forEach(varName => {
    const publicVarName = `NEXT_PUBLIC_${varName}`;
    if (process.env[publicVarName]) {
      console.error(`🚨 SECURITY VIOLATION: ${varName} is exposed as ${publicVarName}`);
      console.error(`   Remove NEXT_PUBLIC_ prefix to keep it server-side only.\n`);
      hasSecurityIssues = true;
    }
  });

  if (hasSecurityIssues) {
    console.error('❌ Security issues found. Fix before deploying.\n');
    process.exit(1);
  }

  // Validate all environment variables
  try {
    const env = {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      CLIENT_AUTH_SECRET: process.env.CLIENT_AUTH_SECRET,
      GEMINI_API_KEY: process.env.GEMINI_API_KEY,
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
      STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      SMTP_HOST: process.env.SMTP_HOST,
      SMTP_USER: process.env.SMTP_USER,
      SMTP_PASS: process.env.SMTP_PASS,
      NODE_ENV: process.env.NODE_ENV,
    };

    const validatedEnv = envSchema.parse(env);
    
    console.log('✅ All required environment variables are valid');
    console.log(`   Environment: ${validatedEnv.NODE_ENV}`);
    console.log(`   Supabase URL: ${validatedEnv.NEXT_PUBLIC_SUPABASE_URL}`);
    console.log(`   App URL: ${validatedEnv.NEXT_PUBLIC_APP_URL || 'Not set'}`);
    
    // Validate Stripe environment consistency
    const stripeEnv = validatedEnv.STRIPE_SECRET_KEY.includes('test') ? 'test' : 'live';
    const nodeEnv = validatedEnv.NODE_ENV;
    
    if (nodeEnv === 'production' && stripeEnv === 'test') {
      console.warn('⚠️  WARNING: Using Stripe test keys in production environment');
    }
    
    if (nodeEnv === 'development' && stripeEnv === 'live') {
      console.warn('⚠️  WARNING: Using Stripe live keys in development environment');
    }
    
    console.log('\n🎉 Environment validation successful!');
    
  } catch (error) {
    console.error('❌ Environment variable validation failed:\n');
    if (error instanceof z.ZodError) {
      error.errors.forEach((err) => {
        console.error(`   - ${err.path.join('.')}: ${err.message}`);
      });
    } else {
      console.error('   ', error.message);
    }
    console.error('\n💡 Check your .env.local file and ensure all required variables are set.');
    console.error('   Refer to .env.example for the complete list of required variables.\n');
    process.exit(1);
  }
}

// Run validation
validateEnvironment();