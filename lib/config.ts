import { z } from 'zod'

/**
 * Environment Configuration and Validation for NutriFlow
 * Ensures all required environment variables are present and valid
 */

// Environment schema validation
const envSchema = z.object({
  // App Configuration
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_APP_NAME: z.string().default('NutriFlow'),
  
  // Database Configuration
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  
  // Authentication
  AUTH_SECRET: z.string().min(32).optional(),
  SESSION_SECRET: z.string().min(32).optional(),
  
  // AI Integration
  GOOGLE_AI_API_KEY: z.string().min(1).optional(),
  OPENAI_API_KEY: z.string().min(1).optional(),
  
  // Payment Processing
  STRIPE_SECRET_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1).optional(),
  STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
  PAYPAL_CLIENT_ID: z.string().min(1).optional(),
  PAYPAL_CLIENT_SECRET: z.string().min(1).optional(),
  
  // Email Services
  RESEND_API_KEY: z.string().min(1).optional(),
  SENDGRID_API_KEY: z.string().min(1).optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  
  // SMS Services
  TWILIO_ACCOUNT_SID: z.string().min(1).optional(),
  TWILIO_AUTH_TOKEN: z.string().min(1).optional(),
  TWILIO_PHONE_NUMBER: z.string().min(1).optional(),
  
  // File Storage
  AWS_ACCESS_KEY_ID: z.string().min(1).optional(),
  AWS_SECRET_ACCESS_KEY: z.string().min(1).optional(),
  AWS_REGION: z.string().default('us-east-1').optional(),
  AWS_S3_BUCKET: z.string().min(1).optional(),
  
  // Monitoring & Analytics
  SENTRY_DSN: z.string().url().optional(),
  GOOGLE_ANALYTICS_ID: z.string().min(1).optional(),
  MIXPANEL_TOKEN: z.string().min(1).optional(),
  
  // Rate Limiting
  REDIS_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),
  
  // External APIs
  NUTRITIONIX_APP_ID: z.string().min(1).optional(),
  NUTRITIONIX_API_KEY: z.string().min(1).optional(),
  USDA_API_KEY: z.string().min(1).optional(),
  
  // Feature Flags
  ENABLE_PAYMENTS: z.string().transform(val => val === 'true').default('false'),
  ENABLE_SMS: z.string().transform(val => val === 'true').default('false'),
  ENABLE_ANALYTICS: z.string().transform(val => val === 'true').default('false'),
  ENABLE_FILE_UPLOAD: z.string().transform(val => val === 'true').default('true'),
  
  // Security
  API_KEYS: z.string().optional(),
  ENCRYPTION_KEY: z.string().min(32).optional(),
  
  // Development
  ENABLE_LOGGING: z.string().transform(val => val === 'true').default('true'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
})

// Parse and validate environment variables
let env: z.infer<typeof envSchema>

try {
  env = envSchema.parse(process.env)
} catch (error) {
  console.error('❌ Environment validation failed:')
  if (error instanceof z.ZodError) {
    error.errors.forEach((err) => {
      console.error(`  - ${err.path.join('.')}: ${err.message}`)
    })
  }
  process.exit(1)
}

