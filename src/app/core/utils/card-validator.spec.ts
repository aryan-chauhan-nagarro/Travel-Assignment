import { FormControl } from '@angular/forms';
import {
  luhnCheck,
  luhnValidator,
  formatCardNumber,
  formatExpiry,
  detectCardBrand,
  expiryValidator,
} from './card-validator';

describe('CardValidator & Luhn Algorithm', () => {
  describe('luhnCheck', () => {
    it('should validate valid Visa and Mastercard numbers', () => {
      expect(luhnCheck('4242 4242 4242 4242')).toBe(true);
      expect(luhnCheck('4111111111111111')).toBe(true);
      expect(luhnCheck('5555555555554444')).toBe(true);
    });

    it('should invalidate incorrect card numbers', () => {
      expect(luhnCheck('4242 4242 4242 4243')).toBe(false);
      expect(luhnCheck('1234567890123456')).toBe(false);
      expect(luhnCheck('')).toBe(false);
      expect(luhnCheck('123')).toBe(false);
    });
  });

  describe('luhnValidator (Angular FormControl)', () => {
    const validator = luhnValidator();

    it('should return null for valid card number', () => {
      const control = new FormControl('4242 4242 4242 4242');
      expect(validator(control)).toBeNull();
    });

    it('should return { luhnInvalid: true } for invalid card number', () => {
      const control = new FormControl('4242 4242 4242 4243');
      expect(validator(control)).toEqual({ luhnInvalid: true });
    });

    it('should return null for empty value (optional until required validator)', () => {
      const control = new FormControl('');
      expect(validator(control)).toBeNull();
    });
  });

  describe('detectCardBrand', () => {
    it('should detect Visa cards starting with 4', () => {
      expect(detectCardBrand('4111 2222 3333 4444')).toBe('visa');
    });

    it('should detect Mastercard cards starting with 51-55 or 22-27', () => {
      expect(detectCardBrand('5200 1234 5678 9010')).toBe('mastercard');
      expect(detectCardBrand('2221 0000 0000 0000')).toBe('mastercard');
    });

    it('should detect Amex cards starting with 34 or 37', () => {
      expect(detectCardBrand('3782 822463 10005')).toBe('amex');
    });

    it('should return generic for unknown brands', () => {
      expect(detectCardBrand('6011 0000 0000 0000')).toBe('generic');
    });
  });

  describe('formatCardNumber & formatExpiry', () => {
    it('should space digits into 4 groups of 4', () => {
      expect(formatCardNumber('4242424242424242')).toBe('4242 4242 4242 4242');
    });

    it('should format MM/YY with slash insertion', () => {
      expect(formatExpiry('1228')).toBe('12/28');
    });
  });

  describe('expiryValidator', () => {
    const validator = expiryValidator();

    it('should validate future MM/YY dates', () => {
      const control = new FormControl('12/35');
      expect(validator(control)).toBeNull();
    });

    it('should reject expired dates', () => {
      const control = new FormControl('01/20');
      expect(validator(control)).toEqual({ expiryExpired: true });
    });

    it('should reject invalid month numbers', () => {
      const control = new FormControl('13/30');
      expect(validator(control)).toEqual({ expiryInvalid: true });
    });
  });
});
