/**
 * Pauses execution for the given number of milliseconds.
 */
export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Executes an async function with exponential backoff retry.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delayMs = 500,
): Promise<T> {
  let lastError: Error;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err as Error;
      if (attempt < retries) {
        await sleep(delayMs * Math.pow(2, attempt - 1));
      }
    }
  }
  throw lastError!;
}

/**
 * Formats a NUMERIC amount from Postgres (returned as string) to a number.
 */
export const toAmount = (value: string | number): number =>
  typeof value === 'string' ? parseFloat(value) : value;

/**
 * Masks sensitive data (e.g., email, phone) for logging.
 */
export function maskEmail(email: string): string {
  const [user, domain] = email.split('@');
  return `${user.slice(0, 2)}***@${domain}`;
}
