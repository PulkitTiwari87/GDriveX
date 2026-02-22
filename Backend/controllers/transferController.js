const { getDriveClient } = require('../services/googleDriveService');
const Account = require('../models/Account');
const Transfer = require('../models/Transfer');
const { PassThrough } = require('stream');

// ── Helpers ─────────────────────────────────────────────────────────────────

const EXPORT_MIME_MAP = {
    'application/vnd.google-apps.document':
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.google-apps.spreadsheet':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.google-apps.presentation':
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.google-apps.drawing': 'image/png',
};

const validateTransferInput = ({ sourceAccountId, targetAccountId, fileId, action }) => {
    if (!sourceAccountId || !targetAccountId || !fileId || !action)
        return 'sourceAccountId, targetAccountId, fileId, and action are required';
    if (!['copy', 'move'].includes(action))
        return 'action must be "copy" or "move"';
    if (String(sourceAccountId) === String(targetAccountId))
        return 'Source and target accounts must be different';
    return null;
};

const classifyError = (err) => {
    const status = err.code || err.status || err.response?.status;
    if (status === 403)
        return err.message?.includes('storageQuota')
            ? 'Transfer failed: target account storage quota exceeded'
            : 'Transfer failed: insufficient permissions on source or target account';
    if (status === 401)
        return 'Transfer failed: account token expired. Re-link the account and try again.';
    if (status === 404)
        return 'Transfer failed: source file not found (it may have been deleted)';
    if (err.message?.includes('ECONNRESET') || err.message?.includes('ETIMEDOUT'))
        return 'Transfer failed: network error. Please try again.';
    return `Transfer failed: ${err.message || 'unexpected error'}`;
};

// ── Download helpers ─────────────────────────────────────────────────────────

/**
 * Download a binary file from Google Drive as a PassThrough stream.
 * Using PassThrough avoids issues with the raw axios response stream
 * being consumed before it's piped into the upload.
 */
const downloadFileStream = async (drive, fileId) => {
    const res = await drive.files.get(
        { fileId, alt: 'media' },
        { responseType: 'stream' }
    );
    const passThrough = new PassThrough();
    res.data.pipe(passThrough);
    return passThrough;
};

/**
 * Export a Google Workspace file (Doc/Sheet/Slide) to an Office format,
 * returned as a PassThrough stream.
 */
const exportFileStream = async (drive, fileId, exportMime) => {
    const res = await drive.files.export(
        { fileId, mimeType: exportMime },
        { responseType: 'stream' }
    );
    const passThrough = new PassThrough();
    res.data.pipe(passThrough);
    return passThrough;
};

// ── Shared core logic (used by single + bulk) ────────────────────────────────

/**
 * Transfer a single file between two already-authenticated drive clients.
 * Returns { fileName, uploadedFile } on success, throws on failure.
 */
const transferSingleFile = async ({ sourceDrive, targetDrive, fileId, action }) => {
    const { data: meta } = await sourceDrive.files.get({
        fileId,
        fields: 'id,name,mimeType,size',
    });
    const { name: fileName, mimeType, size } = meta;

    const isGoogleDoc = mimeType?.startsWith('application/vnd.google-apps');
    let downloadStream;
    let uploadMime = mimeType;

    if (isGoogleDoc) {
        uploadMime = EXPORT_MIME_MAP[mimeType] || 'application/pdf';
        downloadStream = await exportFileStream(sourceDrive, fileId, uploadMime);
    } else {
        downloadStream = await downloadFileStream(sourceDrive, fileId);
    }

    const { data: uploadedFile } = await targetDrive.files.create({
        requestBody: { name: fileName, mimeType: uploadMime },
        media: { mimeType: uploadMime, body: downloadStream },
        fields: 'id,name,webViewLink',
    });

    if (action === 'move') {
        await sourceDrive.files.delete({ fileId });
    }

    return { fileName, uploadedFile };
};

// ── Controller ───────────────────────────────────────────────────────────────

