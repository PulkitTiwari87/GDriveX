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
