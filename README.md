# Breeders Blog

A personal blog application with a React frontend and an Express/Prisma backend.

## Tech Stack

**Frontend** (`app/`)
- React 19 + Vite
- React Router
- Tailwind CSS
- Clerk (authentication)

**Backend** (`backend/`)
- Express
- Prisma + PostgreSQL
- Clerk (auth verification)
- Cloudflare R2 (file storage)

## Getting Started

### Prerequisites

- Node.js
- A PostgreSQL database (e.g. [Supabase](https://supabase.com))
- A [Clerk](https://clerk.com) application
- A [Cloudflare R2](https://developers.cloudflare.com/r2/) bucket (for media storage)

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env   # fill in DATABASE_URL, CLERK_SECRET_KEY, R2 credentials, etc.
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
