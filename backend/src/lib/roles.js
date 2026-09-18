export const VALID_ROLES = ["USER", "MODERATOR", "ADMIN"];

export const isModerator = (role) => role === "MODERATOR" || role === "ADMIN";
