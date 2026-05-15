// Main hook
export { usePromiseState } from './hooks/usePromiseState';

// Types — consumers need these for TypeScript
export type {
  ExternalSyncState,
  PromiseState,
  PromiseStatus,
  UsePromiseStateOptions,
  UsePromiseStateReturn,
} from './types/types';

// Error classes — consumers may want to check instanceof
export { CancelledError, TimeoutError } from './types/types';

// Utility exports for power users
export { exponentialBackoff } from './utils/utils';