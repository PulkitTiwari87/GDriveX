const request = require('supertest');
const app = require('../app');

describe('app', () => {
    test('GET / returns a 200 health message', async () => {
        const res = await request(app).get('/');
        expect(res.status).toBe(200);
        expect(res.text).toMatch(/API is running/i);
    });

    test('unknown /api route returns a clean 404 JSON body', async () => {
        const res = await request(app).get('/api/does-not-exist');
        expect(res.status).toBe(404);
        expect(res.body).toEqual({ message: 'Not found' });
    });

    test('protected drive route without a token is rejected with 401', async () => {
        const res = await request(app).get('/api/drive/accounts');
        expect(res.status).toBe(401);
    });

    test('/auth/google/callback redirects to the client with the code', async () => {
        const res = await request(app).get('/auth/google/callback?code=abc123');
        expect(res.status).toBe(302);
        expect(res.headers.location).toContain('/auth/callback?code=abc123');
    });
});
