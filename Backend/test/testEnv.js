// Shared test env setup. Each test file runs in its own process (Node's
// test runner default), so this must be required at the top of every file
// before requiring any app module that reads these vars at load time.
process.env.ENCRYPTION_KEY = process.env.ENCRYPTION_KEY
    || '0000000000000000000000000000000000000000000000000000000000000000'.slice(0, 64);
process.env.GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'test-client-id';
process.env.GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || 'test-client-secret';
process.env.GENERIC_REDIRECT_URI = process.env.GENERIC_REDIRECT_URI || 'http://localhost/callback';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';
// Never actually connected to in unit tests (Prisma calls are mocked), but
// PrismaClient needs a syntactically valid URL to construct.
process.env.DATABASE_URL = process.env.DATABASE_URL
    || 'postgresql://test:test@127.0.0.1:5432/test?schema=public';
