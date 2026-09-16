const { google } = require('googleapis');
const { prisma } = require('../config/db');
const { getAuthUrl, verifyState, getTokensFromCode, getDriveClient } = require('../services/googleDriveService');
const { encrypt } = require('../utils/encryption');
const { toClient, toClientList } = require('../utils/serialize');
const fs = require('fs');

// Fields safe to send to the frontend — never include token columns.
const PUBLIC_ACCOUNT_FIELDS = {
    id: true,
    googleId: true,
    email: true,
    picture: true,
    createdAt: true,
    updatedAt: true,
};

// @desc    Get Google OAuth URL
// @route   GET /api/drive/auth-url
const getGoogleAuthUrl = (req, res) => {
    const url = getAuthUrl(req.user._id);
    res.json({ url });
};

// @desc    Link Google Account (Callback)
// @route   POST /api/drive/callback
const linkGoogleAccount = async (req, res) => {
    const { code, state } = req.body;

    try {
        verifyState(state, req.user._id);
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }

    try {
        const tokens = await getTokensFromCode(code);

        // Get user info to identify account
        const oauth2Client = new google.auth.OAuth2();
        oauth2Client.setCredentials(tokens);
        const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
        const userInfo = await oauth2.userinfo.get();

        // Check if account already linked
        const existing = await prisma.account.findFirst({
            where: { userId: req.user._id, googleId: userInfo.data.id },
        });

        if (existing) {
            const data = { accessToken: tokens.access_token, expiryDate: tokens.expiry_date };
            if (tokens.refresh_token) {
                const encrypted = encrypt(tokens.refresh_token);
                data.refreshTokenIv = encrypted.iv;
                data.refreshTokenData = encrypted.encryptedData;
            }
            const updated = await prisma.account.update({ where: { id: existing.id }, data });
            return res.json({ message: 'Account re-linked successfully', account: toClient(updated) });
        }

        if (!tokens.refresh_token) {
            return res.status(400).json({ message: 'No refresh token received. You may need to revoke access and try again.' });
        }

        const encrypted = encrypt(tokens.refresh_token);
        const newAccount = await prisma.account.create({
            data: {
                userId: req.user._id,
                googleId: userInfo.data.id,
                email: userInfo.data.email,
                picture: userInfo.data.picture,
                accessToken: tokens.access_token,
                refreshTokenIv: encrypted.iv,
                refreshTokenData: encrypted.encryptedData,
                expiryDate: tokens.expiry_date,
                tokenType: tokens.token_type,
                scope: tokens.scope,
            },
        });

        res.status(201).json(toClient(newAccount));

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to link account' });
    }
};

