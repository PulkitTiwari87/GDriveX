const { google } = require('googleapis');
const { encrypt, decrypt } = require('../utils/encryption');
const { prisma } = require('../config/db');

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GENERIC_REDIRECT_URI
);

// Generate a URL for the user to select their Google Account and authorize
const getAuthUrl = () => {
    const scopes = [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/drive', // Full drive access
        // Add 'https://www.googleapis.com/auth/drive.metadata.readonly' for read-only if needed
    ];

    return oauth2Client.generateAuthUrl({
        access_type: 'offline', // Crucial for getting a refresh token
        scope: scopes,
        prompt: 'consent', // Force consent prompt to ensure refresh token is returned
    });
};

const getTokensFromCode = async (code) => {
    const { tokens } = await oauth2Client.getToken(code);
    return tokens;
};

// Helper to get an authenticated Drive client for a specific account.
// userId MUST be provided so we verify the account belongs to the requesting
// user — without this check any authenticated user could operate on any
// other user's linked Google account by guessing/passing its accountId.
const getDriveClient = async (accountId, userId) => {
    if (!userId) throw new Error('userId is required to load a Drive client');
    const account = await prisma.account.findFirst({ where: { id: accountId, userId } });
    if (!account) throw new Error('Account not found or not authorized');

    const client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GENERIC_REDIRECT_URI
    );

    const refreshToken = decrypt({ iv: account.refreshTokenIv, encryptedData: account.refreshTokenData });

    client.setCredentials({
        refresh_token: refreshToken,
        // We can also set access_token if we stored it and it's valid,
        // but setting refresh_token allows the client to auto-refresh.
    });

    // Handle token refresh events if we want to update the DB with new access tokens or rotated refresh tokens
    client.on('tokens', async (tokens) => {
        const data = {};
        if (tokens.refresh_token) {
            // If a new refresh token is issued, encrypt and save it
            const encrypted = encrypt(tokens.refresh_token);
            data.refreshTokenIv = encrypted.iv;
            data.refreshTokenData = encrypted.encryptedData;
        }
        if (tokens.access_token) {
            data.accessToken = tokens.access_token;
            data.expiryDate = tokens.expiry_date;
        }
        if (Object.keys(data).length > 0) {
            await prisma.account.update({ where: { id: account.id }, data });
        }
    });

    return google.drive({ version: 'v3', auth: client });
};

module.exports = {
    getAuthUrl,
    getTokensFromCode,
    getDriveClient,
};
