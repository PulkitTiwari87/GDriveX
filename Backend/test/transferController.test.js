require('./testEnv');

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { validateTransferInput, classifyError } = require('../controllers/transferController');

describe('validateTransferInput', () => {
    const base = {
        sourceAccountId: 'acc1',
        targetAccountId: 'acc2',
        fileId: 'file1',
        action: 'copy',
    };

    test('accepts a valid copy request', () => {
        assert.equal(validateTransferInput(base), null);
    });

    test('accepts a valid move request', () => {
        assert.equal(validateTransferInput({ ...base, action: 'move' }), null);
    });

    test('rejects missing fields', () => {
        assert.match(validateTransferInput({ ...base, fileId: undefined }), /required/);
    });

    test('rejects an invalid action', () => {
        assert.match(validateTransferInput({ ...base, action: 'delete' }), /action must be/);
    });

    test('rejects source and target being the same account', () => {
        assert.match(
            validateTransferInput({ ...base, targetAccountId: base.sourceAccountId }),
            /must be different/
        );
    });
});

describe('classifyError', () => {
    test('maps 403 storage quota errors to a friendly message', () => {
        const err = { code: 403, message: 'storageQuota exceeded' };
        assert.match(classifyError(err), /storage quota exceeded/);
    });

    test('maps 403 non-quota errors to a permissions message', () => {
        const err = { code: 403, message: 'insufficient scope' };
        assert.match(classifyError(err), /insufficient permissions/);
    });

    test('maps 401 to a token-expired message', () => {
        assert.match(classifyError({ code: 401 }), /token expired/);
    });

    test('maps 404 to a file-not-found message', () => {
        assert.match(classifyError({ code: 404 }), /not found/);
    });

    test('maps network errors', () => {
        assert.match(classifyError({ message: 'ETIMEDOUT' }), /network error/);
    });

    test('falls back to the raw error message', () => {
        assert.match(classifyError({ message: 'something odd' }), /something odd/);
    });
});
