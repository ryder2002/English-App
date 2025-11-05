/**
 * Utility function to retry AI API calls with exponential backoff
 * Handles 503 Service Unavailable and other transient errors
 */

export interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  retryableStatusCodes?: number[];
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelayMs: 1000, // 1 second
  maxDelayMs: 10000, // 10 seconds
  backoffMultiplier: 2,
  retryableStatusCodes: [503, 429, 500, 502, 504], // Service Unavailable, Too Many Requests, Internal Server Error, Bad Gateway, Gateway Timeout
};

/**
 * Sleep for the specified number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if an error is retryable based on status code
 */
function isRetryableError(error: any, retryableStatusCodes: number[]): boolean {
  if (!error) return false;
  
  // Check for status code in error object
  const status = error.status || error.statusCode || error.code;
  if (status && retryableStatusCodes.includes(status)) {
    return true;
  }
  
  // Check error message for common patterns
  const message = error.message || error.toString() || '';
  if (
    message.includes('503') ||
    message.includes('Service Unavailable') ||
    message.includes('overloaded') ||
    message.includes('try again later') ||
    message.includes('429') ||
    message.includes('Too Many Requests')
  ) {
    return true;
  }
  
  return false;
}

/**
 * Retry a function with exponential backoff
 * 
 * @param fn - The async function to retry
 * @param options - Retry configuration options
 * @returns The result of the function
 * @throws The last error if all retries fail
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: any;
  
  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // If this is the last attempt or error is not retryable, throw immediately
      if (attempt === opts.maxRetries || !isRetryableError(error, opts.retryableStatusCodes)) {
        throw error;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        opts.initialDelayMs * Math.pow(opts.backoffMultiplier, attempt),
        opts.maxDelayMs
      );
      
      // Add jitter to prevent thundering herd
      const jitter = Math.random() * 0.3 * delay; // 0-30% jitter
      const totalDelay = delay + jitter;
      
      console.warn(
        `AI API call failed (attempt ${attempt + 1}/${opts.maxRetries + 1}):`,
        error.message || error.toString(),
        `Retrying in ${Math.round(totalDelay)}ms...`
      );
      
      await sleep(totalDelay);
    }
  }
  
  throw lastError;
}

/**
 * Wrapper for AI prompts/flows that adds retry logic
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options?: RetryOptions
): Promise<T> {
  return retryWithBackoff(fn, options);
}

