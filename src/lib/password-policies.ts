import { z } from 'zod';
import { hashSync, compareSync } from 'bcrypt';

/**
 * Minimum requirements for password strength
 */
export const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  maxRepeatingChars: 3,
  preventCommonPasswords: true,
};

/**
 * List of common passwords that should be rejected
 * This is a small sample - in production, this would be more extensive
 */
export const COMMON_PASSWORDS = [
  'password', 'password123', '12345678', 'qwerty', 'letmein', 
  'welcome', 'admin', 'login', '123456789', 'abc123'
];

/**
 * Special characters considered for password complexity
 */
const SPECIAL_CHARS = '!@#$%^&*()-_=+[]{}|;:,.<>?/`~';

/**
 * Zod schema for validating password strength
 */
export const passwordStrengthSchema = z
  .string()
  .min(PASSWORD_REQUIREMENTS.minLength, 
    `Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters`
  )
  .refine(
    (password) => !PASSWORD_REQUIREMENTS.requireUppercase || /[A-Z]/.test(password),
    'Password must contain at least one uppercase letter'
  )
  .refine(
    (password) => !PASSWORD_REQUIREMENTS.requireLowercase || /[a-z]/.test(password),
    'Password must contain at least one lowercase letter'
  )
  .refine(
    (password) => !PASSWORD_REQUIREMENTS.requireNumbers || /[0-9]/.test(password),
    'Password must contain at least one number'
  )
  .refine(
    (password) => !PASSWORD_REQUIREMENTS.requireSpecialChars || 
      new RegExp(`[${SPECIAL_CHARS.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}]`).test(password),
    'Password must contain at least one special character'
  )
  .refine(
    (password) => {
      if (!PASSWORD_REQUIREMENTS.maxRepeatingChars) return true;
      // Check for repeating characters (e.g., 'aaa', '111')
      const repeatingPattern = new RegExp(`(.)\\1{${PASSWORD_REQUIREMENTS.maxRepeatingChars},}`);
      return !repeatingPattern.test(password);
    },
    `Password cannot contain more than ${PASSWORD_REQUIREMENTS.maxRepeatingChars} repeating characters in a row`
  )
  .refine(
    (password) => {
      if (!PASSWORD_REQUIREMENTS.preventCommonPasswords) return true;
      return !COMMON_PASSWORDS.includes(password.toLowerCase());
    },
    'This password is too common and easily guessable'
  );

/**
 * Calculate password strength score (0-100)
 * @param password The password to score
 * @returns A score from 0 (weakest) to 100 (strongest)
 */
export function calculatePasswordStrength(password: string): number {
  if (!password) return 0;
  
  let score = 0;
  
  // Base score from length (up to 40 points)
  const lengthScore = Math.min(password.length * 2, 40);
  score += lengthScore;
  
  // Variety of characters (up to 60 points)
  if (/[A-Z]/.test(password)) score += 10; // Uppercase
  if (/[a-z]/.test(password)) score += 10; // Lowercase
  if (/[0-9]/.test(password)) score += 10; // Numbers
  if (new RegExp(`[${SPECIAL_CHARS.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}]`).test(password)) {
    score += 15; // Special characters
  }
  
  // Character variety (up to 15 points)
  const uniqueChars = new Set(password).size;
  const uniqueRatio = uniqueChars / password.length;
  score += Math.round(uniqueRatio * 15);
  
  // Penalize if password is in common list
  if (COMMON_PASSWORDS.includes(password.toLowerCase())) {
    score = Math.max(0, score - 50);
  }
  
  // Penalize repeating patterns
  const repeatingPattern = /(.)\1{2,}/;
  if (repeatingPattern.test(password)) {
    score = Math.max(0, score - 20);
  }
  
  // Penalize sequential characters
  const sequentialPattern = /(abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|012|123|234|345|456|567|678|789)/i;
  if (sequentialPattern.test(password)) {
    score = Math.max(0, score - 15);
  }
  
  return Math.min(100, Math.max(0, score));
}

/**
 * Get password strength label based on score
 * @param score The password strength score (0-100)
 * @returns A descriptive label of the password strength
 */
export function getPasswordStrengthLabel(score: number): string {
  if (score < 30) return 'Very Weak';
  if (score < 50) return 'Weak';
  if (score < 70) return 'Moderate';
  if (score < 90) return 'Strong';
  return 'Very Strong';
}

/**
 * Get password strength color for UI
 * @param score The password strength score (0-100)
 * @returns A color code for visual representation
 */
export function getPasswordStrengthColor(score: number): string {
  if (score < 30) return '#ff4d4f'; // Red
  if (score < 50) return '#faad14'; // Orange
  if (score < 70) return '#fadb14'; // Yellow
  if (score < 90) return '#52c41a'; // Light Green
  return '#10b981'; // Green
}

/**
 * Check if a password matches any of the user's previous passwords
 * @param newPassword The plaintext new password
 * @param passwordHistory Array of hashed previous passwords
 * @returns boolean indicating if password has been used before
 */
export function isPasswordInHistory(newPassword: string, passwordHistory: string[]): boolean {
  return passwordHistory.some(hashedPwd => compareSync(newPassword, hashedPwd));
}

/**
 * Add a password to the password history
 * @param password The plaintext password
 * @param history Current password history
 * @param maxHistory Maximum number of passwords to keep in history
 * @returns Updated password history
 */
export function addToPasswordHistory(
  password: string, 
  history: string[] = [], 
  maxHistory: number = 5
): string[] {
  const hashedPassword = hashSync(password, 10);
  const newHistory = [hashedPassword, ...history];
  
  // Truncate history if it exceeds maxHistory
  if (newHistory.length > maxHistory) {
    return newHistory.slice(0, maxHistory);
  }
  
  return newHistory;
} 