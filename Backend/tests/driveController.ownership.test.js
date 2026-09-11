// Regression test for the IDOR fix: any accountId-based Drive operation must
// verify the account belongs to the requesting user before it is used.
jest.mock('../models/Account', () => ({
    exists: jest.fn(),
}));

const Account = require('../models/Account');
const { assertAccountOwnership } = require('../controllers/driveController');

describe('assertAccountOwnership', () => {
    beforeEach(() => {
        Account.exists.mockReset();
    });

    test('returns true when the account belongs to the user', async () => {
        Account.exists.mockResolvedValue({ _id: 'acc-1' });
        const result = await assertAccountOwnership('acc-1', 'user-1');
        expect(result).toBe(true);
        expect(Account.exists).toHaveBeenCalledWith({ _id: 'acc-1', user: 'user-1' });
    });

    test('returns false when no matching account is owned by the user', async () => {
        Account.exists.mockResolvedValue(null);
        const result = await assertAccountOwnership('someone-elses-account', 'user-1');
        expect(result).toBe(false);
    });
});
