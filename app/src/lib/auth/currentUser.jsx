import { createStrictContext } from "@/lib/utils/createStrictContext";

// Value is { isAdmin, isModerator, hasRole(role), loading } - see CurrentUserProvider.jsx.
export const [CurrentUserContext, useCurrentUser] = createStrictContext("CurrentUser");
