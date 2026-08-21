import { useEffect, useState } from "react";
import { SEARCH_DEBOUNCE_MS } from "@shared/constants/pagination";

/** Debounce a value — useful for search inputs before hitting paginated APIs. */
export function useDebouncedValue<T>(value: T, delayMs = SEARCH_DEBOUNCE_MS): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}
