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
- **Backend**: Node.js, Express, MongoDB
- **Security**: Helmet, Rate Limiting, AES-256 Encryption

## Setup & Installation

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas URI
- Google Cloud Console Project (with Drive API enabled)

### Environment Variables
Copy `.env.example` to `.env` in the `Backend` directory and fill in the values.

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
3.  **Run Development Servers**
    ```bash
    # Terminal 1 (Backend)
    cd Backend
    npm run dev
    
    # Terminal 2 (Frontend)
    cd Frontend
    npm run dev
    ```

## Testing & CI

- Backend unit tests: `cd Backend && npm test` (Jest — deterministic, no network/database required).
- Frontend lint: `cd Frontend && npm run lint`
- Frontend production build: `cd Frontend && npm run build`
- A GitHub Actions workflow (`.github/workflows/ci.yml`) runs all of the above on every push/PR to `main`.

## Known Limitations

- No end-to-end test suite yet (Playwright/Cypress) — only backend unit tests and frontend lint/build are automated.
- The "Notification Preferences" toggles in Settings are UI-only placeholders (labelled "Coming soon") — no notification delivery system exists yet.
- Backend is deployed on Render, not Vercel; only the Frontend is on Vercel (see `DEPLOYMENT.md`).
- Git history (prior to this change) still contains committed user profile-photo files under `Backend/uploads/profiles/`; see `SECURITY.md` for the recommended follow-up.
