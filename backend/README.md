# Breeders Blog: Backend

The JSON API at `api.breedersblog.net`, built with Express and Prisma on Supabase Postgres. It handles posts and their review workflow, comments, votes, pins, linked posts, the sitemap, and the Clerk user sync.

**Stack:**
- Node 24 (Vercel) and Express 4
- Prisma 6 on PostgreSQL (Supabase)
- Clerk (`@clerk/backend`, `svix` webhooks)
- Supabase Storage (`@supabase/storage-js`)
- Resend for email
- `archiver` for zips
- `express-rate-limit`

## Running it

```bash
npm install             # also runs `prisma generate`
cp .env.example .env    # fill in the values below
npm run prisma:migrate  # applies migrations to the database in .env
npm run dev             # http://localhost:4000 (node --watch src/server.js)
npm test                # test suite, see "Tests"
```

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Supabase transaction pooler (port 6543, `pgbouncer=true&connection_limit=1`), used at runtime |
| `DIRECT_URL` | Supabase direct connection (port 5432), used only by `prisma migrate` |
| `CLERK_SECRET_KEY` | Verifies session tokens and fetches new users |
| `CLERK_WEBHOOK_SIGNING_SECRET` | Verifies `POST /api/webhooks/clerk` |
| `SITE_URL` | Frontend origin, used for sitemap and email links |
| `CORS_ORIGIN` | Comma-separated origins allowed to call the API |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Storage access (service role, server-side only) |
| `SUPABASE_STORAGE_BUCKET`, `SUPABASE_UPLOAD_BUCKET`, `SUPABASE_IMAGE_BUCKET` | `post-html`, `post-upload` and `post-image` |
| `RESEND_API_KEY`, `EMAIL_FROM` | Notification emails |
| `PORT` | Local port (default 4000) |

All of them are read in one place, [`src/config/env.js`](src/config/env.js). Set the same ones on the Vercel project.

## Folder layout

```
api/index.js           Vercel entrypoint: export default createApp()
vercel.json            rewrites every path to api/index.js
prisma/                schema.prisma + migrations
scripts/               reset-for-launch.js (manual, destructive, see below)
tests/                 node:test + supertest suite; setup/ holds fakes, guard, harness, factories
src/
  server.js            local entrypoint (dotenv + listen)
  app.js               createApp(deps): middleware, route mounts, error handler
  deps.js              the real external services: Clerk, storage buckets, mailer
  config/              env.js, limits.js (input limits, upload types), topics.js
  middleware/          auth.js, loadResource.js, errors.js
  lib/                 shared infrastructure
    db/                prisma.js, prismaErrors.js (ignoreConflicts)
    http/              HttpError, asyncHandler, validate (requireText, optionalString, parseLimit)
    storage/           createBucketStore.js
    mail/              createMailer.js
  modules/             one folder per feature
    posts/             feed, read, submit routes; posts.repo, serializePost, ranking, postUrl, postStatus
    moderation/        approve/reject/download/delete/lock/archive + notification emails
    engagement/        votes and pins (voteRoutes, toggles, serializeVotes)
    links/ comments/ me/ users/ sitemap/ webhooks/
```

## How it works

### Composition and services
- `createApp(deps)` builds the app around three injectable services from `deps.js`:
  - `clerk`: `verifySession`, `fetchUser`
  - `stores`: `html`, `upload` and `image` buckets, all from `createBucketStore`
  - `mailer`: `send`
- Route modules are factories that receive what they need: `auth` middleware, `stores` and `notify`.
- The deployed app uses the real services. The tests pass in-memory fakes with the same shape.
- Prisma is a module singleton (`lib/db/prisma.js`).

### Request pipeline (`app.js`)
1. **CORS** for `CORS_ORIGIN`.
2. **`/api/webhooks/clerk`**, mounted with `express.raw()` before the JSON parser, because svix verifies the exact bytes.
3. **`express.json`** with a 4 MB limit. Files never pass through the API; they upload straight to storage via signed URLs.
4. **Rate limit** on `/api`: 300 requests per 15 minutes per IP. The counter is in memory, so it's per function instance.
5. **Routes**, then `notFound` and `errorHandler`.
   - An `HttpError(status, message)` becomes `{ error: message }`.
   - Anything else is logged and returned as a generic 500.

### Auth (`middleware/auth.js`)
- `requireAuth` verifies the Clerk Bearer token and attaches `req.user = { id, name, role, avatarUrl }`.
  - A missing token returns `401 "Missing auth token"`; a bad one returns `401 "Invalid auth token"`.
  - If the user isn't in the database yet (their webhook hasn't arrived), they're fetched from Clerk once and upserted.
