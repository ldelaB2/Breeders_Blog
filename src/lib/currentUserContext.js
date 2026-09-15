import { createContext } from "react";

// Value is { role, isAdmin, loading } - see CurrentUserProvider.jsx / useCurrentUser.js.
export const CurrentUserContext = createContext(null);
