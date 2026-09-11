const { encrypt, decrypt } = require('../utils/encryption');

describe('encryption utils', () => {
    test('encrypt then decrypt returns the original plaintext', () => {
        const plaintext = 'a-google-oauth-refresh-token-value';
        const encrypted = encrypt(plaintext);

        expect(encrypted).toHaveProperty('iv');
        expect(encrypted).toHaveProperty('encryptedData');
        expect(encrypted.encryptedData).not.toBe(plaintext);

        expect(decrypt(encrypted)).toBe(plaintext);
    });

    test('each encryption uses a fresh random IV (ciphertext is not deterministic)', () => {
        const a = encrypt('same-input');
        const b = encrypt('same-input');
        expect(a.iv).not.toBe(b.iv);
        expect(a.encryptedData).not.toBe(b.encryptedData);
    });

    test('encrypt(null-ish) returns null instead of throwing', () => {
        expect(encrypt(null)).toBeNull();
        expect(encrypt(undefined)).toBeNull();
        expect(encrypt('')).toBeNull();
    });

    test('decrypt of malformed input returns null instead of throwing', () => {
        expect(decrypt(null)).toBeNull();
        expect(decrypt({})).toBeNull();
        expect(decrypt({ iv: 'only-iv' })).toBeNull();
    });
});
