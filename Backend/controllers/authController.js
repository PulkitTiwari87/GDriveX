const User = require('../models/User');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

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

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const userExists = await User.findOne({ email });
        if (userExists) return res.status(400).json({ message: 'User already exists' });

        const user = await User.create({ name, email, password });
        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                bio: user.bio,
                profilePicture: user.profilePicture,
                token: generateToken(user._id),
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
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
        const user = await User.findOne({ email });
        if (user && (await user.matchPassword(password))) {
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                bio: user.bio,
                profilePicture: user.profilePicture,
                token: generateToken(user._id),
            });
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
        const user = await User.findById(req.user._id).select('-password');
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            bio: user.bio,
            profilePicture: user.profilePicture,
        });
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
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (req.body.name !== undefined && req.body.name.trim()) {
            user.name = req.body.name.trim();
        }
        if (req.body.bio !== undefined) {
            user.bio = req.body.bio;
        }

        // If a file was uploaded (in memory), write it to disk now
        if (req.file) {
            const ext = path.extname(req.file.originalname) || '.jpg';
            const filename = `user_${req.user._id}${ext}`;
            const filePath = path.join(UPLOAD_DIR, filename);
            fs.writeFileSync(filePath, req.file.buffer);
            user.profilePicture = `/uploads/profiles/${filename}`;
        }

        const updated = await user.save();

        res.json({
            _id: updated._id,
            name: updated.name,
            email: updated.email,
            bio: updated.bio,
            profilePicture: updated.profilePicture,
        });
    } catch (error) {
        console.error('updateProfile error:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = { registerUser, loginUser, getMe, updateProfile, upload };
