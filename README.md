# Breeders Blog

A personal blog application with a React frontend and an Express/Prisma backend.

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

## Getting Started

### Prerequisites

- Node.js
- A [Supabase](https://supabase.com) project (Postgres database + Storage bucket)
- A [Clerk](https://clerk.com) application
- A [Resend](https://resend.com) account (for notification emails)

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env   # fill in DATABASE_URL, CLERK_SECRET_KEY, SUPABASE_*, RESEND_*, etc.
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

The API runs on `http://localhost:4000` by default.

### Frontend Setup

```bash
cd app
npm install
cp .env.example .env   # fill in VITE_CLERK_PUBLISHABLE_KEY and VITE_API_BASE_URL
npm run dev
```

The app runs on `http://localhost:5173` by default.

## Project Structure

```
app/       React + Vite frontend
backend/   Express + Prisma API
```

## License

This project is licensed under the [MIT License](LICENSE).
