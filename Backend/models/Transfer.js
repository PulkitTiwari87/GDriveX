const mongoose = require('mongoose');

const transferSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    sourceAccountId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account',
        required: true,
    },
    targetAccountId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account',
        required: true,
    },
    fileId: {
        type: String,
        required: true,
    },
    fileName: {
        type: String,
        required: true,
    },
    mimeType: {
        type: String,
    },
    action: {
        type: String,
        enum: ['copy', 'move'],
        required: true,
    },
    status: {
        type: String,
        enum: ['pending', 'in_progress', 'completed', 'failed'],
        default: 'pending',
    },
    errorMessage: {
        type: String,
        default: null,
    },
    fileSizeBytes: {
        type: Number,
        default: null,
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('Transfer', transferSchema);
