import copyLink from "./copyLink";
import facebook from "./facebook";
import email from "./email";
import reddit from "./reddit";
import x from "./x";
import linkedin from "./linkedin";

// Order matters: the first VISIBLE_COUNT providers render as icons in the
// share modal's main row, the rest live under the "More" popover. Adding a
// new platform is a one-file provider + one entry here.
export const shareProviders = [copyLink, facebook, email, reddit, x, linkedin];
export const VISIBLE_COUNT = 4;
