// Roles in ascending order of power; each includes everything below it.
export const ROLES = ["USER", "MODERATOR", "ADMIN"];

// Whether `role` is at least `minRole` (e.g. an ADMIN has MODERATOR rights).
export const hasRole = (role, minRole) => ROLES.indexOf(role) >= ROLES.indexOf(minRole);

export const isModerator = (role) => hasRole(role, "MODERATOR");
