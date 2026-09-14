const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { prisma } = require('../config/db');
const { hashPassword, verifyPassword } = require('../utils/password');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '30d',
    });
};

// Ensure uploads dir exists at startup
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'profiles');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Multer storage — use memoryStorage so we handle saving manually
// This avoids the timing issue where req.user might not be set yet inside diskStorage callbacks
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
            return cb(new Error('Only image files are allowed'));
        }
        cb(null, true);
    },
});

const toClientUser = (user) => ({
    _id: user.id,
    name: user.name,
    email: user.email,
    bio: user.bio,
    profilePicture: user.profilePicture,
});

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
    const { name, email, password } = req.body;
    try {
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'name, email, and password are required' });
        }
        if (password.length < 8) {
            return res.status(400).json({ message: 'Password must be at least 8 characters' });
        }

        const userExists = await prisma.user.findUnique({ where: { email } });
        if (userExists) return res.status(400).json({ message: 'User already exists' });

        const user = await prisma.user.create({
            data: { name, email, password: await hashPassword(password) },
        });

        res.status(201).json({ ...toClientUser(user), token: generateToken(user.id) });
    } catch (error) {
        console.error('registerUser error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (user && (await verifyPassword(password, user.password))) {
            res.json({ ...toClientUser(user), token: generateToken(user.id) });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        console.error('loginUser error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({ where: { id: req.user._id } });
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(toClientUser(user));
    } catch (error) {
        console.error('getMe error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update user profile (name, bio, profilePicture)
// @route   PUT /api/auth/me
// @access  Private
const updateProfile = async (req, res) => {
    try {
        const data = {};
        if (req.body.name !== undefined && req.body.name.trim()) {
            data.name = req.body.name.trim();
        }
        if (req.body.bio !== undefined) {
            data.bio = req.body.bio;
        }

        // If a file was uploaded (in memory), write it to disk now
        if (req.file) {
            const ext = path.extname(req.file.originalname) || '.jpg';
            const filename = `user_${req.user._id}${ext}`;
            const filePath = path.join(UPLOAD_DIR, filename);
            fs.writeFileSync(filePath, req.file.buffer);
            data.profilePicture = `/uploads/profiles/${filename}`;
        }

        const updated = await prisma.user.update({ where: { id: req.user._id }, data });
        res.json(toClientUser(updated));
    } catch (error) {
        console.error('updateProfile error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Change the current user's password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'currentPassword and newPassword are required' });
    }
    if (newPassword.length < 8) {
        return res.status(400).json({ message: 'New password must be at least 8 characters' });
    }

    try {
        const user = await prisma.user.findUnique({ where: { id: req.user._id } });
        if (!user) return res.status(404).json({ message: 'User not found' });

        // 400, not 401: the request is properly authenticated (valid JWT) — this
        // is a wrong secondary credential, not an expired/invalid session. The
        // frontend's axios interceptor treats any 401 as "session expired" and
        // force-logs-out, which would otherwise wipe this error off the screen.
        const isMatch = await verifyPassword(currentPassword, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect' });

        await prisma.user.update({
            where: { id: req.user._id },
            data: { password: await hashPassword(newPassword) },
        });

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('changePassword error:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = { registerUser, loginUser, getMe, updateProfile, changePassword, upload };
