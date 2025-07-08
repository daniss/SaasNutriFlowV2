/**
 * Security Configuration for NutriFlow
 * Implements security headers, CSRF protection, and other security measures
 */

// Security headers configuration
export const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: https: blob:",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com",
      "frame-src https://js.stripe.com",
      "form-action 'self'",
      "upgrade-insecure-requests"
    ].join('; ')
  }
]

// Rate limiting configuration
export const rateLimitConfig = {
  // API routes rate limits
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
  },
  
  // Authentication rate limits
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 auth attempts per windowMs
    message: 'Too many authentication attempts, please try again later.'
  },
  
  // File upload rate limits
  upload: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // Limit each IP to 10 uploads per hour
    message: 'Upload limit exceeded, please try again later.'
  }
}

// Input validation schemas
export const validationSchemas = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  phone: /^\+?[1-9]\d{1,14}$/,
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
}

// Sanitization utilities
export const sanitize = {
  /**
   * Sanitize HTML input to prevent XSS attacks
   */
  html: (input: string): string => {
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
  },

  /**
   * Sanitize SQL input to prevent SQL injection
   */
  sql: (input: string): string => {
    return input.replace(/['";\\]/g, '')
  },

  /**
   * Sanitize file names
   */
  filename: (input: string): string => {
    return input.replace(/[^a-zA-Z0-9.-]/g, '_')
  }
}

// Encryption utilities
export const encryption = {
  /**
   * Hash sensitive data using Web Crypto API
   */
  hash: async (data: string): Promise<string> => {
    const encoder = new TextEncoder()
    const dataBuffer = encoder.encode(data)
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('')
  },

  /**
   * Generate secure random tokens
   */
  generateToken: (length: number = 32): string => {
    const array = new Uint8Array(length)
    crypto.getRandomValues(array)
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
  }
}

// Session security configuration
export const sessionConfig = {
  name: 'nutriflow_session',
  secret: process.env.SESSION_SECRET || 'your-session-secret-here',
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'strict' as const
  }
}

// File upload security
export const fileUploadConfig = {
  maxSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
    'text/csv'
  ],
  
  /**
   * Validate file type and size
   */
  validate: (file: File): { valid: boolean; error?: string } => {
    if (file.size > fileUploadConfig.maxSize) {
      return { valid: false, error: 'File size exceeds 10MB limit' }
    }
    
    if (!fileUploadConfig.allowedTypes.includes(file.type)) {
      return { valid: false, error: 'File type not allowed' }
    }
    
    return { valid: true }
  }
}

// API security middleware
export const apiSecurity = {
  /**
   * Validate API key if required
   */
  validateApiKey: (apiKey: string): boolean => {
    if (!process.env.API_KEYS) return false
    const validKeys = process.env.API_KEYS.split(',')
    return validKeys.includes(apiKey)
  },

  /**
   * Check if request is from allowed origin
   */
  validateOrigin: (origin: string): boolean => {
    const allowedOrigins = [
      'http://localhost:3000',
      'https://nutriflow.app',
      process.env.NEXT_PUBLIC_APP_URL
    ].filter(Boolean)
    
    return allowedOrigins.includes(origin)
  }
}

// Audit logging configuration
export const auditConfig = {
  /**
   * Log security events
   */
  logSecurityEvent: (event: {
    type: 'AUTH_ATTEMPT' | 'ACCESS_DENIED' | 'DATA_BREACH' | 'SUSPICIOUS_ACTIVITY'
    userId?: string
    ip: string
    userAgent: string
    details: string
  }) => {
    // In production, this would send to a logging service
    console.log(`[SECURITY] ${event.type}:`, {
      timestamp: new Date().toISOString(),
      ...event
    })
  }
}

export default {
  securityHeaders,
  rateLimitConfig,
  validationSchemas,
  sanitize,
  encryption,
  sessionConfig,
  fileUploadConfig,
  apiSecurity,
  auditConfig
}