- `optionalAuth` does the same but proceeds anonymously on a missing or invalid token. It's used for reads that differ for signed-in users.
- `requireModerator` and `requireAdmin` are hierarchical (`USER < MODERATOR < ADMIN`, see `modules/users/roles.js`) and return `403 "Forbidden"`.
- `ownsOrModerates(user, ownerId)` is the shared "author or staff" rule. It governs review detail, pending-post visibility, link management and comment deletion.
- Roles come only from Clerk **private** metadata, which users can't edit, and are whitelisted in `upsertUser`.

### Shared patterns
- **Record loading.** `loadResource(router, "id", { find, as, notFound })` loads `:id` records onto `req.post` or `req.comment`, or returns a 404. For posts, use `loadPostParam(router)`.
- **Post queries.** `posts.repo.js` provides `postInclude`, `findPost`, `listPosts` and `updatePost`. Every post response goes through `serializePost(post, req.user)`. That hides review fields from non-owners and never exposes the raw upload.
- **Status rules.**
  - `assertStatus(post, "PENDING", "approved")` returns `400 "Only pending posts can be approved"`.
  - `requireApproved` treats an unapproved post as a 404 for votes and pins.
- **Votes and pins.** `voteRoutes(router, { path, guards, model, keyFor, respond })` registers upvote and downvote for any record; posts and comments both use it.
  - Toggle rules: the same vote again removes it, the opposite vote switches it.
  - `ignoreConflicts` makes racing double-clicks harmless.
- **Input validation.** `requireText`, `optionalString` and `parseLimit` stop non-string JSON or query values (such as `?topicSlug[not]=x`) from reaching Prisma.

### Route mounting order
`modules/posts/index.js` mounts the routers that have static paths (`/`, `/top`, `/search`, `/upload-url`, `/pending`) **before** the read router's `GET /:id`. Otherwise `/pending` would be treated as a post id.

## API

Mounted under `/api` unless noted. Auth column: **opt** = `optionalAuth`, **auth** = signed in, **mod** = moderator or admin, **admin** = admin only.

| Method & path | Auth | Purpose |
| --- | --- | --- |
| `GET /health` | | `{ status: "ok" }` |
| `GET /posts?topicSlug=` | opt | Feed: approved posts, plus your own pending (all pending for mods), newest first |
| `GET /posts/top?limit=` | opt | Top approved posts by rank: votes, comments and log-scaled views (default 5, max 20) |
| `GET /posts/search?q=` | opt | Approved posts whose title or abstract contains every word |
| `GET /posts/:id[?html=0]` | opt | One post plus its stitched HTML (unapproved: author/mods only) |
| `POST /posts/upload-url` | auth | Submit step 1: upload ticket + signed URL (plus one for an optional `imageFilename`) |
| `POST /posts` | auth | Submit step 2: create the PENDING post, email admins |
| `GET /posts/pending` | admin | Review queue, oldest first |
| `POST /posts/:id/approve/upload-url` | admin | Signed URL for the stitched HTML (plus one for an optional replacement `imageFilename`) |
| `POST /posts/:id/approve` | admin | Verify the HTML (and any `imageSlug`) landed, approve, email author |
| `POST /posts/:id/reject` | admin | Reject with `rejectionReason`, email author |
| `GET /posts/:id/download` | admin | Zip of title, abstract, original upload and share image |
| `DELETE /posts/:id` | admin | Permanent delete (DB cascade plus its storage objects) |
| `POST /posts/:id/lock` | mod | Toggle locked (closes comments) |
| `POST /posts/:id/archive` | mod | Move to the Archive topic and lock |
| `POST /posts/:id/upvote`, `/downvote`, `/pin` | auth | Toggle (approved posts only) |
| `POST /posts/:id/view` | opt | Count a page view (approved posts only; client sends once per session) |
| `GET /posts/:id/links` | opt | Approved linked posts, in link order |
| `POST /posts/:id/links`, `DELETE /posts/:id/links/:targetId` | auth | Author or mod manages links |
| `GET /posts/:postId/comments` | | Flat list, oldest first; the frontend threads by `parentId` |
| `POST /posts/:postId/comments` | auth | Comment or reply (approved, unlocked posts) |
| `DELETE /comments/:id` | auth | Soft-delete (author or mod) |
| `POST /comments/:id/restore` | mod | Undo a soft delete |
| `POST /comments/:id/upvote`, `/downvote` | auth | Toggle |
| `GET /me` | auth | `{ id, name, role }`, the only place a role is exposed |
| `GET /me/pins` | auth | Your pinned posts, most recent first |
| `GET /me/recommendations?limit=` | auth | Posts linked from ones you pinned, upvoted or commented on; then top posts in those topics; then global backfill |
| `POST /webhooks/clerk` | svix | `user.created` / `user.updated` → upsert the user |
| `GET /sitemap.xml` (no `/api`) | | Static pages plus every approved post |

## Post lifecycle