// @desc  Transfer a single file between two Google Drive accounts (streaming)
// @route POST /api/drive/transfer
// @access Private
const transferFile = async (req, res) => {
    const { sourceAccountId, targetAccountId, fileId, action } = req.body;

    const validationError = validateTransferInput({ sourceAccountId, targetAccountId, fileId, action });
    if (validationError) return res.status(400).json({ message: validationError });

    // Verify ownership of both accounts
    const [sourceAccount, targetAccount] = await Promise.all([
        Account.findOne({ _id: sourceAccountId, user: req.user._id }),
        Account.findOne({ _id: targetAccountId, user: req.user._id }),
    ]);
    if (!sourceAccount) return res.status(404).json({ message: 'Source account not found or not authorized' });
    if (!targetAccount) return res.status(404).json({ message: 'Target account not found or not authorized' });

    const transferLog = await Transfer.create({
        userId: req.user._id,
        sourceAccountId,
        targetAccountId,
        fileId,
        fileName: 'unknown',
        action,
        status: 'in_progress',
    });

    try {
        const [sourceDrive, targetDrive] = await Promise.all([
            getDriveClient(sourceAccountId),
            getDriveClient(targetAccountId),
        ]);

        console.log(`[Transfer] Starting ${action} of fileId "${fileId}"`);
        const { fileName, uploadedFile } = await transferSingleFile({
            sourceDrive, targetDrive, fileId, action,
        });

        transferLog.fileName = fileName;
        transferLog.status = 'completed';
        await transferLog.save();

        return res.json({
            success: true,
            action,
            fileName,
            uploadedFileId: uploadedFile.id,
            uploadedFileLink: uploadedFile.webViewLink,
            targetAccount: targetAccount.email,
            transferId: transferLog._id,
        });

    } catch (err) {
        console.error('[Transfer] Error:', err.message || err);
        transferLog.status = 'failed';
        transferLog.errorMessage = err.message || 'Unknown error';
        await transferLog.save();
        return res.status(500).json({ message: classifyError(err), transferId: transferLog._id });
    }
};

// @desc  Bulk transfer multiple files between two Google Drive accounts
// @route POST /api/drive/transfer-bulk
// @access Private
const bulkTransferFiles = async (req, res) => {
    const { sourceAccountId, targetAccountId, fileIds, action } = req.body;

    if (!sourceAccountId || !targetAccountId || !Array.isArray(fileIds) || fileIds.length === 0 || !action)
        return res.status(400).json({ message: 'sourceAccountId, targetAccountId, fileIds (array), and action are required' });
    if (!['copy', 'move'].includes(action))
        return res.status(400).json({ message: 'action must be "copy" or "move"' });
    if (String(sourceAccountId) === String(targetAccountId))
        return res.status(400).json({ message: 'Source and target accounts must be different' });
    if (fileIds.length > 50)
        return res.status(400).json({ message: 'Maximum 50 files per bulk transfer' });

    const [sourceAccount, targetAccount] = await Promise.all([
        Account.findOne({ _id: sourceAccountId, user: req.user._id }),
        Account.findOne({ _id: targetAccountId, user: req.user._id }),
    ]);
    if (!sourceAccount) return res.status(404).json({ message: 'Source account not found or not authorized' });
    if (!targetAccount) return res.status(404).json({ message: 'Target account not found or not authorized' });

    const [sourceDrive, targetDrive] = await Promise.all([
        getDriveClient(sourceAccountId),
        getDriveClient(targetAccountId),
    ]);

    const results = await Promise.allSettled(
        fileIds.map(fileId => transferSingleFile({ sourceDrive, targetDrive, fileId, action }))
    );

    const succeeded = [];
    const failed = [];

    results.forEach((result, idx) => {
        if (result.status === 'fulfilled') {
            succeeded.push({ fileId: fileIds[idx], fileName: result.value.fileName });
        } else {
            failed.push({ fileId: fileIds[idx], error: classifyError(result.reason) });
        }
    });

    // Log each transfer
    await Promise.allSettled(
        succeeded.map(({ fileId, fileName }) =>
            Transfer.create({
                userId: req.user._id,
                sourceAccountId,
                targetAccountId,
                fileId,
                fileName,
                action,
                status: 'completed',
            })
        )
    );

    return res.json({
        success: failed.length === 0,
        action,
        targetAccount: targetAccount.email,
        succeeded,
        failed,
    });
};

// @desc  Get transfer history for the current user
// @route GET /api/drive/transfers
// @access Private
const getTransferHistory = async (req, res) => {
    try {
        const transfers = await Transfer.find({ userId: req.user._id })
            .sort({ createdAt: -1 })
            .limit(50)
            .populate('sourceAccountId', 'email')
            .populate('targetAccountId', 'email');
        res.json(transfers);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { transferFile, bulkTransferFiles, getTransferHistory };
