// src/hooks/use-optimized-state.ts - PERFORMANCE OPTIMIZED STATE MANAGEMENT
import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Optimized state hook with debouncing and batching
 */
export function useOptimizedState<T>(
  initialValue: T,
  options: {
    debounce?: number;
    onChangeCallback?: (value: T) => void;
  } = {}
) {
  const [state, setState] = useState<T>(initialValue);
  const timeoutRef = useRef<number | null>(null);
  const { debounce = 0, onChangeCallback } = options;

  const setOptimizedState = useCallback((value: T | ((prev: T) => T)) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (debounce > 0) {
      timeoutRef.current = window.setTimeout(() => {
        setState(value);
        if (onChangeCallback) {
          const newValue = typeof value === 'function' ? (value as (prev: T) => T)(state) : value;
          onChangeCallback(newValue);
        }
      }, debounce);
    } else {
      setState(value);
      if (onChangeCallback) {
        const newValue = typeof value === 'function' ? (value as (prev: T) => T)(state) : value;
        onChangeCallback(newValue);
      }
    }
  }, [debounce, onChangeCallback, state]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return [state, setOptimizedState] as const;
}

/**
 * Lazy state initialization hook
 */
export function useLazyState<T>(initializer: () => T) {
  const [state] = useState<T>(initializer);
  return state;
}

/**
 * Previous value hook for comparison
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();
  
  useEffect(() => {
    ref.current = value;
  }, [value]);
  
  return ref.current;
}

/**
 * Stable callback hook that doesn't change reference
 */
export function useStableCallback<T extends (...args: any[]) => any>(callback: T): T {
  const callbackRef = useRef(callback);
  
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);
  
  return useCallback(((...args) => callbackRef.current(...args)) as T, []);
}

/**
 * Batched updates hook for multiple state changes
 */
export function useBatchedUpdates() {
  const updatesRef = useRef<Array<() => void>>([]);
  const timeoutRef = useRef<number | null>(null);

  const scheduleUpdate = useCallback((update: () => void) => {
    updatesRef.current.push(update);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(() => {
      const updates = updatesRef.current;
      updatesRef.current = [];
      
      // Execute all updates in a single batch
      updates.forEach(update => update());
    }, 0);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return scheduleUpdate;
}
