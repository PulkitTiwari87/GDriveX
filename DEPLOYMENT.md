# Deployment Guide for G-DriveX

## 1. Backend Deployment (Render)

Render is great for Node.js backends.

1.  **Push code to GitHub**: Create a repository with `Backend` and `Frontend` folders.
2.  **Create Web Service**:
    *   Connect your GitHub repo.
    *   **Root Directory**: `Backend`
    *   **Build Command**: `npm install`
    *   **Start Command**: `node server.js`
3.  **Environment Variables**:
    Add the following in Render Dashboard:
    *   `NODE_ENV`: `production`
    *   `MONGODB_URI`: Your Atlas Connection String
    *   `GOOGLE_CLIENT_ID`: From Google Cloud Console
    *   `GOOGLE_CLIENT_SECRET`: From Google Cloud Console
    *   `GENERIC_REDIRECT_URI`: `https://your-frontend-domain.vercel.app/auth/callback` (See Frontend step)
    *   `ENCRYPTION_KEY`: Your 32-byte hex key
    *   `JWT_SECRET`: Strong secret
    *   `CLIENT_URL`: `https://your-frontend-domain.vercel.app`

## 2. Frontend Deployment (Vercel)

Vercel is optimized for Vite/React.

1.  **Import Project**:
    *   Select the same GitHub repo.
2.  **Configure Project**:
    *   **Root Directory**: `Frontend`
    *   **Framework Preset**: Vite
    *   **Build Command**: `npm run build`
    *   **Output Directory**: `dist`
3.  **Environment Variables**:
    *   `VITE_BACKEND_URL`: `https://your-backend-service.onrender.com/api` (The URL provided by Render)
    *   `VITE_GOOGLE_CLIENT_ID`: Your Google Client ID

## 3. Google Cloud Console Update

Once deployed:
1.  Go to **APIs & Services > Credentials**.
2.  Edit your OAuth Client.
3.  Add your Vercel domain to **Authorized JavaScript origins**.
4.  Add `https://your-frontend-domain.vercel.app/auth/callback` to **Authorized redirect URIs**.
    *   *Note*: Ensure this matches exactly what you configured in Frontend code/logic.

## 4. Verification

1.  Visit your Vercel URL.
2.  Sign up.
3.  Try linking a Google Account.
4.  If you get a `redirect_uri_mismatch` error, check Step 3.
