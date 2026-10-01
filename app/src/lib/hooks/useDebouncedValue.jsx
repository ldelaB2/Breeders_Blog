import { useEffect, useState } from "react";

// `value`, but only once it has stopped changing for `delayMs` - so typing
// in a search box fires one request per pause instead of one per keystroke.
export function useDebouncedValue(value, delayMs) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
