/**
 * Rate limiter to prevent API throttling
 * @internal
 */
export class RateLimiter {
  private queue: (() => Promise<void>)[] = [];
  private processing = false;
  private lastRequestTime = 0;
  private readonly minInterval: number;

  /**
   * Creates a new rate limiter
   * @param requestsPerSecond - Maximum requests per second
   */
  constructor(requestsPerSecond: number) {
    if (requestsPerSecond <= 0) {
      throw new Error('requestsPerSecond must be greater than 0');
    }
    this.minInterval = 1000 / requestsPerSecond;
  }

  /**
   * Adds a function to the rate-limited queue
   * @param fn - Function to execute
   * @returns Promise that resolves with the function result
   */
  async add<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      if (!this.processing) {
        this.processQueue();
      }
    });
  }

  private async processQueue(): Promise<void> {
    this.processing = true;
    
    while (this.queue.length > 0) {
      const now = Date.now();
      const elapsed = now - this.lastRequestTime;
      
      if (elapsed < this.minInterval) {
        await new Promise(resolve => setTimeout(resolve, this.minInterval - elapsed));
      }
      
      const task = this.queue.shift();
      if (task) {
        this.lastRequestTime = Date.now();
        await task();
      }
    }

    this.processing = false;
  }
} 