// Environment configuration object
export const config = {
  // App
  app: {
    env: env.NODE_ENV,
    url: env.NEXT_PUBLIC_APP_URL,
    name: env.NEXT_PUBLIC_APP_NAME,
    isDev: env.NODE_ENV === 'development',
    isProd: env.NODE_ENV === 'production',
    isTest: env.NODE_ENV === 'test',
  },
  
  // Database
  database: {
    url: env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
  },
  
  // Authentication
  auth: {
    secret: env.AUTH_SECRET || env.SESSION_SECRET,
    sessionSecret: env.SESSION_SECRET,
  },
  
  // AI
  ai: {
    googleApiKey: env.GOOGLE_AI_API_KEY,
    openaiApiKey: env.OPENAI_API_KEY,
  },
  
  // Payments
  payments: {
    enabled: env.ENABLE_PAYMENTS,
    stripe: {
      secretKey: env.STRIPE_SECRET_KEY,
      publishableKey: env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      webhookSecret: env.STRIPE_WEBHOOK_SECRET,
    },
    paypal: {
      clientId: env.PAYPAL_CLIENT_ID,
      clientSecret: env.PAYPAL_CLIENT_SECRET,
    },
  },
  
  // Email
  email: {
    resendApiKey: env.RESEND_API_KEY,
    sendgridApiKey: env.SENDGRID_API_KEY,
    smtp: {
      host: env.SMTP_HOST,
      port: env.SMTP_PORT ? parseInt(env.SMTP_PORT) : undefined,
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  },
  
  // SMS
  sms: {
    enabled: env.ENABLE_SMS,
    twilio: {
      accountSid: env.TWILIO_ACCOUNT_SID,
      authToken: env.TWILIO_AUTH_TOKEN,
      phoneNumber: env.TWILIO_PHONE_NUMBER,
    },
  },
  
  // File Storage
  storage: {
    aws: {
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      region: env.AWS_REGION,
      bucket: env.AWS_S3_BUCKET,
    },
  },
  
  // Monitoring
  monitoring: {
    sentryDsn: env.SENTRY_DSN,
    googleAnalyticsId: env.GOOGLE_ANALYTICS_ID,
    mixpanelToken: env.MIXPANEL_TOKEN,
    enabled: env.ENABLE_ANALYTICS,
  },
  
  // Rate Limiting
  rateLimit: {
    redisUrl: env.REDIS_URL,
    upstash: {
      url: env.UPSTASH_REDIS_REST_URL,
      token: env.UPSTASH_REDIS_REST_TOKEN,
    },
  },
  
  // External APIs
  externalApis: {
    nutritionix: {
      appId: env.NUTRITIONIX_APP_ID,
      apiKey: env.NUTRITIONIX_API_KEY,
    },
    usda: {
      apiKey: env.USDA_API_KEY,
    },
  },
  
  // Security
  security: {
    apiKeys: env.API_KEYS?.split(',') || [],
    encryptionKey: env.ENCRYPTION_KEY,
  },
  
  // Features
  features: {
    payments: env.ENABLE_PAYMENTS,
    sms: env.ENABLE_SMS,
    analytics: env.ENABLE_ANALYTICS,
    fileUpload: env.ENABLE_FILE_UPLOAD,
  },
  
  // Logging
  logging: {
    enabled: env.ENABLE_LOGGING,
    level: env.LOG_LEVEL,
  },
}

// Utility functions
export const isFeatureEnabled = (feature: keyof typeof config.features): boolean => {
  return config.features[feature]
}

export const getRequiredEnvVar = (key: string): string => {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Required environment variable ${key} is not set`)
  }
  return value
}

export const getOptionalEnvVar = (key: string, defaultValue?: string): string | undefined => {
  return process.env[key] || defaultValue
}

// Environment validation for specific features
export const validateFeatureConfig = {
  payments: (): boolean => {
    if (!config.features.payments) return true
    return !!(config.payments.stripe.secretKey && config.payments.stripe.publishableKey)
  },
  
  email: (): boolean => {
    return !!(config.email.resendApiKey || config.email.sendgridApiKey || 
             (config.email.smtp.host && config.email.smtp.user && config.email.smtp.pass))
  },
  
  sms: (): boolean => {
    if (!config.features.sms) return true
    return !!(config.sms.twilio.accountSid && config.sms.twilio.authToken)
  },
  
  ai: (): boolean => {
    return !!(config.ai.googleApiKey || config.ai.openaiApiKey)
  },
  
  storage: (): boolean => {
    return !!(config.storage.aws.accessKeyId && config.storage.aws.secretAccessKey)
  }
}

// Log configuration status
if (config.logging.enabled && config.app.isDev) {
  console.log('🔧 Configuration loaded:', {
    env: config.app.env,
    features: config.features,
    validations: {
      payments: validateFeatureConfig.payments(),
      email: validateFeatureConfig.email(),
      sms: validateFeatureConfig.sms(),
      ai: validateFeatureConfig.ai(),
      storage: validateFeatureConfig.storage(),
    }
  })
}

export default config