// @desc    List all linked accounts
// @route   GET /api/drive/accounts
const getAccounts = async (req, res) => {
    try {
        const accounts = await prisma.account.findMany({
            where: { userId: req.user._id },
            select: PUBLIC_ACCOUNT_FIELDS,
        });
        res.json(toClientList(accounts));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// @desc    List files from all drives
// @route   GET /api/drive/files
const listFiles = async (req, res) => {
    try {
        const accounts = await prisma.account.findMany({ where: { userId: req.user._id } });
        let allFiles = [];

        // Run in parallel
        const promises = accounts.map(async (account) => {
            try {
                const drive = await getDriveClient(account.id, req.user._id);
                const response = await drive.files.list({
                    pageSize: 20, // Limit for demo
                    fields: 'nextPageToken, files(id, name, mimeType, webViewLink, iconLink, size, createdTime)',
                    q: "trashed = false"
                });

                return response.data.files.map(file => ({
                    ...file,
                    accountId: account.id,
                    accountEmail: account.email
                }));
            } catch (err) {
                console.error(`Error fetching from ${account.email}:`, err.message);
                return [];
            }
        });

        const results = await Promise.all(promises);
        results.forEach(files => {
            allFiles = [...allFiles, ...files];
        });

        // Basic sorting: most recent first
        allFiles.sort((a, b) => new Date(b.createdTime) - new Date(a.createdTime));

        res.json(allFiles);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    List files/folders inside a specific folder (or root) for one account
// @route   GET /api/drive/folder-contents?accountId=&folderId=
const listFolderContents = async (req, res) => {
    const { accountId, folderId = 'root' } = req.query;
    if (!accountId) return res.status(400).json({ message: 'accountId is required' });

    try {
        const drive = await getDriveClient(accountId, req.user._id);
        const response = await drive.files.list({
            pageSize: 100,
            fields: 'nextPageToken, files(id, name, mimeType, webViewLink, iconLink, size, createdTime, parents)',
            q: `'${folderId}' in parents and trashed = false`,
            orderBy: 'folder,name',
        });

        const items = response.data.files.map(file => ({
            ...file,
            accountId,
            isFolder: file.mimeType === 'application/vnd.google-apps.folder',
        }));

        res.json(items);
    } catch (error) {
        console.error(`Error fetching folder contents:`, error.message);
        res.status(500).json({ message: error.message });
    }
};

// @desc    List ALL files and folders in a drive (no folder restriction, paginated up to 1000)
// @route   GET /api/drive/all-contents?accountId=
const listAllContents = async (req, res) => {
    const { accountId } = req.query;
    if (!accountId) return res.status(400).json({ message: 'accountId is required' });

    try {
        const drive = await getDriveClient(accountId, req.user._id);
        let allItems = [];
        let pageToken = null;

        // Page through results — Google caps at 1000/page, we stop at 1000 total for performance
        do {
            const response = await drive.files.list({
                pageSize: 200,
                fields: 'nextPageToken, files(id, name, mimeType, webViewLink, iconLink, size, createdTime, parents)',
                q: 'trashed = false',
                orderBy: 'folder,name',
                ...(pageToken ? { pageToken } : {}),
            });
            const files = response.data.files.map(file => ({
                ...file,
                accountId,
                isFolder: file.mimeType === 'application/vnd.google-apps.folder',
            }));
            allItems = [...allItems, ...files];
            pageToken = response.data.nextPageToken;
        } while (pageToken && allItems.length < 1000);

        res.json(allItems);
    } catch (error) {
        console.error(`Error fetching all drive contents:`, error.message);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Stream a file preview (image/video etc) from Drive through the server
// @route   GET /api/drive/preview?accountId=&fileId=
const previewFile = async (req, res) => {
    const { accountId, fileId } = req.query;
    if (!accountId || !fileId) return res.status(400).json({ message: 'accountId and fileId are required' });

    try {
        const drive = await getDriveClient(accountId, req.user._id);

        // Get metadata for content-type
        const meta = await drive.files.get({ fileId, fields: 'mimeType,name,size' });
        const mimeType = meta.data.mimeType || 'application/octet-stream';

        // Stream the raw file bytes
        const stream = await drive.files.get(
            { fileId, alt: 'media' },
            { responseType: 'stream' }
        );

        res.setHeader('Content-Type', mimeType);
        res.setHeader('Cache-Control', 'private, max-age=300');
        stream.data.pipe(res);
    } catch (error) {
        console.error('Preview error:', error.message);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Upload File
// @route   POST /api/drive/upload
// Uses multer middleware 'file'
const uploadFile = async (req, res) => {
    const { accountId } = req.body;
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    try {
        const drive = await getDriveClient(accountId, req.user._id);

        const fileMetadata = {
            name: req.file.originalname,
        };

        const media = {
            mimeType: req.file.mimetype,
            body: fs.createReadStream(req.file.path),
        };

        const file = await drive.files.create({
            resource: fileMetadata,
            media: media,
            fields: 'id, name, webViewLink',
        });

        // Clean up temp file
        fs.unlinkSync(req.file.path);

        res.json(file.data);

    } catch (error) {
        // Clean up temp file on error
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        res.status(500).json({ message: error.message });
    }
};

// @desc Delete File
// @route DELETE /api/drive/:accountId/:fileId
const deleteFile = async (req, res) => {
    const { accountId, fileId } = req.params;
    try {
        const drive = await getDriveClient(accountId, req.user._id);
        await drive.files.delete({ fileId });
        res.json({ message: "File deleted" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// @desc Storage Analytics
// @route GET /api/drive/analytics
const getAnalytics = async (req, res) => {
    try {
        const accounts = await prisma.account.findMany({ where: { userId: req.user._id } });
        const analytics = await Promise.all(accounts.map(async account => {
            try {
                const drive = await getDriveClient(account.id, req.user._id);
                const about = await drive.about.get({ fields: 'storageQuota' });
                return {
                    accountId: account.id,
                    email: account.email,
                    usage: about.data.storageQuota.usage,
                    limit: about.data.storageQuota.limit,
                    usageInDrive: about.data.storageQuota.usageInDrive,
                    usageInTrash: about.data.storageQuota.usageInTrash
                };
            } catch (err) {
                return { accountId: account.id, email: account.email, error: "Failed to fetch" };
            }
        }));
        res.json(analytics);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// @desc    Unlink Google Account
// @route   DELETE /api/drive/accounts/:accountId
const unlinkAccount = async (req, res) => {
    const { accountId } = req.params;
    try {
        const account = await prisma.account.findFirst({ where: { id: accountId, userId: req.user._id } });

        if (!account) {
            return res.status(404).json({ message: 'Account not found' });
        }

        await prisma.account.delete({ where: { id: accountId } });
        res.json({ message: 'Account unlinked successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getGoogleAuthUrl,
    linkGoogleAccount,
    getAccounts,
    listFiles,
    listFolderContents,
    listAllContents,
    previewFile,
    uploadFile,
    deleteFile,
    getAnalytics,
    unlinkAccount
};