1. **Submit.**
   - `POST /posts/upload-url` checks the extension (`.md`, `.qmd`, `.rmd`, `.zip`) and the 5-posts-per-24h limit.
   - It replaces any earlier ticket, then stores a `PendingPostUpload` ticket for `<postId>/upload.<ext>`.
   - With an optional `imageFilename` (`.png`, `.jpg`, `.webp`), the ticket also covers a share image at `<postId>/share.<ext>`.
   - The browser PUTs the file straight to the `post-upload` bucket, and any share image to `post-image`.
   - `POST /posts` checks that the ticket belongs to the caller, that the extension matches, that the object exists and is at most 50 MB, that any share image exists and is at most 5 MB, and the limit again. It then creates the post as `PENDING` and emails the admins.
2. **Review.** The admin downloads the zip and renders it with Quarto. They upload the stitched HTML to `post-html` as `<postId>.html` via a signed URL, then approve. They can also upload a share image that replaces the author's. Approval checks that the objects exist and emails the author.
3. **Reject.** Needs a reason, which is emailed to the author.
4. **After approval:**
   - Readers vote, pin and comment.
   - Moderators lock or archive.
   - Admins can delete permanently.

Emails go through `modules/moderation/notifications.js`. A failed send is logged and never breaks the request.

## Data model (`prisma/schema.prisma`)

- **`User`** mirrors a Clerk user: name, role, avatar and email, kept in sync by the webhook.
- **`PostMetadata`** holds the post: title, abstract, topic, status, locked, author snapshot and review fields.
  - **`PostBody`** stores the storage slugs (`rawSlug`, `rawOriginalName`, `htmlSlug`, and the optional `imageSlug`). Posts serialize the share image as a public `imageUrl`, which the frontend uses as the post's `og:image`.
  - **`PendingPostUpload`** holds submit tickets.
- **`Vote`, `Pin`, `PostLink`, `Comment`** (soft delete through `deletedAt`, self-referencing replies) and **`CommentVote`**.
- Post children cascade on delete.
- Change the schema with `npm run prisma:migrate`, which creates a migration against `DIRECT_URL`. Production applies it on the next production deploy (see *Infrastructure*).

## Tests

`npm test` runs the `node:test` + `supertest` suite (78 tests) against the real app and Prisma. Clerk, Storage and Resend are in-memory fakes (`tests/setup/fakes.js`).

It uses a **local** Postgres database, never the one in `.env`:
- `tests/setup/guard.js` refuses any non-localhost `DATABASE_URL` or `DIRECT_URL`.
- Migrations are applied with the non-destructive `prisma migrate deploy` before each run.
- Every test empties the tables first.

One-time setup in the dev container:

```bash
sudo service postgresql start   # also needed after each container restart
sudo su postgres -c "psql -c \"CREATE ROLE breeders_test LOGIN PASSWORD 'breeders_test' CREATEDB;\""
sudo su postgres -c "psql -c 'CREATE DATABASE breeders_test OWNER breeders_test;'"
cp .env.test.example .env.test
```

If the test database drifts from the migrations, drop and recreate `breeders_test`.

## Scripts

`scripts/reset-for-launch.js` wipes every post, user and stored file. It was a one-time pre-launch cleanup.
- `node scripts/reset-for-launch.js` is a dry run: it prints counts and changes nothing.
- `--confirm` actually deletes everything. Back up the database first.

## Infrastructure (dashboard settings)

- **Supabase Storage:** `post-html` and `post-upload` are private buckets with no anon/authenticated policies. The service role mints short-lived signed URLs.
  - `post-html`: allowed MIME type `text/html`.
  - `post-upload`: file size limit 50 MB.
  - `post-image`: **public** bucket, because link-preview scrapers fetch `og:image` anonymously and cache it for days. Allowed MIME types `image/png, image/jpeg, image/webp` (never SVG), file size limit 5 MB. Uploads still go through signed URLs; the unguessable post id keeps a pending post's image effectively private.
- **Supabase Data API:** turned off.
  - Every `public` table has RLS enabled with no policies (migration `enable_rls`) as a second layer. Authorization lives in Express.
  - This is safe because Prisma connects as `postgres`, which has `BYPASSRLS`. Never add `FORCE ROW LEVEL SECURITY`, or Prisma gets locked out.
- **Clerk:**
  - A webhook for `user.created` and `user.updated` points at `<backend>/api/webhooks/clerk`.
  - Roles are set per user under *Private metadata* as `{ "role": "ADMIN" }` or `MODERATOR`.
- **Vercel:** project `breeders-blog-backend`, with every variable from `.env.example`. `SITE_URL` and `CORS_ORIGIN` point at the frontend's production URL.
  - **Migrations deploy themselves.** Vercel runs the `vercel-build` script, which applies pending migrations with `prisma migrate deploy` (non-destructive) on **production** builds only. Preview builds skip it, so an unmerged PR never changes the production schema. The build runs before the new code goes live, so migrations must stay additive (new nullable columns, new tables) for the old code still serving during the build. `DIRECT_URL` must be set for the Production environment.
