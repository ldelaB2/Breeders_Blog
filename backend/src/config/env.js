// Every environment variable the backend reads, in one place (documented in
// .env.example). Getters, so each value is read when it's used - after
// dotenv has loaded .env in local development (src/server.js).
export const env = {
  // Frontend origin - sitemap and notification email links.
  get siteUrl() {
    return process.env.SITE_URL;
  },
  // Origin(s) allowed to call the API, from a comma-separated list.
  get corsOrigins() {
    return (process.env.CORS_ORIGIN || "")
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean);
  },

  get clerkSecretKey() {
    return process.env.CLERK_SECRET_KEY;
  },
  get clerkWebhookSecret() {
    return process.env.CLERK_WEBHOOK_SIGNING_SECRET;
  },

  get supabaseUrl() {
    return process.env.SUPABASE_URL;
  },
  get supabaseServiceRoleKey() {
    return process.env.SUPABASE_SERVICE_ROLE_KEY;
  },
  get htmlBucket() {
    return process.env.SUPABASE_STORAGE_BUCKET;
  },
  get uploadBucket() {
    return process.env.SUPABASE_UPLOAD_BUCKET;
  },
  get imageBucket() {
    return process.env.SUPABASE_IMAGE_BUCKET;
  },

  get resendApiKey() {
    return process.env.RESEND_API_KEY;
  },
  get emailFrom() {
    return process.env.EMAIL_FROM || "Breeders Blog <onboarding@resend.dev>";
  },
};
