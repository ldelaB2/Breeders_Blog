import { StorageClient } from "@supabase/storage-js";

// Storage-only Supabase client (not the full @supabase/supabase-js, which
// drags in a Realtime websocket dependency the backend has no use for),
// authenticated with the service role key so it can read/write the private
// buckets directly, bypassing RLS. Neither bucket grants anon/authenticated
// access - only this client, or the short-lived signed URLs it mints, can
// touch them.
export const storage = new StorageClient(`${process.env.SUPABASE_URL}/storage/v1`, {
  apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
});
