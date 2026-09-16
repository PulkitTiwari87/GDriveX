# G-DriveX

**Unified Multi-Google Drive Management Platform**

G-DriveX is a secure SaaS application that allows users to manage multiple Google Drive accounts from a single, professional dashboard.

## Features
- 🔐 **Secure**: AES-256 encryption for all stored OAuth tokens.
- 📂 **Unified View**: See files from multiple accounts in one place.
- 📊 **Analytics**: Visualize storage usage across accounts.
- 🚀 **Performant**: Built with React, Vite, and Node.js.

## Tech Stack
- **Frontend**: React, Vite, TailwindCSS, Zustand
- **Backend**: Node.js, Express, PostgreSQL (via Prisma ORM)
- **Security**: Helmet, Rate Limiting, AES-256 Encryption

## Setup & Installation

### Prerequisites
- Node.js (v18+)
- A PostgreSQL database — a free tier on [Neon](https://neon.tech), [Supabase](https://supabase.com),
  or Render Postgres all work, or a local install
- Google Cloud Console Project (with Drive API enabled)

### Environment Variables
Copy `.env.example` to `.env` in the `Backend` directory and fill in the values,
including `DATABASE_URL`.

### Installation

1.  **Clone the repository**
2.  **Install Dependencies**
    ```bash
    # Backend
    cd Backend
    npm install
    
    # Frontend
    cd ../Frontend
    npm install
    ```
3.  **Create the database schema** (Backend directory, once `DATABASE_URL` is set)
    ```bash
    npx prisma migrate dev --name init
    ```
4.  **Run Development Servers**
    ```bash
    # Terminal 1 (Backend)
    cd Backend
    npm run dev
    
    # Terminal 2 (Frontend)
    cd Frontend
    npm run dev
    ```

## Testing & Checks

```bash
# Backend — unit tests (Node's built-in test runner, no extra dependency)
cd Backend
npm test

# Frontend — lint and production build
cd Frontend
npm run lint
npm run build
```

Backend tests currently cover token encryption, transfer validation/error
classification, and the account-ownership check in `getDriveClient`
(regression coverage for the cross-account access fix below). There is no
integration or E2E test suite yet — see "Known Limitations" below.

## CI/CD

A GitHub Actions workflow (`.github/workflows/ci.yml`) runs on every push/PR
to `main`: backend `npm test` + `npm audit`, and frontend `npm run lint` +
`npm run build` + `npm audit`. It does not deploy anything — deployment stays
on Vercel/Render as configured in `DEPLOYMENT.md`.

## Known Limitations

- No integration or E2E tests yet (unit tests only, with Prisma calls mocked
  — nothing has been run against a live Postgres instance in this environment).
- The Postgres schema (`Backend/prisma/schema.prisma`) has been validated with
  `prisma validate` but no migration has been generated/applied yet — run
  `npx prisma migrate dev --name init` once `DATABASE_URL` points at a real
  database.
- `npm audit` on the backend reports one high-severity advisory in
  `deepmerge-ts`, a transitive dependency of the `prisma` CLI's config loader
  (`@prisma/config`). It affects the dev-time CLI only, not the `@prisma/client`
  runtime bundled into the app; fixing it requires Prisma 7's newer
  driver-adapter configuration model, which is a larger, less-established
  migration than this pass covers.
- Notification preferences in Settings are UI-only placeholders — no
  notification delivery system exists yet.
- No password-strength meter beyond a minimum length check.
