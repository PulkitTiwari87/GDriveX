const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const { protect } = require('./middleware/authMiddleware');
const authRoutes = require('./routes/authRoutes');
const driveRoutes = require('./routes/driveRoutes');

const app = express();


// CORS must be before helmet so preflight OPTIONS responses are not blocked
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
}));

// Security Middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow /uploads images to load from frontend
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Logging
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/drive', driveRoutes);
app.use('/uploads', express.static(require('path').join(__dirname, 'uploads')));

// Proxy for Google OAuth callback
// This matches the GENERIC_REDIRECT_URI in .env
// It receives the code from Google and redirects to the Frontend to handle it
app.get('/auth/google/callback', (req, res) => {
    const { code } = req.query;
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    if (code) {
        res.redirect(`${clientUrl}/auth/callback?code=${code}`);
    } else {
        res.redirect(`${clientUrl}/?error=no_code`);
    }
});

app.get('/', (req, res) => {
    res.send('API is running...');
});

module.exports = app;
