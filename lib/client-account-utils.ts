/**
 * Utility functions for client account management
 */

/**
 * Generates a temporary password for new client accounts
 * Format: FirstName + random 4 digits
 */
export function generateTemporaryPassword(clientName: string): string {
  const firstName = clientName.split(' ')[0].toLowerCase();
  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  return `${firstName}${randomDigits}`;
}

/**
 * Simple password hashing function for client accounts
 * Note: In production, you would use bcrypt or similar
 * For now, we'll use a simple hash for demonstration
 */
export function hashPassword(password: string): string {
  // Simple hash implementation for demo purposes
  // In production, use bcrypt on the server side
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return `demo_hash_${Math.abs(hash).toString(16)}`;
}

/**
 * Validates if a password meets minimum requirements
 */
export function validatePassword(password: string): { isValid: boolean; message: string } {
  if (!password || password.length < 6) {
    return {
      isValid: false,
      message: "Le mot de passe doit contenir au moins 6 caractères"
    };
  }
  
  return {
    isValid: true,
    message: ""
  };
}

/**
 * Formats the email address for client account login
 * Uses the client's email or generates one based on name
 */
export function formatClientAccountEmail(clientEmail: string, clientName: string): string {
  // Use the client's email if provided
  if (clientEmail && clientEmail.includes('@')) {
    return clientEmail.toLowerCase();
  }
  
  // Generate an email based on name (for demonstration)
  const nameSlug = clientName.toLowerCase().replace(/\s+/g, '.');
  return `${nameSlug}@client.nutriflow.local`;
}
