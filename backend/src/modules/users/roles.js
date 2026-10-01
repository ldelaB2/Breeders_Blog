// Roles in ascending order of power; each includes everything below it.
export const ROLES = ["USER", "MODERATOR", "ADMIN"];

// Whether `role` is at least `minRole` (e.g. an ADMIN has MODERATOR rights).
export const hasRole = (role, minRole) => ROLES.indexOf(role) >= ROLES.indexOf(minRole);

export const isModerator = (role) => hasRole(role, "MODERATOR");

// The rule for author-or-staff access (seeing a post's review detail or
// pending post, managing its links, deleting a comment): `user` is req.user
// and may be undefined for an anonymous caller.
export const ownsOrModerates = (user, ownerId) => Boolean(user) && (user.id === ownerId || isModerator(user.role));
