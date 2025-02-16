export class RateLimiter {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;
  private lastRequestTime = 0;
  private minRequestInterval: number;

  constructor(maxRequests: number) {
    this.minRequestInterval = 1000 / maxRequests; // Convert requests/sec to ms between requests
  }

  async add<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      this.process();
    });
  }

  private async process(): Promise<void> {
    if (this.processing) return;
    this.processing = true;

    while (this.queue.length > 0) {
      const now = Date.now();
      const timeToWait = this.lastRequestTime + this.minRequestInterval - now;
      
      if (timeToWait > 0) {
        await new Promise(resolve => setTimeout(resolve, timeToWait));
      }

      const fn = this.queue.shift();
      if (fn) {
        this.lastRequestTime = Date.now();
        await fn();
      }
    }

    this.processing = false;
  }
} 