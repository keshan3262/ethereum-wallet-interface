import { Mutex } from 'async-mutex';

/**
 * Prevents calling a function if its call is already pending. If there is a pending call, the wrapper returns the
 * promise of the pending call; otherwise, it calls the function and returns its promise.
 */
export const withoutConcurrentCall = <T, A extends unknown[]>(fn: (...args: A) => Promise<T>) => {
  const pendingCallMutex = new Mutex();
  let pendingPromise: Promise<T> | undefined;

  return async (...args: A) => {
    const release = await pendingCallMutex.acquire();

    try {
      if (pendingPromise) {
        return pendingPromise;
      }

      pendingPromise = fn(...args);
      const result = await pendingPromise;
      pendingPromise = undefined;

      return result;
    } finally {
      release();
    }
  };
};
