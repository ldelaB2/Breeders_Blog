# Breeders Blog

A personal blog with a React frontend and an Express/Prisma backend. Authors submit posts (.md/.qmd/.rmd/.zip) which an admin reviews, renders and approves; readers vote, pin and comment.

## Tech Stack

| Layer        | Tech                                                                              |
| ------------ | ---------------------------------------------------------------------------------- |
| Frontend     | React 19 + Vite, Tailwind CSS, React Router                                       |
| Backend      | Node.js + Express, Prisma ORM                                                     |
| Database     | PostgreSQL ([Supabase](https://supabase.com))                                     |
| File storage | Supabase Storage                                                                   |
| Auth         | [Clerk](https://clerk.com)                                                         |
| Email        | [Resend](https://resend.com)                                                       |
| Hosting      | [Vercel](https://vercel.com) (frontend + backend, deployed as separate projects)   |

## Project Structure

```
app/       React + Vite frontend
backend/   Express + Prisma API (Vercel entrypoint: api/index.js; local: src/server.js)
```

## Local Development

```bash
cd backend
npm install             # also runs `prisma generate`
cp .env.example .env    # fill in DATABASE_URL, DIRECT_URL, CLERK_*, SUPABASE_*, RESEND_API_KEY
npm run prisma:migrate  # applies migrations to the database in .env
npm run dev             # http://localhost:4000

cd app
npm install
cp .env.example .env    # fill in VITE_CLERK_PUBLISHABLE_KEY (VITE_API_BASE_URL already points at the backend above)
npm run dev             # http://localhost:5173
```

## One-time Infrastructure Setup

Things configured in dashboards rather than code:

- **Supabase Storage** — two private buckets (no anon/authenticated policies; the backend uses the service role key and mints short-lived signed URLs):
  - `post-html` (stitched HTML for approved posts): *Allowed MIME types* = `text/html`.
  - `post-upload` (authors' raw uploads): *File size limit* = 50 MB.
- **Clerk** — a webhook for `user.created` and `user.updated` pointing at `<backend>/api/webhooks/clerk`, with its signing secret in `CLERK_WEBHOOK_SIGNING_SECRET`. Roles are assigned per user under *Private metadata* as `{ "role": "ADMIN" }` (or `MODERATOR`).
- **Vercel** — every variable in `backend/.env.example` and `app/.env.example` set on the respective project, with `SITE_URL`/`CORS_ORIGIN` pointing at the frontend's production URL.

## License

This project is licensed under the [MIT License](LICENSE).
