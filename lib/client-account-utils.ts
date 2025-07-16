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
 * Secure password hashing function for client accounts
 * Uses bcryptjs for cryptographically secure hashing
 */
export async function hashPassword(password: string): Promise<string> {
  const bcrypt = await import('bcryptjs');
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

/**
 * Compares a plain text password with a hashed password
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  const bcrypt = await import('bcryptjs');
  return bcrypt.compare(password, hash);
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
