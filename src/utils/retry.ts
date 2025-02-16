export interface RetryOptions {
  maxRetries?: number;
  retryDelay?: number;
  shouldRetry?: (error: any) => boolean;
}

export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    shouldRetry = (error) => {
      return error.status >= 500 || error.status === 429;
    }
  } = options;

  let lastError: any;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (!shouldRetry(error) || attempt === maxRetries - 1) {
        throw error;
      }

      await new Promise(resolve => 
        setTimeout(resolve, retryDelay * Math.pow(2, attempt))
      );
    }
  }

  throw lastError;
} 