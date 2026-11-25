import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * ==============================================================================
 * Card Validator & Payment Security Utilities
 * ==============================================================================
 * Interview Concept:
 * - Pure TypeScript utility implementing banking-standard algorithms.
 * - Luhn Checksum (Modulo 10 formula): Mathematically verifies card authenticity
 *   by doubling every second digit backwards and checking if the sum % 10 === 0.
 * - Card Brand Detection: Regex pattern matching on IIN/BIN prefixes (Visa, Mastercard, Amex).
 * - Expiration & Formatting: Auto-spaces card digits and ensures MM/YY is strictly in the future.
 * - Seamlessly packaged as Angular ValidatorFn for Reactive Forms in CheckoutComponent.
 * ==============================================================================
 */

/**
 * Validates a credit card number using the Luhn checksum algorithm (Mod 10)
 */
export function luhnCheck(cardNumber: string): boolean {
  const sanitized = cardNumber.replace(/\D/g, '');
  if (!sanitized || sanitized.length < 13 || sanitized.length > 19) {
    return false;
  }

  let sum = 0;
  let alternate = false;

  for (let i = sanitized.length - 1; i >= 0; i--) {
    let digit = parseInt(sanitized.charAt(i), 10);

    if (alternate) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    alternate = !alternate;
  }

  return sum % 10 === 0;
}

/**
 * Angular Reactive Forms validator for Luhn check
 */
export function luhnValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;
    return luhnCheck(control.value) ? null : { luhnInvalid: true };
  };
}

/**
 * Formats digits into groups of 4: "4111 2222 3333 4444"
 */
export function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 16);
  const parts = [];
  for (let i = 0; i < digits.length; i += 4) {
    parts.push(digits.substring(i, i + 4));
  }
  return parts.join(' ');
}

/**
 * Formats MM/YY with automatic slash insertion
 */
export function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length >= 3) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }
  return digits;
}

/**
 * Angular Reactive Forms validator for future expiry date (MM/YY)
 */
export function expiryValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;
    const val = control.value.replace(/\D/g, '');
    if (val.length !== 4) {
      return { expiryInvalid: true };
    }

    const month = parseInt(val.slice(0, 2), 10);
    const year = parseInt('20' + val.slice(2, 4), 10);

    if (month < 1 || month > 12) {
      return { expiryInvalid: true };
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    if (year < currentYear || (year === currentYear && month < currentMonth)) {
      return { expiryExpired: true };
    }

    return null;
  };
}

/**
 * Detects card brand icon/name from first digits
 */
export function detectCardBrand(cardNumber: string): 'visa' | 'mastercard' | 'amex' | 'generic' {
  const sanitized = cardNumber.replace(/\D/g, '');
  if (/^4/.test(sanitized)) return 'visa';
  if (/^(5[1-5]|2[2-7])/.test(sanitized)) return 'mastercard';
  if (/^3[47]/.test(sanitized)) return 'amex';
  return 'generic';
}
