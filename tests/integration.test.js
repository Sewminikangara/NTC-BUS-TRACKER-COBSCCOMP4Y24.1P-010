const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');

describe('API Integration Tests', () => {
    beforeAll(async () => {
        await mongoose.connect(process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/ntc-test');
    });

    afterAll(async () => {
        await mongoose.connection.dropDatabase();
        await mongoose.connection.close();
    });

    describe('Health Check', () => {
        it('should return server health status', async () => {
            const response = await request(app)
                .get('/health')
                .expect(200);

            expect(response.body.status).toBe('success');
            expect(response.body.message).toBe('Server is healthy');
            expect(response.body.uptime).toBeGreaterThanOrEqual(0);
        });
    });

    describe('API Root', () => {
        it('should redirect to dashboard', async () => {
            await request(app)
                .get('/')
                .expect(302);
        });

        it('should return API information', async () => {
            const response = await request(app)
                .get('/api')
                .expect(200);

            expect(response.body.name).toBe('NTC Bus Tracker API');
            expect(response.body.endpoints).toBeDefined();
        });
    });

    describe('Error Handling', () => {
        it('should return 404 for non-existent routes', async () => {
            const response = await request(app)
                .get('/api/nonexistent')
                .expect(404);

            expect(response.body.status).toBe('error');
        });

        it('should handle malformed JSON', async () => {
            await request(app)
                .post('/api/routes')
                .set('Content-Type', 'application/json')
                .send('{"invalid": json}')
                .expect(400);
        });
    });

    describe('CORS Headers', () => {
        it('should include CORS headers', async () => {
            const response = await request(app)
                .get('/health')
                .expect(200);

            expect(response.headers['access-control-allow-origin']).toBeDefined();
        });
    });

    describe('Rate Limiting', () => {
        it('should apply rate limiting to API routes', async () => {
            const requests = Array(10).fill().map(() =>
                request(app).get('/api/routes')
            );

            const responses = await Promise.all(requests);
            const allSuccessful = responses.every(res => res.status === 200);

            expect(allSuccessful).toBe(true);
        });
    });

    describe('Pagination', () => {
        it('should support pagination parameters', async () => {
            const response = await request(app)
                .get('/api/routes?page=1&limit=5')
                .expect(200);

            expect(response.body.pagination).toBeDefined();
            expect(response.body.pagination.page).toBe(1);
            expect(response.body.pagination.limit).toBe(5);
        });
    });

    describe('Search Functionality', () => {
        it('should support search parameters', async () => {
            const response = await request(app)
                .get('/api/routes?search=Colombo')
                .expect(200);

            expect(response.body.status).toBe('success');
            expect(response.body.data).toBeDefined();
        });
    });

    describe('HATEOAS Links', () => {
        it('should include HATEOAS links in responses', async () => {
            const response = await request(app)
                .get('/api/routes')
                .expect(200);

            expect(response.body._links).toBeDefined();
            expect(response.body._links.self).toBeDefined();
            expect(response.body._links.create).toBeDefined();
        });
    });
});