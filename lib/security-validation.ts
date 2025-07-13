/**
 * Comprehensive input validation and sanitization
 * Prevents SQL injection, XSS, and other input-based attacks
 */

import { z } from "zod";

// Common validation schemas
export const emailSchema = z
  .string()
  .email("Format d'email invalide")
  .min(1, "Email requis");
export const passwordSchema = z
  .string()
  .min(8, "Le mot de passe doit contenir au moins 8 caractères");
export const uuidSchema = z.string().uuid("ID invalide");
export const positiveNumberSchema = z
  .number()
  .positive("Doit être un nombre positif");
export const phoneSchema = z
  .string()
  .regex(/^[\+]?[0-9\s\-\(\)]{10,}$/, "Format de téléphone invalide");

// Sanitization functions
export function sanitizeString(input: string): string {
  if (typeof input !== "string") return "";
  // Remove potentially dangerous characters and HTML tags
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<[^>]*>/g, "")
    .replace(/[<>'"&]/g, (match) => {
      const escapeMap: Record<string, string> = {
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#x27;",
        "&": "&amp;",
      };
      return escapeMap[match] || match;
    })
    .trim();
}

export function sanitizeHtml(input: string): string {
  if (typeof input !== "string") return "";
  // Allow basic formatting tags only
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<(?!\/?(?:p|br|strong|em|ul|ol|li)\b)[^>]*>/gi, "")
    .trim();
}

// Client authentication input validation
export const clientLoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Mot de passe requis"),
});

export const clientWeightSchema = z.object({
  weight: z.number().min(1).max(1000, "Poids invalide"),
  notes: z.string().optional(),
});

export const clientMessageSchema = z.object({
  message: z.string().min(1, "Message requis").max(1000, "Message trop long"),
});

// GDPR consent validation
export const gdprConsentSchema = z.object({
  consents: z.array(
    z.object({
      consent_type: z.enum([
        "data_processing",
        "health_data",
        "photos",
        "marketing",
        "data_sharing",
      ]),
      is_given: z.boolean(),
      consent_text: z.string(),
    })
  ),
});

// Document validation
export const documentRequestSchema = z.object({
  documentId: uuidSchema,
  filePath: z.string().min(1, "Chemin de fichier requis"),
});

// Authentication token schema
export const authTokenSchema = z.object({
  authHeader: z
    .string()
    .min(1, "Authorization header required")
    .refine(
      (header) => header.startsWith("Bearer "),
      "Invalid authorization format"
    )
    .refine((header) => header.length > 7, "Token required")
    .transform((header) => sanitizeString(header)),
});

// Email check schema
export const emailCheckSchema = z.object({
  email: emailSchema,
});

// Client data validation
export const clientDataSchema = z.object({
  name: z.string().min(1, "Nom requis").max(100, "Nom trop long"),
  email: emailSchema,
  phone: phoneSchema.optional(),
  age: z.number().min(1).max(150, "Âge invalide").optional(),
  height: z.number().min(50).max(300, "Taille invalide").optional(),
  current_weight: z.number().min(1).max(1000, "Poids invalide").optional(),
  goal_weight: z
    .number()
    .min(1)
    .max(1000, "Poids objectif invalide")
    .optional(),
  notes: z.string().max(2000, "Notes trop longues").optional(),
});

/**
 * Validate and sanitize request body
 */
export async function validateInput<T>(
  data: unknown,
  schema: z.ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  try {
    // First sanitize string fields if they exist
    if (typeof data === "object" && data !== null) {
      const sanitized = sanitizeObjectStrings(data as Record<string, unknown>);
      const validated = schema.parse(sanitized);
      return { success: true, data: validated };
    }

    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors.map((e) => e.message).join(", ");
      return { success: false, error: errorMessage };
    }
    return { success: false, error: "Données invalides" };
  }
}

/**
 * Recursively sanitize string fields in an object
 */
function sanitizeObjectStrings(
  obj: Record<string, unknown>
): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      sanitized[key] = sanitizeString(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map((item) =>
        typeof item === "string"
          ? sanitizeString(item)
          : typeof item === "object" && item !== null
          ? sanitizeObjectStrings(item as Record<string, unknown>)
          : item
      );
    } else if (typeof value === "object" && value !== null) {
      sanitized[key] = sanitizeObjectStrings(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Rate limiting helper
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  identifier: string,
  maxRequests: number = 100,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): { success: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const key = identifier;

  const current = rateLimitMap.get(key);

  if (!current || now > current.resetTime) {
    // Reset or initialize
    const resetTime = now + windowMs;
    rateLimitMap.set(key, { count: 1, resetTime });
    return { success: true, remaining: maxRequests - 1, resetTime };
  }

  if (current.count >= maxRequests) {
    return { success: false, remaining: 0, resetTime: current.resetTime };
  }

  current.count++;
  rateLimitMap.set(key, current);

  return {
    success: true,
    remaining: maxRequests - current.count,
    resetTime: current.resetTime,
  };
}

/**
 * Clean up expired rate limit entries
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}, 5 * 60 * 1000); // Clean up every 5 minutes
