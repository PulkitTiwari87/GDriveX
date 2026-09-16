# G-DriveX Security Checklist

## 1. Environment Secrets
- [ ] **ENCRYPTION_KEY**: Must be a random 32-byte hex string. Do NOT use a simple password.
      Generate with: `openssl rand -hex 32`
- [ ] **JWT_SECRET**: Use a strong, long random string.
- [ ] **SESSION_SECRET**: Use a strong, long random string as well.
- [ ] **.env**: never commit `.env` to version control. Ensure `.gitignore` includes it.

## 2. OAuth & Token Storage
- [x] **Encryption**: Refresh tokens are encrypted using AES-256-CBC before storage in PostgreSQL.
- [x] **Frontend Access**: Access/Refresh tokens are never sent to the frontend. Frontend only receives a session JWT.
- [x] **Scope**: Default scope is `https://www.googleapis.com/auth/drive`. If you only need readonly, change it in `googleDriveService.js`.

## 3. API Security
- [x] **Helmet**: HTTP headers are secured using `helmet`.
- [x] **CORS**: Configured to restrict access to `CLIENT_URL`.
- [x] **Rate Limiting**: Limited to 100 requests per 15 minutes per IP to prevent abuse.
- [x] **Authentication**: All Drive routes are protected by JWT middleware (`protect`).
- [x] **Account ownership**: `getDriveClient(accountId, userId)` requires a `userId` and
      scopes the lookup to `{ _id: accountId, user: userId }`. Previously several routes
      (`folder-contents`, `all-contents`, `preview`, `upload`, `delete`) called it with only
      `accountId`, letting any authenticated user act on another user's linked Google account
      by passing its ObjectId — fixed by making `userId` a required parameter with no insecure
      fallback. Covered by `Backend/test/googleDriveService.test.js`.
- [x] **OAuth state (CSRF)**: `GET /api/drive/auth-url` now embeds a short-lived signed
      `state` token (JWT, 10 min expiry) binding the flow to the requesting user's id.
      `POST /api/drive/callback` verifies it via `verifyState(state, userId)` before exchanging
      the code, rejecting the request with 400 if `state` is missing, expired, tampered with,
      or was issued for a different user. Previously the account-linking flow had no `state`
      param at all, so an attacker could start their own OAuth flow, capture the `code`, and
      trick a logged-in victim into submitting it — silently linking the attacker's Google
      account to the victim's GDriveX profile (any file the victim then uploaded to that
      "linked" account would land in the attacker's Drive). Covered by
      `Backend/test/googleDriveService.test.js`.

## 4. Production Readiness
- [ ] **HTTPS**: Ensure your deployment platform (Render/Vercel) serves over HTTPS.
- [ ] **PostgreSQL Access**: Restrict database access to your backend's IP where your provider supports it; always use a strong password and an SSL connection string (`?sslmode=require`).
- [ ] **Logging**: Morgan logging is enabled for `development`. Consider proper logging service for production.

## 5. Deployment Checks
- [ ] Ensure `NODE_ENV` is set to `production`.
- [ ] Verify `CLIENT_URL` matches your frontend domain exactly (no trailing slash usually).
