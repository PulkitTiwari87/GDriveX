const { validateTransferInput, classifyError } = require('../controllers/transferController');

describe('validateTransferInput', () => {
    const base = {
        sourceAccountId: 'acc-1',
        targetAccountId: 'acc-2',
        fileId: 'file-1',
        action: 'copy',
    };

    test('accepts a valid copy request', () => {
        expect(validateTransferInput(base)).toBeNull();
    });

    test('accepts a valid move request', () => {
        expect(validateTransferInput({ ...base, action: 'move' })).toBeNull();
    });

    test('rejects when a required field is missing', () => {
        expect(validateTransferInput({ ...base, fileId: undefined })).toMatch(/required/i);
        expect(validateTransferInput({ ...base, sourceAccountId: '' })).toMatch(/required/i);
    });

    test('rejects an invalid action', () => {
        expect(validateTransferInput({ ...base, action: 'delete' })).toMatch(/copy.*move/i);
    });

    test('rejects source and target being the same account', () => {
        expect(validateTransferInput({ ...base, targetAccountId: base.sourceAccountId }))
            .toMatch(/must be different/i);
    });
});

describe('classifyError', () => {
    test('maps a 403 storage quota error to a friendly quota message', () => {
        const err = { code: 403, message: 'storageQuotaExceeded' };
        expect(classifyError(err)).toMatch(/storage quota exceeded/i);
    });

    test('maps a generic 403 to a permissions message', () => {
        const err = { code: 403, message: 'insufficientPermissions' };
        expect(classifyError(err)).toMatch(/insufficient permissions/i);
    });

    test('maps a 401 to an expired-token message', () => {
        const err = { code: 401, message: 'invalid_grant' };
        expect(classifyError(err)).toMatch(/token expired/i);
    });

    test('maps a 404 to a not-found message', () => {
        const err = { code: 404, message: 'File not found' };
        expect(classifyError(err)).toMatch(/not found/i);
    });

    test('maps network errors to a network message', () => {
        expect(classifyError({ message: 'ECONNRESET' })).toMatch(/network error/i);
    });

    test('falls back to the raw error message for unknown errors', () => {
        expect(classifyError({ message: 'weird failure' })).toBe('Transfer failed: weird failure');
    });
});
