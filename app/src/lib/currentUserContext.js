import { createContext } from "react";

// Value is { isAdmin, isModerator, loading } - see CurrentUserProvider.jsx / useCurrentUser.js.
export const CurrentUserContext = createContext(null);
