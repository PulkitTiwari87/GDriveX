// Deterministic, non-secret env vars for the test process only.
// These are never real credentials and must never be used outside tests.
process.env.NODE_ENV = 'test';
process.env.ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '0'.repeat(64); // 32-byte hex
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';
process.env.JWT_EXPIRE = process.env.JWT_EXPIRE || '1h';
process.env.CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
