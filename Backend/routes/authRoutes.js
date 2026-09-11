const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const { registerUser, loginUser, getMe, updateProfile, changePassword, upload } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Tighter limiter for credential-guessing-prone endpoints, on top of the
// app-wide limiter, to slow down brute-force/credential-stuffing attempts.
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many attempts, please try again later.' },
});

router.post('/register', authLimiter, registerUser);
router.post('/login', authLimiter, loginUser);
router.get('/me', protect, getMe);
router.put('/me', protect, upload.single('profilePicture'), updateProfile);
router.put('/change-password', protect, authLimiter, changePassword);

module.exports = router;
