require('./testEnv');

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { encrypt, decrypt } = require('../utils/encryption');

describe('encryption utils', () => {
    test('encrypt then decrypt returns the original plaintext', () => {
        const plaintext = 'a-google-refresh-token-value';
        const encrypted = encrypt(plaintext);

        assert.ok(encrypted.iv);
        assert.ok(encrypted.encryptedData);
        assert.notEqual(encrypted.encryptedData, plaintext);

        assert.equal(decrypt(encrypted), plaintext);
    });

    test('encrypt uses a random IV so the same input yields different ciphertext', () => {
        const a = encrypt('same-value');
        const b = encrypt('same-value');
        assert.notEqual(a.iv, b.iv);
        assert.notEqual(a.encryptedData, b.encryptedData);
    });

    test('encrypt(null) returns null', () => {
        assert.equal(encrypt(null), null);
        assert.equal(encrypt(undefined), null);
        assert.equal(encrypt(''), null);
    });

    test('decrypt(null) returns null instead of throwing', () => {
        assert.equal(decrypt(null), null);
        assert.equal(decrypt({}), null);
    });
});
