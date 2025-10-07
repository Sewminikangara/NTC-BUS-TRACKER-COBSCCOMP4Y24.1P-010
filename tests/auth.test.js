const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/User');

describe('Authentication API', () => {
    beforeAll(async () => {
        await mongoose.connect(process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/ntc-test');
    });

    afterAll(async () => {
        await mongoose.connection.dropDatabase();
        await mongoose.connection.close();
    });

    beforeEach(async () => {
        await User.deleteMany({});
    });

    describe('POST /api/auth/register', () => {
        it('should register a new user with valid data', async () => {
            const userData = {
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123',
                role: 'operator',
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(userData)
                .expect(201);

            expect(response.body.status).toBe('success');
            expect(response.body.data.user.email).toBe('test@example.com');
            expect(response.body.token).toBeDefined();
        });

        it('should return validation error for invalid email', async () => {
            const userData = {
                username: 'testuser',
                email: 'invalid-email',
                password: 'password123',
                role: 'operator',
            };

            await request(app)
                .post('/api/auth/register')
                .send(userData)
                .expect(400);
        });

        it('should return error for duplicate email', async () => {
            await User.create({
                username: 'existing',
                email: 'existing@example.com',
                password: 'password123',
                role: 'operator',
            });

            const userData = {
                username: 'testuser',
                email: 'existing@example.com',
                password: 'password123',
                role: 'operator',
            };

            await request(app)
                .post('/api/auth/register')
                .send(userData)
                .expect(400);
        });
    });

    describe('POST /api/auth/login', () => {
        beforeEach(async () => {
            await User.create({
                username: 'loginuser',
                email: 'login@example.com',
                password: 'password123',
                role: 'operator',
            });
        });

        it('should login with valid credentials', async () => {
            const loginData = {
                email: 'login@example.com',
                password: 'password123',
            };

            const response = await request(app)
                .post('/api/auth/login')
                .send(loginData)
                .expect(200);

            expect(response.body.status).toBe('success');
            expect(response.body.token).toBeDefined();
        });

        it('should return error for invalid email', async () => {
            const loginData = {
                email: 'nonexistent@example.com',
                password: 'password123',
            };

            await request(app)
                .post('/api/auth/login')
                .send(loginData)
                .expect(401);
        });

        it('should return error for invalid password', async () => {
            const loginData = {
                email: 'login@example.com',
                password: 'wrongpassword',
            };

            await request(app)
                .post('/api/auth/login')
                .send(loginData)
                .expect(401);
        });
    });

    describe('GET /api/auth/me', () => {
        let authToken;

        beforeEach(async () => {
            await User.create({
                username: 'authuser',
                email: 'auth@example.com',
                password: 'password123',
                role: 'admin',
            });

            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'auth@example.com',
                    password: 'password123',
                });

            authToken = response.body.token;
        });

        it('should return user profile with valid token', async () => {
            const response = await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.status).toBe('success');
            expect(response.body.data.email).toBe('auth@example.com');
        });

        it('should return error without token', async () => {
            await request(app)
                .get('/api/auth/me')
                .expect(401);
        });

        it('should return error with invalid token', async () => {
            await request(app)
                .get('/api/auth/me')
                .set('Authorization', 'Bearer invalid-token')
                .expect(401);
        });
    });
});