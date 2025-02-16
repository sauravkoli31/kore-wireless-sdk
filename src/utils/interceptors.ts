import { RequestInterceptor, ResponseInterceptor, CustomHeaders } from '../types/wireless';
import { ValidationUtils } from './validation';

/**
 * Default request interceptor
 * @internal
 */
export const defaultRequestInterceptor: RequestInterceptor = async (request) => {
  // Validate URL
  ValidationUtils.validateUrl(
    `${request.baseURL}${request.path}`, 
    'Request URL',
    { required: true, protocols: ['https'] }
  );

  // Sanitize headers
  const sanitizedHeaders: CustomHeaders = {};
  Object.entries(request.headers).forEach(([key, value]) => {
    if (typeof value === 'string') {
      sanitizedHeaders[key] = ValidationUtils.sanitizeString(value);
    }
  });

  return {
    ...request,
    headers: sanitizedHeaders
  };
};

/**
 * Default response interceptor
 * @internal
 */
export const defaultResponseInterceptor: ResponseInterceptor = async (response) => {
  // Check for specific error status codes
  if (response.status === 429) {
    const retryAfter = response.headers.get('Retry-After');
    if (retryAfter) {
      throw new Error(`Rate limit exceeded. Retry after ${retryAfter} seconds`);
    }
  }

  // Clone the response before reading it
  const clonedResponse = response.clone();
  
  // Validate content type for JSON responses
  const contentType = clonedResponse.headers.get('Content-Type');
  if (contentType && !contentType.includes('application/json')) {
    throw new Error(`Unexpected content type: ${contentType}`);
  }

  return clonedResponse;
};

/**
 * Security response interceptor
 * @internal
 */
export const securityResponseInterceptor: ResponseInterceptor = async (response) => {
  // Check security headers
  const securityHeaders = {
  };

  Object.entries(securityHeaders).forEach(([header, expectedValue]) => {
    const value = response.headers.get(header);
    if (!value || value !== expectedValue) {
      console.warn(`Missing or invalid security header: ${header}`);
    }
  });

  return response;
}; 