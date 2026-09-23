-- Defence in depth for Supabase's `rls_disabled_in_public` advisory.
--
-- Nothing in this app talks to Supabase's Data API (PostgREST): Prisma
-- connects straight to Postgres and Storage is reached server-side with the
-- service role key (src/lib/storage.js). The Data API is disabled on the
-- project for that reason -- this migration is the second layer, so the
-- tables stay closed to `anon`/`authenticated` even if it is ever switched
-- back on.
--
-- No policies are created on purpose: RLS on with zero policies denies
-- everything. Authorization for this app lives in Express (requireAuth /
-- requireRole in src/middleware/requireAuth.js), and mirroring those rules
-- as SQL policies would make two sources of truth for one set of rules.
--
-- This does not affect the app. DATABASE_URL/DIRECT_URL connect as Supabase's
-- `postgres` role, which has BYPASSRLS and owns these tables. Do NOT add
-- FORCE ROW LEVEL SECURITY -- that would override the owner's bypass and
-- lock Prisma out of every table.

ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PostMetadata" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PostBody" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PendingPostUpload" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Vote" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Pin" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Comment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CommentVote" ENABLE ROW LEVEL SECURITY;

-- Prisma's own bookkeeping table sits in `public` too, so the same advisory
-- flags it.
ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;
