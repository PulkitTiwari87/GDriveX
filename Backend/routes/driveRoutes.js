const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect } = require('../middleware/authMiddleware');
const {
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
} = require('../controllers/driveController');
const { transferFile, bulkTransferFiles, getTransferHistory } = require('../controllers/transferController');

// Multer Setup
const upload = multer({ dest: 'uploads/' });

// Drive Routes
router.get('/auth-url', protect, getGoogleAuthUrl);
router.post('/callback', protect, linkGoogleAccount);
router.get('/accounts', protect, getAccounts);
router.get('/analytics', protect, getAnalytics);
router.get('/files', protect, listFiles);
router.get('/folder-contents', protect, listFolderContents);
router.get('/all-contents', protect, listAllContents);
router.get('/preview', protect, previewFile);
router.post('/upload', protect, upload.single('file'), uploadFile);
// IMPORTANT: specific routes before dynamic ones
router.delete('/accounts/:accountId', protect, unlinkAccount);
router.delete('/:accountId/:fileId', protect, deleteFile);

// Transfer Routes
router.post('/transfer', protect, transferFile);
router.post('/transfer-bulk', protect, bulkTransferFiles);
router.get('/transfers', protect, getTransferHistory);

module.exports = router;
