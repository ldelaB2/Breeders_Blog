// Site identity and the author's details, used by the header, footer and
// Contact page. SITE_NAME/SITE_DESCRIPTION live in lib/seo/seo.js (the
// serverless post renderer needs them too) and are re-exported here.
export { SITE_NAME, SITE_DESCRIPTION } from "@/lib/seo/seo";

export const AUTHOR = "Will de la Bretonne";
export const TAGLINE = "The only people that change the world are the ones crazy enough to think they can";

// Files in app/public, served from the site root.
export const LOGO = "/logo.png";
export const HEADSHOT = "/headshot.jpg"; // square-ish crop looks best

export const CONTACT_EMAIL = "ldelab2@outlook.com";
export const LINKEDIN_URL = "https://www.linkedin.com/in/will-de-la-bretonne-8a95a1218/";
export const GITHUB_URL = "https://github.com/ldelaB2";
export const YOUTUBE_URL = "https://www.youtube.com/@SquidBillyWilly";
