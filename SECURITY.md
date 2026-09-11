# G-DriveX Security Checklist

## 1. Environment Secrets
- [ ] **ENCRYPTION_KEY**: Must be a random 32-byte hex string. Do NOT use a simple password.
      Generate with: `openssl rand -hex 32`
- [ ] **JWT_SECRET**: Use a strong, long random string.
- [ ] **SESSION_SECRET**: Use a strong, long random string as well.
- [ ] **.env**: never commit `.env` to version control. Ensure `.gitignore` includes it.

## 2. OAuth & Token Storage
- [x] **Encryption**: Refresh tokens are encrypted using AES-256-CBC before storage in MongoDB.
- [x] **Frontend Access**: Access/Refresh tokens are never sent to the frontend. Frontend only receives a session JWT.
- [x] **Scope**: Default scope is `https://www.googleapis.com/auth/drive`. If you only need readonly, change it in `googleDriveService.js`.

## 3. API Security
- [x] **Helmet**: HTTP headers are secured using `helmet`.
- [x] **CORS**: Configured to restrict access to `CLIENT_URL`.
- [x] **Rate Limiting**: Limited to 100 requests per 15 minutes per IP to prevent abuse.
- [x] **Authentication**: All Drive routes are protected by JWT middleware (`protect`).

## 4. Production Readiness
- [ ] **HTTPS**: Ensure your deployment platform (Render/Vercel) serves over HTTPS.
- [ ] **MongoDB Access**: Whitelist only your backend IP (or 0.0.0.0/0 with strong password if using Atlas serverless).
- [ ] **Logging**: Morgan logging is enabled for `development`. Consider proper logging service for production.

## 5. Deployment Checks
- [ ] Ensure `NODE_ENV` is set to `production`.
- [ ] Verify `CLIENT_URL` matches your frontend domain exactly (no trailing slash usually).

## 6. Fixed Issues (this audit)

- [x] **IDOR on linked Drive accounts**: `listFolderContents`, `listAllContents`, `previewFile`, `uploadFile`, and `deleteFile` accepted an `accountId` from the client and used it to build a Drive client without checking it belonged to the authenticated user. A user could read, upload to, or delete files in another user's linked Google Drive by supplying a different account's Mongo `_id`. Fixed by verifying ownership (`Account.exists({ _id, user })`) before every use of `accountId`.
- [x] **Stored XSS via profile picture upload**: the upload filter accepted any `image/*` mimetype, including `image/svg+xml`, and the file extension was derived from the client-supplied filename. An SVG can embed `<script>` and would have been served back from `/uploads/profiles/...`. Fixed by allow-listing raster types only (JPEG/PNG/WEBP/GIF) and deriving the on-disk extension from the validated mimetype, never from client input.
- [x] **Auth brute force**: added a dedicated rate limiter (20 requests/15 min/IP) on `/api/auth/register`, `/api/auth/login`, and `/api/auth/change-password`, in addition to the existing app-wide limiter.
- [x] **No change-password flow**: the Settings UI had a non-functional password form. Implemented `PUT /api/auth/change-password` (verifies current password, requires 8+ char new password) and wired the frontend to it.
- [x] **Crash on stale JWT**: if a valid JWT referenced a deleted user, `req.user` was `null` and downstream code would throw. `authMiddleware` now returns a clean 401 in that case.
- [x] **No centralized error handling**: unhandled errors (e.g. multer file-filter rejections) could leak stack traces or return non-JSON error pages. Added a JSON error handler and a 404 fallback for unknown `/api/*` routes.
- [x] **Real user PII committed to git**: `Backend/uploads/profiles/*.jpeg` were tracked in the repository. Removed from tracking and added to `.gitignore`.
  **Follow-up required**: these files still exist in the git *history* of the `main` branch. Removing them from history requires a rewrite (e.g. `git filter-repo` or BFG Repo-Cleaner) followed by a coordinated force-push — this is a destructive, history-rewriting operation affecting all clones/collaborators, so it was intentionally **not** done automatically. Run it explicitly when ready, and rotate/notify affected users if the repo is or was public.

## 7. Dependency Audit

`npm audit` was run for both `Backend` and `Frontend`; all reported vulnerabilities (transitive, none in first-party code) were resolved via `npm audit fix` (non-breaking updates only — no `--force`/major bumps were applied). CI runs `npm audit --audit-level=high` on every build (non-blocking) so new advisories are visible without making builds flaky.
