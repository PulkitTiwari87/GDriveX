const crypto = require('crypto');

const algorithm = 'aes-256-cbc';
// Key must be 32 bytes (256 bits).
// We expect the ENCRYPTION_KEY env var to be a hex string representing 32 bytes.
const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');

// Check if key is valid length
if (key.length !== 32) {
    console.error("FATAL ERROR: ENCRYPTION_KEY must be a 32-byte hex string.");
    process.exit(1);
}

const encrypt = (text) => {
    if (!text) return null;
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return { iv: iv.toString('hex'), encryptedData: encrypted.toString('hex') };
};

const decrypt = (text) => {
    if (!text || !text.iv || !text.encryptedData) return null;
    const iv = Buffer.from(text.iv, 'hex');
    const encryptedText = Buffer.from(text.encryptedData, 'hex');
    const decipher = crypto.createDecipheriv(algorithm, Buffer.from(key), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
};

module.exports = { encrypt, decrypt };
