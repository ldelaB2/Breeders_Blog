// In-memory stand-ins for the app's external services, matching the shape
// of defaultDeps() in src/deps.js.

// Accepts "test:<userId>" as a session token; anything else is invalid.
// fetchUser returns a Clerk-shaped user; `clerkUsers` lets a test give one a
// role or name before their first request.
function createFakeClerk() {
  const clerkUsers = new Map();
  return {
    clerkUsers,
    verifySession: async (token) => {
      if (!token.startsWith("test:")) throw new Error("invalid token");
      return token.slice(5);
    },
    fetchUser: async (userId) => ({
      fullName: "Test User",
      username: userId,
      imageUrl: `https://img.test/${userId}.png`,
      primaryEmailAddress: { emailAddress: `${userId}@example.com` },
      privateMetadata: {},
      ...clerkUsers.get(userId),
    }),
  };
}

// A bucket as a Map of slug -> { body: Buffer, size }. put() is test-only:
// it stands in for the browser's direct upload to a signed URL.
export function createFakeBucketStore(name) {
  const objects = new Map();
  return {
    objects,
    put(slug, content = "", { size } = {}) {
      const body = Buffer.from(content);
      objects.set(slug, { body, size: size ?? body.length });
    },
    async text(slug) {
      return objects.get(slug)?.body.toString() ?? null;
    },
    async download(slug) {
      if (!objects.has(slug)) throw new Error(`${slug} not found`);
      return objects.get(slug).body;
    },
    async signedUploadUrl(slug) {
      return `https://storage.test/${name}/${slug}?token=signed`;
    },
    async exists(slug) {
      return objects.has(slug);
    },
    async size(slug) {
      return objects.get(slug)?.size ?? null;
    },
    async remove(...slugs) {
      slugs.filter(Boolean).forEach((slug) => objects.delete(slug));
    },
    async listAll() {
      return [...objects.keys()];
    },
    async removeAll() {
      const count = objects.size;
      objects.clear();
      return count;
    },
  };
}

// Records every email instead of sending it.
function createFakeMailer() {
  const sent = [];
  return {
    sent,
    async send(to, subject, html) {
      if (!to || (Array.isArray(to) && to.length === 0)) return;
      sent.push({ to, subject, html });
    },
  };
}

export function createFakes() {
  const clerk = createFakeClerk();
  const stores = { html: createFakeBucketStore("post-html"), upload: createFakeBucketStore("post-upload") };
  const mailer = createFakeMailer();
  return { clerk, stores, mailer, deps: { clerk, stores, mailer } };
}
