/**
 * Environment Variable Validation and Security
 * 
 * CRITICAL: This module validates all required environment variables
 * and ensures sensitive data is never exposed to client-side code.
 */

import { z } from 'zod';

// Define required environment variables with validation rules
const envSchema = z.object({
  // Supabase Configuration (REQUIRED)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('Invalid Supabase URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(50, 'Supabase anon key too short'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(50, 'Service role key too short'),
  
  // Client Authentication (REQUIRED)
  CLIENT_AUTH_SECRET: z.string().min(32, 'Client auth secret must be at least 32 characters'),
  
  // AI Integration (REQUIRED for meal planning)
  GROQ_API_KEY: z.string().min(20, 'Groq API key required'),
  
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

type EnvConfig = z.infer<typeof envSchema>;

/**
 * Validates all environment variables at startup
 * Throws error if any required variables are missing or invalid
 */
export function validateEnvironmentVariables(): EnvConfig {
  try {
    const env = {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      CLIENT_AUTH_SECRET: process.env.CLIENT_AUTH_SECRET,
      GROQ_API_KEY: process.env.GROQ_API_KEY,
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
      STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      SMTP_HOST: process.env.SMTP_HOST,
      SMTP_USER: process.env.SMTP_USER,
      SMTP_PASS: process.env.SMTP_PASS,
      NODE_ENV: process.env.NODE_ENV,
    };

    return envSchema.parse(env);
  } catch (error) {
    console.error('❌ Environment variable validation failed:');
    if (error instanceof z.ZodError) {
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
    }
    throw new Error('Invalid environment configuration. Check your .env files.');
  }
}

/**
 * Security check for sensitive environment variables
 * Ensures they are not accidentally exposed to client-side
 */
export function checkSensitiveEnvExposure(): void {
  const sensitiveVars = [
    'SUPABASE_SERVICE_ROLE_KEY',
    'CLIENT_AUTH_SECRET', 
    'GROQ_API_KEY',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'SMTP_PASS'
  ];

  // Check if any sensitive variables are accidentally exposed via NEXT_PUBLIC_
  sensitiveVars.forEach(varName => {
    const publicVarName = `NEXT_PUBLIC_${varName}`;
    if (process.env[publicVarName]) {
      throw new Error(
        `🚨 SECURITY VIOLATION: Sensitive variable ${varName} is exposed as ${publicVarName}. ` +
        'Remove NEXT_PUBLIC_ prefix to keep it server-side only.'
      );
    }
  });

  // Validate that required public variables are properly prefixed
  const requiredPublicVars = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'];
  requiredPublicVars.forEach(varName => {
    if (!process.env[varName]) {
      console.warn(`⚠️ Public variable ${varName} is missing`);
    }
  });
}

/**
 * Get validated environment configuration
 * Use this instead of process.env to ensure type safety and validation
 */
export function getEnvConfig(): EnvConfig {
  return validateEnvironmentVariables();
}

/**
 * Security utility to get only safe client-side environment variables
 * NEVER expose sensitive server-side variables through this function
 */
export function getClientSafeEnv() {
  return {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NODE_ENV: process.env.NODE_ENV,
  };
}

/**
 * Initialize environment validation on module load
 * This ensures the application fails fast if configuration is invalid
 */
if (typeof window === 'undefined') {
  // Only validate on server-side
  try {
    checkSensitiveEnvExposure();
    validateEnvironmentVariables();
    console.log('✅ Environment variables validated successfully');
  } catch (error) {
    console.error('🚨 Environment validation failed:', error);
    // In production, this should crash the application
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
}