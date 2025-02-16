/**
 * Validation utilities
 * @internal
 */
export class ValidationUtils {
  /**
   * Validates a string parameter
   * @throws {Error} If validation fails
   */
  static validateString(value: unknown, name: string, options: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
  } = {}): void {
    if (options.required && !value) {
      throw new Error(`${name} is required`);
    }
    if (value !== undefined && typeof value !== 'string') {
      throw new Error(`${name} must be a string`);
    }
    if (typeof value === 'string') {
      if (options.minLength && value.length < options.minLength) {
        throw new Error(`${name} must be at least ${options.minLength} characters`);
      }
      if (options.maxLength && value.length > options.maxLength) {
        throw new Error(`${name} must not exceed ${options.maxLength} characters`);
      }
      if (options.pattern && !options.pattern.test(value)) {
        throw new Error(`${name} has invalid format`);
      }
    }
  }

  /**
   * Validates a number parameter
   * @throws {Error} If validation fails
   */
  static validateNumber(value: unknown, name: string, options: {
    required?: boolean;
    min?: number;
    max?: number;
    integer?: boolean;
  } = {}): void {
    if (options.required && value === undefined) {
      throw new Error(`${name} is required`);
    }
    if (value !== undefined) {
      if (typeof value !== 'number' || isNaN(value)) {
        throw new Error(`${name} must be a number`);
      }
      if (options.min !== undefined && value < options.min) {
        throw new Error(`${name} must be at least ${options.min}`);
      }
      if (options.max !== undefined && value > options.max) {
        throw new Error(`${name} must not exceed ${options.max}`);
      }
      if (options.integer && !Number.isInteger(value)) {
        throw new Error(`${name} must be an integer`);
      }
    }
  }

  /**
   * Validates a URL parameter
   * @throws {Error} If validation fails
   */
  static validateUrl(value: unknown, name: string, options: {
    required?: boolean;
    protocols?: string[];
  } = {}): void {
    if (options.required && !value) {
      throw new Error(`${name} is required`);
    }
    if (value !== undefined) {
      try {
        const url = new URL(String(value));
        if (options.protocols && !options.protocols.includes(url.protocol.replace(':', ''))) {
          throw new Error(`${name} must use one of these protocols: ${options.protocols.join(', ')}`);
        }
      } catch {
        throw new Error(`${name} must be a valid URL`);
      }
    }
  }

  /**
   * Sanitizes a string for safe use
   */
  static sanitizeString(value: string): string {
    return value
      .replace(/[<>]/g, '') // Remove < and >
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
      .trim();
  }
} 