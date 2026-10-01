import { StorageClient } from "@supabase/storage-js";
import { env } from "../../config/env.js";

// Storage-only Supabase client (not the full @supabase/supabase-js, which
// drags in a Realtime websocket dependency the backend has no use for),
// authenticated with the service role key so it can read/write the private
// buckets directly, bypassing RLS. Neither bucket grants anon/authenticated
// access - only this client, or the short-lived signed URLs it mints, can
// touch them. Created on first use so importing this never needs env vars.
let client;
function storageClient() {
  client ??= new StorageClient(`${env.supabaseUrl}/storage/v1`, {
    apikey: env.supabaseServiceRoleKey,
    Authorization: `Bearer ${env.supabaseServiceRoleKey}`,
  });
  return client;
}

const LIST_PAGE = 1000;

// One private bucket, behind the small interface the app needs. Objects are
// addressed by a slug (the object path, e.g. "<postId>.html" or
// "<postId>/upload.md"). The in-memory fake in tests/setup/fakes.js
// implements the same interface.
export function createBucketStore(bucketName) {
  const bucket = () => storageClient().from(bucketName);

  async function list(prefix) {
    const entries = [];
    for (let offset = 0; ; offset += LIST_PAGE) {
      const { data, error } = await bucket().list(prefix, { limit: LIST_PAGE, offset });
      if (error) throw error;
      entries.push(...data);
      if (data.length < LIST_PAGE) return entries;
    }
  }

  const store = {
    // The object's text, or null if it's missing or unreadable.
    async text(slug) {
      if (!slug) return null;
      const { data, error } = await bucket().download(slug);
      if (error) return null;
      return data.text();
    },

    // The object's bytes; throws if it can't be fetched.
    async download(slug) {
      const { data, error } = await bucket().download(slug);
      if (error) throw error;
      return Buffer.from(await data.arrayBuffer());
    },

    // A short-lived signed PUT URL the browser uploads to directly - bypasses
    // Vercel's ~4.5mb function request-body cap. upsert: true so a retry (or
    // re-approving a post) reuses the same slug.
    async signedUploadUrl(slug) {
      const { data, error } = await bucket().createSignedUploadUrl(slug, { upsert: true });
      if (error) throw error;
      return data.signedUrl;
    },

    // Confirms a direct upload actually landed - a signed-URL PUT that failed
    // client-side would otherwise go unnoticed.
    async exists(slug) {
      const { data } = await bucket().exists(slug);
      return Boolean(data);
    },

    // Storage-reported size in bytes, or null if the object doesn't exist -
    // never trust a client-claimed file size.
    async size(slug) {
      const cut = slug.lastIndexOf("/");
      const folder = cut === -1 ? "" : slug.slice(0, cut);
      const name = slug.slice(cut + 1);
      const { data, error } = await bucket().list(folder, { search: name });
      if (error) throw error;
      const file = data?.find((f) => f.name === name);
      return file ? (file.metadata?.size ?? null) : null;
    },

    // Removes the given objects; falsy slugs are skipped.
    async remove(...slugs) {
      const paths = slugs.filter(Boolean);
      if (paths.length) await bucket().remove(paths);
    },

    // Every object's slug, descending into folders (entries with no id).
    async listAll(prefix = "") {
      const slugs = [];
      for (const entry of await list(prefix)) {
        const path = prefix ? `${prefix}/${entry.name}` : entry.name;
        if (entry.id === null) slugs.push(...(await store.listAll(path)));
        else slugs.push(path);
      }
      return slugs;
    },

    // Empties the bucket; resolves to the number of objects removed.
    async removeAll() {
      const slugs = await store.listAll();
      await store.remove(...slugs);
      return slugs.length;
    },
  };

  return store;
}
