import { useMemo } from "react";
import { useAuth } from "@clerk/react";
import { createApi } from "./client";

// The API client bound to the current Clerk session. Clerk's getToken is
// stable across renders, so this returns the same object every render and
// is safe to list in effect/hook deps.
export function useApi() {
  const { getToken } = useAuth();
  return useMemo(() => createApi(getToken), [getToken]);
}
