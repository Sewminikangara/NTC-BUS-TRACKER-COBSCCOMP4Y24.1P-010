const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const Bus = require('../src/models/Bus');
const Operator = require('../src/models/Operator');
const User = require('../src/models/User');

describe('Buses API', () => {
    let authToken;
    let operatorId;

    beforeAll(async () => {
        await mongoose.connect(process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/ntc-test');

        await User.create({
            username: 'testuser',
            email: 'test@example.com',
            password: 'password123',
            role: 'admin',
        });

        const response = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'test@example.com',
                password: 'password123',
            });

        authToken = response.body.token;

        const operator = await Operator.create({
            name: 'Test Transport',
            registrationNumber: 'TEST001',
            contactInfo: {
                phone: '+94712345678',
                email: 'test@transport.com',
            },
        });

        operatorId = operator._id;
    });

    afterAll(async () => {
        await mongoose.connection.dropDatabase();
        await mongoose.connection.close();
    });

    beforeEach(async () => {
        await Bus.deleteMany({});
    });

    describe('GET /api/buses', () => {
        it('should return empty array when no buses exist', async () => {
            const response = await request(app)
                .get('/api/buses')
                .expect(200);

            expect(response.body.status).toBe('success');
            expect(response.body.results).toBe(0);
            expect(response.body.data).toEqual([]);
        });

        it('should return all buses when they exist', async () => {
            await Bus.create({
                registrationNumber: 'WP-1234',
                model: 'Ashok Leyland',
                capacity: 45,
                operator: operatorId,
                status: 'active',
            });

            const response = await request(app)
                .get('/api/buses')
                .expect(200);

            expect(response.body.status).toBe('success');
            expect(response.body.results).toBe(1);
            expect(response.body.data[0].registrationNumber).toBe('WP-1234');
        });
    });

    describe('POST /api/buses', () => {
        it('should create a new bus with valid data', async () => {
            const busData = {
                registrationNumber: 'WP-5678',
                model: 'Tata',
                capacity: 50,
                operator: operatorId,
                status: 'active',
            };

            const response = await request(app)
                .post('/api/buses')
                .set('Authorization', `Bearer ${authToken}`)
                .send(busData)
                .expect(201);

            expect(response.body.status).toBe('success');
            expect(response.body.data.registrationNumber).toBe('WP-5678');
        });

        it('should return validation error for duplicate registration number', async () => {
            await Bus.create({
                registrationNumber: 'WP-9999',
                model: 'Ashok Leyland',
                capacity: 45,
                operator: operatorId,
                status: 'active',
            });

            const duplicateData = {
                registrationNumber: 'WP-9999',
                model: 'Tata',
                capacity: 50,
                operator: operatorId,
                status: 'active',
            };

            await request(app)
                .post('/api/buses')
                .set('Authorization', `Bearer ${authToken}`)
                .send(duplicateData)
                .expect(400);
        });
    });

    describe('GET /api/buses/:id', () => {
        it('should return specific bus by ID', async () => {
            const bus = await Bus.create({
                registrationNumber: 'WP-7777',
                model: 'Ashok Leyland',
                capacity: 45,
                operator: operatorId,
                status: 'active',
            });

            const response = await request(app)
                .get(`/api/buses/${bus._id}`)
                .expect(200);

            expect(response.body.status).toBe('success');
            expect(response.body.data.registrationNumber).toBe('WP-7777');
        });
    });

    describe('PUT /api/buses/:id', () => {
        it('should update existing bus', async () => {
            const bus = await Bus.create({
                registrationNumber: 'WP-8888',
                model: 'Old Model',
                capacity: 40,
                operator: operatorId,
                status: 'active',
            });

            const updateData = {
                model: 'New Model',
                capacity: 50,
            };

            const response = await request(app)
                .put(`/api/buses/${bus._id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(200);

            expect(response.body.status).toBe('success');
            expect(response.body.data.model).toBe('New Model');
            expect(response.body.data.capacity).toBe(50);
        });
    });

    describe('DELETE /api/buses/:id', () => {
        it('should delete existing bus', async () => {
            const bus = await Bus.create({
                registrationNumber: 'WP-DELETE',
                model: 'Ashok Leyland',
                capacity: 45,
                operator: operatorId,
                status: 'active',
            });

            await request(app)
                .delete(`/api/buses/${bus._id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(204);

            const deletedBus = await Bus.findById(bus._id);
            expect(deletedBus).toBeNull();
        });
    });
});