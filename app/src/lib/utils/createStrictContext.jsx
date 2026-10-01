import { createContext, useContext } from "react";

// Returns [Context, useValue] for an app-wide provider. useValue throws when
// called outside the provider, so a missing wrapper fails loudly instead of
// quietly handing back null.
export function createStrictContext(name) {
  const Context = createContext(null);

  function useStrictContext() {
    const value = useContext(Context);
    if (value === null) throw new Error(`use${name} must be used within a ${name}Provider`);
    return value;
  }

  return [Context, useStrictContext];
}
