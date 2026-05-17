// ─────────────────────────────────────────────────────────────
// Core status type — discriminated union for full type narrowing
// ─────────────────────────────────────────────────────────────

export type PromiseStatus = 'idle' | 'pending' | 'fulfilled' | 'rejected' | 'cancelled';

/**
 * Discriminated union — TypeScript narrows data/error based on status.
 *
 * if (state.status === 'fulfilled') {
 *   state.data  // ✅ typed as T, not T | null
 *   state.error // ✅ typed as null
 * }
 */
export type PromiseState<T = unknown, E = Error> =
  | { status: 'idle';      data: null;  error: null;  progress: null }
  | { status: 'pending';   data: null;  error: null;  progress: number | null }
  | { status: 'fulfilled'; data: T;     error: null;  progress: 100 }
  | { status: 'rejected';  data: null;  error: E;     progress: null }
  | { status: 'cancelled'; data: null;  error: null;  progress: null };

// ─────────────────────────────────────────────────────────────
// What the hook returns
// ─────────────────────────────────────────────────────────────

export interface UsePromiseStateReturn<T = unknown, E = Error> {
  // Current state (discriminated union — use status to narrow)
  state: PromiseState<T, E>;

  // Convenience aliases so consumers don't have to write state.data everywhere
  status: PromiseStatus;
  data: T | null;
  error: E | null;
  progress: number | null;

  // Metadata
  duration: number | null;       // ms the last promise took
  attempts: number;              // how many times execute() was called
  lastExecutedAt: Date | null;

  // Actions
  execute: (fn: () => Promise<T>) => Promise<void>;
  reset: () => void;
  cancel: () => void;
  retry: () => void;             // re-runs the last fn passed to execute()

  // Sync from external state (Redux, Zustand, React Query, etc.)
  sync: (externalState: ExternalSyncState<T, E>) => void;

  // Progress reporting (call from within your async fn)
  setProgress: (value: number) => void;
}

// ─────────────────────────────────────────────────────────────
// Options passed to the hook
// ─────────────────────────────────────────────────────────────

export interface UsePromiseStateOptions<T = unknown, E = Error> {
  /**
   * Fires immediately on mount with this fn.
   * Like useEffect + execute() in one shot.
   * Default: undefined (manual trigger)
   */
  initialFn?: () => Promise<T>;

  /**
   * Abort after N milliseconds. Rejects with TimeoutError.
   * Default: undefined (no timeout)
   */
  timeout?: number;

  /**
   * Auto-retry on rejection, up to this many times.
   * Default: 0 (no retry)
   */
  maxRetries?: number;

  /**
   * Delay between retries in ms.
   * Can be a number (fixed) or fn (for exponential backoff).
   * Default: 0
   */
  retryDelay?: number | ((attempt: number) => number);

  /**
   * Resets state to idle after N ms post-fulfillment.
   * Useful for transient success toasts.
   * Default: undefined (stays fulfilled)
   */
  resetAfter?: number;

  /**
   * Called when promise fulfills. Receives data.
   */
  onSuccess?: (data: T) => void;

  /**
   * Called when promise rejects (after all retries exhausted).
   */
  onError?: (error: E) => void;

  /**
   * Called whenever status changes.
   */
  onStatusChange?: (status: PromiseStatus, prev: PromiseStatus) => void;
}

// ─────────────────────────────────────────────────────────────
// External sync — for Redux / Zustand / React Query consumers
// ─────────────────────────────────────────────────────────────

export interface ExternalSyncState<T = unknown, E = Error> {
  status: 'idle' | 'pending' | 'fulfilled' | 'rejected';
  data?: T;
  error?: E;
  progress?: number;
}

// ─────────────────────────────────────────────────────────────
// Special error types the library may produce
// ─────────────────────────────────────────────────────────────

export class TimeoutError extends Error {
  readonly type = 'TimeoutError' as const;
  constructor(ms: number) {
    super(`Promise timed out after ${ms}ms`);
    this.name = 'TimeoutError';
  }
}

export class CancelledError extends Error {
  readonly type = 'CancelledError' as const;
  constructor() {
    super('Promise was cancelled');
    this.name = 'CancelledError';
  }
}