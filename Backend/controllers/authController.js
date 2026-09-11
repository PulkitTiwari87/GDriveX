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

// Allow-list of raster image types only. `image/*` is too broad — it also
// matches image/svg+xml, which is XML and can carry <script>, making it a
// classic stored-XSS vector once served back from /uploads/profiles.
const ALLOWED_IMAGE_TYPES = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif',
};

// Multer storage — use memoryStorage so we handle saving manually
// This avoids the timing issue where req.user might not be set yet inside diskStorage callbacks
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    fileFilter: (req, file, cb) => {
        if (!ALLOWED_IMAGE_TYPES[file.mimetype]) {
            const err = new Error('Only JPEG, PNG, WEBP, or GIF images are allowed');
            err.status = 400;
            return cb(err);
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

        // If a file was uploaded (in memory), write it to disk now.
        // The extension is derived from the validated mimetype, never from the
        // client-supplied original filename, to prevent extension spoofing.
        if (req.file) {
            const ext = ALLOWED_IMAGE_TYPES[req.file.mimetype] || '.jpg';
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

// @desc    Change the current user's password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'currentPassword and newPassword are required' });
    }
    if (newPassword.length < 8) {
        return res.status(400).json({ message: 'New password must be at least 8 characters long' });
    }

    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const isMatch = await user.matchPassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({ message: 'Current password is incorrect' });
        }

        user.password = newPassword; // re-hashed by the pre('save') hook
        await user.save();

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('changePassword error:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = { registerUser, loginUser, getMe, updateProfile, changePassword, upload };
