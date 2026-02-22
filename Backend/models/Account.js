const mongoose = require('mongoose');

const accountSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    googleId: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    picture: {
        type: String,
    },
    tokens: {
        accessToken: {
            type: String, // You might choose to encrypt this too if highly sensitive, but it expires quickly
        },
        // Refresh token is encrypted
        refreshToken: {
            iv: String,
            encryptedData: String
        },
        scope: String,
        tokenType: String,
        expiryDate: Number
    }
}, {
    timestamps: true,
});

// Calculate storage usage using a separate aggregation or store it here and update periodically.
// For now, we'll fetch real-time from API to avoid sync issues, but caching would be better for performance.
// We can add a 'lastSyncedStorage' field if needed later.

const Account = mongoose.model('Account', accountSchema);

module.exports = Account;
