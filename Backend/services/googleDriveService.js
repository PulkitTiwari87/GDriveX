const { google } = require('googleapis');
const { encrypt, decrypt } = require('../utils/encryption');
const Account = require('../models/Account');

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

// Helper to get an authenticated Drive client for a specific account
const getDriveClient = async (accountId) => {
    const account = await Account.findById(accountId);
    if (!account) throw new Error('Account not found');

    const client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GENERIC_REDIRECT_URI
    );

    const refreshToken = decrypt(account.tokens.refreshToken);

    client.setCredentials({
        refresh_token: refreshToken,
        // We can also set access_token if we stored it and it's valid, 
        // but setting refresh_token allows the client to auto-refresh.
    });

    // Handle token refresh events if we want to update the DB with new access tokens or rotated refresh tokens
    client.on('tokens', async (tokens) => {
        if (tokens.refresh_token) {
            // If a new refresh token is issued, encrypt and save it
            const encryptedRefresh = encrypt(tokens.refresh_token);
            account.tokens.refreshToken = encryptedRefresh;
        }
        if (tokens.access_token) {
            account.tokens.accessToken = tokens.access_token;
            account.tokens.expiryDate = tokens.expiry_date;
        }
        await account.save();
    });

    return google.drive({ version: 'v3', auth: client });
};

module.exports = {
    getAuthUrl,
    getTokensFromCode,
    getDriveClient,
};
