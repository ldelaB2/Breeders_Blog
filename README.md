# Breeders Blog

A blog for plant breeding research at [www.breedersblog.net](https://www.breedersblog.net). Authors submit posts as Markdown, Quarto or R Markdown files; an admin reviews and renders them before they go live. Readers vote, pin, comment and share.

| Folder | What it is | Details |
| --- | --- | --- |
| [`app/`](app/) | React + Vite frontend, plus one Vercel Function for SEO | [app/README.md](app/README.md) |
| [`backend/`](backend/) | Express + Prisma API, with a test suite | [backend/README.md](backend/README.md) |

**Stack:** React 19, Tailwind, Express, Prisma, PostgreSQL and Storage on [Supabase](https://supabase.com), auth by [Clerk](https://clerk.com), email by [Resend](https://resend.com), hosting on [Vercel](https://vercel.com) as two separate projects.

## Quick start

```bash
cd backend && npm install && cp .env.example .env   # fill in, then:
npm run dev                                          # API on http://localhost:4000

cd app && npm install && cp .env.example .env        # fill in, then:
npm run dev                                          # site on http://localhost:5173
```

Each folder's README covers its environment variables, structure, tests and deployment.

## License

[MIT](LICENSE)
