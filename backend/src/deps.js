import { verifyToken, createClerkClient } from "@clerk/backend";
import { createBucketStore } from "./lib/storage/createBucketStore.js";
import { createMailer } from "./lib/mail/createMailer.js";

// The app's external services, as handed to createApp(). These are the real
// ones (Clerk, Supabase Storage, Resend); the test suite passes in-memory
// fakes with the same shape instead (tests/setup/fakes.js).
//
//   clerk   verifySession(token) -> Clerk user id (throws if invalid)
//           fetchUser(userId)    -> the Clerk user object
//   stores  html   - moderator-stitched HTML, one "<postId>.html" per post
//           upload - authors' raw uploads, "<postId>/upload.<ext>"
//   mailer  send(to, subject, html)
export function defaultDeps() {
  const secretKey = process.env.CLERK_SECRET_KEY;
  const clerkClient = createClerkClient({ secretKey });

  return {
    clerk: {
      verifySession: async (token) => (await verifyToken(token, { secretKey })).sub,
      fetchUser: (userId) => clerkClient.users.getUser(userId),
    },
    stores: {
      html: createBucketStore(process.env.SUPABASE_STORAGE_BUCKET),
      upload: createBucketStore(process.env.SUPABASE_UPLOAD_BUCKET),
    },
    mailer: createMailer({
      apiKey: process.env.RESEND_API_KEY,
      from: process.env.EMAIL_FROM || "Breeders Blog <onboarding@resend.dev>",
    }),
  };
}
