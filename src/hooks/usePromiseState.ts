import { useCallback, useEffect, useReducer, useRef } from 'react';
import type {
  ExternalSyncState,
  PromiseState,
  PromiseStatus,
  UsePromiseStateOptions,
  UsePromiseStateReturn,
} from '../types';
import { CancelledError, TimeoutError } from '../types';
import {
  clampProgress,
  getRetryDelay,
  isCancelledError,
  sleep,
  withTimeout,
} from '@/utils';

// ─────────────────────────────────────────────────────────────
// Internal reducer — single source of truth
// All state transitions go through here. No setState calls scattered
// around the hook body. This makes the state machine explicit and
// testable in isolation.
// ─────────────────────────────────────────────────────────────

type Action<T, E> =
  | { type: 'EXECUTE' }
  | { type: 'PROGRESS'; payload: number }
  | { type: 'FULFILLED'; payload: T; duration: number }
  | { type: 'REJECTED'; payload: E }
  | { type: 'CANCELLED' }
  | { type: 'RESET' }
  | { type: 'SYNC'; payload: ExternalSyncState<T, E> };

interface InternalState<T, E> {
  promiseState: PromiseState<T, E>;
  duration: number | null;
  attempts: number;
  lastExecutedAt: Date | null;
}

function createInitialState<T, E>(): InternalState<T, E> {
  return {
    promiseState: { status: 'idle', data: null, error: null, progress: null },
    duration: null,
    attempts: 0,
    lastExecutedAt: null,
  };
}

function reducer<T, E>(
  state: InternalState<T, E>,
  action: Action<T, E>
): InternalState<T, E> {
  switch (action.type) {
    case 'EXECUTE':
      return {
        ...state,
        promiseState: { status: 'pending', data: null, error: null, progress: null },
        attempts: state.attempts + 1,
        lastExecutedAt: new Date(),
        duration: null,
      };

    case 'PROGRESS':
      // Only update progress if currently pending
      if (state.promiseState.status !== 'pending') return state;
      return {
        ...state,
        promiseState: {
          status: 'pending',
          data: null,
          error: null,
          progress: clampProgress(action.payload),
        },
      };

    case 'FULFILLED':
      return {
        ...state,
        promiseState: { status: 'fulfilled', data: action.payload, error: null, progress: 100 },
        duration: action.duration,
      };

    case 'REJECTED':
      return {
        ...state,
        promiseState: { status: 'rejected', data: null, error: action.payload, progress: null },
      };

    case 'CANCELLED':
      return {
        ...state,
        promiseState: { status: 'cancelled', data: null, error: null, progress: null },
      };

    case 'RESET':
      return createInitialState<T, E>();

    case 'SYNC': {
      const ext = action.payload;
      // Map external status string → internal PromiseState shape
      switch (ext.status) {
        case 'pending':
          return {
            ...state,
            promiseState: {
              status: 'pending',
              data: null,
              error: null,
              progress: ext.progress ?? null,
            },
          };
        case 'fulfilled':
          return {
            ...state,
            promiseState: {
              status: 'fulfilled',
              data: ext.data as T,
              error: null,
              progress: 100,
            },
          };
        case 'rejected':
          return {
            ...state,
            promiseState: {
              status: 'rejected',
              data: null,
              error: ext.error as E,
              progress: null,
            },
          };
        case 'idle':
        default:
          return {
            ...state,
            promiseState: { status: 'idle', data: null, error: null, progress: null },
          };
      }
    }

    default:
      return state;
  }
}

// ─────────────────────────────────────────────────────────────
// The hook
// ─────────────────────────────────────────────────────────────

