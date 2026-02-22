const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getMe, updateProfile, upload } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe);
router.put('/me', protect, upload.single('profilePicture'), updateProfile);

module.exports = router;
