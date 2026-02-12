import { useRef } from 'react';

export function usePersistFn<T extends (...args: any[]) => any>(fn: T) {
  const fnRef = useRef<T>(fn);
  fnRef.current = fn;

  const persistFn = useRef<T>();
  if (!persistFn.current) {
    persistFn.current = ((...args) => {
      return fnRef.current(...args);
    }) as T;
  }

  return persistFn.current;
}
