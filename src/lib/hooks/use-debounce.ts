import { useEffect, useState } from 'react';

/**
 * Returns `value` only after it has been stable for `delay` ms (09 §2 search:
 * ~300ms debounce as the user types). Falls back to the current value during
 * the window so UIs never render empty while the input is being typed into.
 */
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [delay, value]);

  return debounced;
}
