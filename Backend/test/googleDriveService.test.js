// Regression test for the IDOR fix: getDriveClient must always scope the
// account lookup to the requesting user, never trust accountId alone.
require('./testEnv');

const { test, describe, mock, afterEach } = require('node:test');
const assert = require('node:assert/strict');

const { prisma } = require('../config/db');
const { encrypt } = require('../utils/encryption');
const { getDriveClient } = require('../services/googleDriveService');

// Prisma Client's model delegates (e.g. `prisma.account`) are Proxy-backed,
// so `Object.getOwnPropertyDescriptor` doesn't see `findFirst` as a real own
// method and `node:test`'s `mock.method` rejects it. Direct assignment goes
// through the Proxy's set/get traps fine, so we mock that way instead and
// restore the original afterwards.
describe('getDriveClient', () => {
    const originalFindFirst = prisma.account.findFirst;
    afterEach(() => {
        prisma.account.findFirst = originalFindFirst;
    });

    test('throws when no userId is provided (no insecure fallback)', async () => {
        await assert.rejects(
            () => getDriveClient('some-account-id'),
            /userId is required/
        );
    });

    test('scopes the lookup to both accountId AND the requesting userId', async () => {
        const findFirst = mock.fn(async () => null);
        prisma.account.findFirst = findFirst;

        await assert.rejects(
            () => getDriveClient('account-123', 'user-456'),
            /not found or not authorized/
        );

        assert.equal(findFirst.mock.calls.length, 1);
        const { where } = findFirst.mock.calls[0].arguments[0];
        assert.equal(where.id, 'account-123');
        assert.equal(where.userId, 'user-456');
    });

    test('does not return a client for an account owned by a different user', async () => {
        // Simulates the real query behaviour: findFirst with a mismatched
        // userId filter finds nothing.
        prisma.account.findFirst = mock.fn(async ({ where }) => {
            const account = { id: 'account-123', userId: 'owner-1' };
            return (where.userId === account.userId) ? account : null;
        });

        await assert.rejects(
            () => getDriveClient('account-123', 'attacker-2'),
            /not found or not authorized/
        );
    });

    test('succeeds when the account belongs to the requesting user', async () => {
        const encrypted = encrypt('fake-refresh-token');
        const fakeAccount = {
            id: 'account-123',
            userId: 'owner-1',
            refreshTokenIv: encrypted.iv,
            refreshTokenData: encrypted.encryptedData,
        };
        prisma.account.findFirst = mock.fn(async () => fakeAccount);

        const drive = await getDriveClient('account-123', 'owner-1');
        assert.ok(drive);
        assert.ok(drive.files);
    });
});