export function usePromiseState<T = unknown, E = Error>(
  options: UsePromiseStateOptions<T, E> = {}
): UsePromiseStateReturn<T, E> {
  const {
    initialFn,
    timeout,
    maxRetries = 0,
    retryDelay = 0,
    resetAfter,
    onSuccess,
    onError,
    onStatusChange,
  } = options;

  const [internalState, dispatch] = useReducer(
    reducer<T, E>,
    undefined,
    createInitialState<T, E>
  );

  // ── Refs ───────────────────────────────────────────────────
  // Stable refs so callbacks always see latest values without
  // causing re-renders or stale closure bugs.

  const abortControllerRef = useRef<AbortController | null>(null);
  const lastFnRef = useRef<(() => Promise<T>) | null>(null);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);

  // Stable refs for callbacks (so options can be non-memoized)
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  const onStatusChangeRef = useRef(onStatusChange);
  onSuccessRef.current = onSuccess;
  onErrorRef.current = onError;
  onStatusChangeRef.current = onStatusChange;

  // Previous status ref for onStatusChange
  const prevStatusRef = useRef<PromiseStatus>('idle');

  // ── Status change callback ─────────────────────────────────
  useEffect(() => {
    const current = internalState.promiseState.status;
    if (current !== prevStatusRef.current) {
      onStatusChangeRef.current?.(current, prevStatusRef.current);
      prevStatusRef.current = current;
    }
  }, [internalState.promiseState.status]);

  // ── Cleanup on unmount ─────────────────────────────────────
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      abortControllerRef.current?.abort();
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    };
  }, []);

  // ── setProgress (stable reference) ────────────────────────
  const setProgress = useCallback((value: number) => {
    dispatch({ type: 'PROGRESS', payload: value });
  }, []);

  // ── Core execute ───────────────────────────────────────────
  const execute = useCallback(async (fn: () => Promise<T>) => {
    // Cancel any in-flight promise before starting a new one
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;

    lastFnRef.current = fn;

    dispatch({ type: 'EXECUTE' });

    const startTime = Date.now();
    let attempt = 0;

    const runAttempt = async (): Promise<void> => {
      attempt += 1;

      try {
        let promise = fn();

        // Wrap with timeout if configured
        if (timeout !== undefined) {
          promise = withTimeout(promise, timeout, signal) as Promise<T>;
        }

        const result = await promise;

        // Guard: component may have unmounted or been cancelled
        if (!isMountedRef.current || signal.aborted) return;

        const duration = Date.now() - startTime;
        dispatch({ type: 'FULFILLED', payload: result, duration });
        onSuccessRef.current?.(result);

        // Auto-reset after success if configured
        if (resetAfter !== undefined) {
          resetTimerRef.current = setTimeout(() => {
            if (isMountedRef.current) dispatch({ type: 'RESET' });
          }, resetAfter);
        }
      } catch (err) {
        // Cancellation is not an error — transition to cancelled state
        if (isCancelledError(err)) {
          if (isMountedRef.current) dispatch({ type: 'CANCELLED' });
          return;
        }

        // Timeout is an error but still abortable
        const typedError = err as E;

        // Retry logic
        if (attempt <= maxRetries && !signal.aborted) {
          const delay = getRetryDelay(retryDelay, attempt);
          if (delay > 0) {
            try {
              await sleep(delay, signal);
            } catch {
              // sleep was cancelled
              if (isMountedRef.current) dispatch({ type: 'CANCELLED' });
              return;
            }
          }
          return runAttempt();
        }

        // All retries exhausted
        if (!isMountedRef.current || signal.aborted) return;
        dispatch({ type: 'REJECTED', payload: typedError });
        onErrorRef.current?.(typedError);
      }
    };

    await runAttempt();
  }, [timeout, maxRetries, retryDelay, resetAfter]);

  // ── Cancel ─────────────────────────────────────────────────
  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
    // State transition is handled inside execute's catch block
    // but we dispatch directly too in case execute wasn't running
    dispatch({ type: 'CANCELLED' });
  }, []);

  // ── Reset ──────────────────────────────────────────────────
  const reset = useCallback(() => {
    abortControllerRef.current?.abort();
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    lastFnRef.current = null;
    dispatch({ type: 'RESET' });
  }, []);

  // ── Retry ──────────────────────────────────────────────────
  const retry = useCallback(() => {
    if (!lastFnRef.current) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[usePromiseState] retry() called but no previous fn found.');
      }
      return;
    }
    execute(lastFnRef.current);
  }, [execute]);

  // ── Sync (external state bridge) ──────────────────────────
  const sync = useCallback((externalState: ExternalSyncState<T, E>) => {
    dispatch({ type: 'SYNC', payload: externalState });
  }, []);

  // ── initialFn — runs once on mount ────────────────────────
  const initialFnRef = useRef(initialFn);
  useEffect(() => {
    if (initialFnRef.current) {
      execute(initialFnRef.current);
    }
    // Intentionally empty dep array — runs once on mount only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Compose return value ───────────────────────────────────
  const { promiseState, duration, attempts, lastExecutedAt } = internalState;

  return {
    state: promiseState,
    status: promiseState.status,
    data: promiseState.data,
    error: promiseState.error,
    progress: promiseState.progress,
    duration,
    attempts,
    lastExecutedAt,
    execute,
    reset,
    cancel,
    retry,
    sync,
    setProgress,
  };
}