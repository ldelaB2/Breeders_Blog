import { verifyToken, createClerkClient } from "@clerk/backend";
import { createBucketStore } from "./lib/storage/createBucketStore.js";
import { createMailer } from "./lib/mail/createMailer.js";
import { env } from "./config/env.js";

// The app's external services, as handed to createApp(). These are the real
// ones (Clerk, Supabase Storage, Resend); the test suite passes in-memory
// fakes with the same shape instead (tests/setup/fakes.js).
//
//   clerk   verifySession(token) -> Clerk user id (throws if invalid)
//           fetchUser(userId)    -> the Clerk user object
//   stores  html   - moderator-stitched HTML, one "<postId>.html" per post
//           upload - authors' raw uploads, "<postId>/upload.<ext>"
//           image  - optional share images, "<postId>/share.<ext>" (public bucket)
//   mailer  send(to, subject, html)
export function defaultDeps() {
  const secretKey = env.clerkSecretKey;
  const clerkClient = createClerkClient({ secretKey });

  return {
    clerk: {
      // authorizedParties: the token's `azp` (the origin it was minted for)
      // must be one of the frontends allowed to call the API.
      verifySession: async (token) => (await verifyToken(token, { secretKey, authorizedParties: env.corsOrigins })).sub,
      fetchUser: (userId) => clerkClient.users.getUser(userId),
    },
    stores: {
      html: createBucketStore(env.htmlBucket),
      upload: createBucketStore(env.uploadBucket),
      image: createBucketStore(env.imageBucket),
    },
    mailer: createMailer({ apiKey: env.resendApiKey, from: env.emailFrom }),
  };
}
