const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const Route = require('../src/models/Route');
const Bus = require('../src/models/Bus');
const Trip = require('../src/models/Trip');
const Operator = require('../src/models/Operator');
const User = require('../src/models/User');

describe('Routes API', () => {
    let authToken;
    let routeId;

    beforeAll(async () => {
        await mongoose.connect(process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/ntc-test');

        const user = await User.create({
            username: 'testuser',
            email: 'test@example.com',
            password: 'password123',
            role: 'admin'
        });

        const response = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'test@example.com',
                password: 'password123'
            });

        authToken = response.body.token;
    });

    afterAll(async () => {
        await mongoose.connection.dropDatabase();
        await mongoose.connection.close();
    });

    beforeEach(async () => {
        await Route.deleteMany({});
        await Bus.deleteMany({});
        await Trip.deleteMany({});
        await Operator.deleteMany({});
    });

    describe('GET /api/routes', () => {
        it('should return empty array when no routes exist', async () => {
            const response = await request(app)
                .get('/api/routes')
                .expect(200);

            expect(response.body.status).toBe('success');
            expect(response.body.results).toBe(0);
            expect(response.body.data).toEqual([]);
        });

        it('should return all routes when they exist', async () => {
            const route = await Route.create({
                routeNumber: '001',
                name: 'Test Route',
                origin: 'Colombo',
                destination: 'Kandy',
                distance: 115,
                estimatedDuration: 180,
                fare: 350,
                stops: [{
                    name: 'Colombo Fort',
                    coordinates: { lat: 6.9344, lng: 79.8428 },
                    order: 1
                }]
            });

            const response = await request(app)
                .get('/api/routes')
                .expect(200);

            expect(response.body.status).toBe('success');
            expect(response.body.results).toBe(1);
            expect(response.body.data[0].routeNumber).toBe('001');
        });
    });

    describe('POST /api/routes', () => {
        it('should create a new route with valid data', async () => {
            const routeData = {
                routeNumber: '002',
                name: 'Colombo - Galle',
                origin: 'Colombo',
                destination: 'Galle',
                distance: 119,
                estimatedDuration: 150,
                fare: 320,
                stops: [{
                    name: 'Colombo Fort',
                    coordinates: { lat: 6.9344, lng: 79.8428 },
                    order: 1
                }]
            };

            const response = await request(app)
                .post('/api/routes')
                .set('Authorization', `Bearer ${authToken}`)
                .send(routeData)
                .expect(201);

            expect(response.body.status).toBe('success');
            expect(response.body.data.routeNumber).toBe('002');
            routeId = response.body.data.id;
        });

        it('should return validation error for invalid data', async () => {
            const invalidData = {
                routeNumber: '',
                name: '',
                origin: '',
                destination: ''
            };

            const response = await request(app)
                .post('/api/routes')
                .set('Authorization', `Bearer ${authToken}`)
                .send(invalidData)
                .expect(400);

            expect(response.body.status).toBe('error');
        });

        it('should require authentication', async () => {
            const routeData = {
                routeNumber: '003',
                name: 'Test Route',
                origin: 'Colombo',
                destination: 'Kandy'
            };

            await request(app)
                .post('/api/routes')
                .send(routeData)
                .expect(401);
        });
    });

    describe('GET /api/routes/:id', () => {
        it('should return specific route by ID', async () => {
            const route = await Route.create({
                routeNumber: '004',
                name: 'Test Route',
                origin: 'Colombo',
                destination: 'Kandy',
                distance: 115,
                estimatedDuration: 180,
                fare: 350
            });

            const response = await request(app)
                .get(`/api/routes/${route._id}`)
                .expect(200);

            expect(response.body.status).toBe('success');
            expect(response.body.data.routeNumber).toBe('004');
        });

        it('should return 404 for non-existent route', async () => {
            const fakeId = new mongoose.Types.ObjectId();

            await request(app)
                .get(`/api/routes/${fakeId}`)
                .expect(404);
        });
    });

    describe('PUT /api/routes/:id', () => {
        it('should update existing route', async () => {
            const route = await Route.create({
                routeNumber: '005',
                name: 'Original Route',
                origin: 'Colombo',
                destination: 'Kandy',
                distance: 115,
                estimatedDuration: 180,
                fare: 350
            });

            const updateData = {
                name: 'Updated Route',
                fare: 400
            };

            const response = await request(app)
                .put(`/api/routes/${route._id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(200);

            expect(response.body.status).toBe('success');
            expect(response.body.data.name).toBe('Updated Route');
            expect(response.body.data.fare).toBe(400);
        });
    });

    describe('DELETE /api/routes/:id', () => {
        it('should delete existing route', async () => {
            const route = await Route.create({
                routeNumber: '006',
                name: 'Route to Delete',
                origin: 'Colombo',
                destination: 'Kandy',
                distance: 115,
                estimatedDuration: 180,
                fare: 350
            });

            await request(app)
                .delete(`/api/routes/${route._id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(204);

            const deletedRoute = await Route.findById(route._id);
            expect(deletedRoute).toBeNull();
        });
    });
});