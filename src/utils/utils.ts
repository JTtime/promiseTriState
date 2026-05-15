import { TimeoutError, CancelledError } from '..//types/types';

// ─────────────────────────────────────────────────────────────
// Retry delay calculator — supports fixed ms or exponential backoff fn
// ─────────────────────────────────────────────────────────────

export function getRetryDelay(
  retryDelay: number | ((attempt: number) => number),
  attempt: number
): number {
  if (typeof retryDelay === 'function') return retryDelay(attempt);
  return retryDelay;
}

/**
 * Built-in exponential backoff helper.
 * Usage: retryDelay: exponentialBackoff(500) → 500, 1000, 2000, 4000…
 * Caps at maxMs (default 30s).
 */
export function exponentialBackoff(baseMs = 500, maxMs = 30_000) {
  return (attempt: number): number =>
    Math.min(baseMs * Math.pow(2, attempt - 1), maxMs);
}

// ─────────────────────────────────────────────────────────────
// Race a promise against a timeout
// ─────────────────────────────────────────────────────────────

export function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  signal: AbortSignal
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new TimeoutError(ms));
    }, ms);

    // If abort fires before timeout, reject with CancelledError
    signal.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(new CancelledError());
    }, { once: true });

    promise.then(
      (val) => { clearTimeout(timer); resolve(val); },
      (err) => { clearTimeout(timer); reject(err); }
    );
  });
}

// ─────────────────────────────────────────────────────────────
// Sleep utility for retry delays
// ─────────────────────────────────────────────────────────────

export function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(new CancelledError());
    }, { once: true });
  });
}

// ─────────────────────────────────────────────────────────────
// Detect if an error is a cancellation (don't treat as real error)
// ─────────────────────────────────────────────────────────────

export function isCancelledError(err: unknown): boolean {
  if (err instanceof CancelledError) return true;
  // AbortError from fetch / native AbortController
  if (err instanceof Error && err.name === 'AbortError') return true;
  return false;
}

// ─────────────────────────────────────────────────────────────
// Clamp progress 0–100
// ─────────────────────────────────────────────────────────────

export function clampProgress(value: number): number {
  return Math.min(100, Math.max(0, value));
}