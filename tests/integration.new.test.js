const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const Route = require('../src/models/Route');
const Bus = require('../src/models/Bus');
const Trip = require('../src/models/Trip');
const Operator = require('../src/models/Operator');
const User = require('../src/models/User');

describe('Integration Tests', () => {
    let authToken;
    let operatorId;
    let routeId;
    let busId;

    beforeAll(async () => {
        await mongoose.connect(process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/ntc-test');
    });

    afterAll(async () => {
        await mongoose.connection.dropDatabase();
        await mongoose.connection.close();
    });

    beforeEach(async () => {
        await User.deleteMany({});
        await Route.deleteMany({});
        await Bus.deleteMany({});
        await Trip.deleteMany({});
        await Operator.deleteMany({});

        await User.create({
            username: 'admin',
            email: 'admin@ntc.lk',
            password: 'admin123',
            role: 'admin',
        });

        const loginResponse = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'admin@ntc.lk',
                password: 'admin123',
            });

        authToken = loginResponse.body.token;

        const operator = await Operator.create({
            name: 'National Transport Commission',
            registrationNumber: 'NTC001',
            contactInfo: {
                phone: '+94112345678',
                email: 'info@ntc.lk',
            },
        });

        operatorId = operator._id;
    });

    describe('Complete Workflow Integration', () => {
        it('should create route, bus, and trip in sequence', async () => {
            const routeData = {
                routeNumber: '001',
                name: 'Colombo - Kandy Express',
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
            };

            const routeResponse = await request(app)
                .post('/api/routes')
                .set('Authorization', `Bearer ${authToken}`)
                .send(routeData)
                .expect(201);

            routeId = routeResponse.body.data.id;

            const busData = {
                registrationNumber: 'WP-1234',
                model: 'Ashok Leyland',
                capacity: 45,
                operator: operatorId,
                status: 'active'
            };

            const busResponse = await request(app)
                .post('/api/buses')
                .set('Authorization', `Bearer ${authToken}`)
                .send(busData)
                .expect(201);

            busId = busResponse.body.data.id;

            const tripData = {
                route: routeId,
                bus: busId,
                departureTime: '2025-10-08T08:00:00Z',
                arrivalTime: '2025-10-08T11:00:00Z',
                status: 'scheduled'
            };

            const tripResponse = await request(app)
                .post('/api/trips')
                .set('Authorization', `Bearer ${authToken}`)
                .send(tripData)
                .expect(201);

            expect(tripResponse.body.data.route).toBe(routeId);
            expect(tripResponse.body.data.bus).toBe(busId);
        });

        it('should handle search and filtering across endpoints', async () => {
            const route1 = await Route.create({
                routeNumber: '001',
                name: 'Colombo - Kandy',
                origin: 'Colombo',
                destination: 'Kandy',
                distance: 115,
                estimatedDuration: 180,
                fare: 350
            });

            const route2 = await Route.create({
                routeNumber: '002',
                name: 'Colombo - Galle',
                origin: 'Colombo',
                destination: 'Galle',
                distance: 119,
                estimatedDuration: 150,
                fare: 320
            });

            const searchResponse = await request(app)
                .get('/api/routes?search=Colombo')
                .expect(200);

            expect(searchResponse.body.results).toBe(2);
            expect(searchResponse.body.data).toHaveLength(2);

            const filterResponse = await request(app)
                .get('/api/routes?destination=Kandy')
                .expect(200);

            expect(filterResponse.body.results).toBe(1);
            expect(filterResponse.body.data[0].destination).toBe('Kandy');
        });

        it('should handle pagination correctly', async () => {
            for (let i = 1; i <= 15; i++) {
                await Route.create({
                    routeNumber: String(i).padStart(3, '0'),
                    name: `Route ${i}`,
                    origin: 'Colombo',
                    destination: `Destination ${i}`,
                    distance: 100 + i,
                    estimatedDuration: 120 + i,
                    fare: 300 + i
                });
            }

            const page1Response = await request(app)
                .get('/api/routes?page=1&limit=5')
                .expect(200);

            expect(page1Response.body.results).toBe(15);
            expect(page1Response.body.data).toHaveLength(5);
            expect(page1Response.body.pagination.page).toBe(1);
            expect(page1Response.body.pagination.totalPages).toBe(3);

            const page2Response = await request(app)
                .get('/api/routes?page=2&limit=5')
                .expect(200);

            expect(page2Response.body.data).toHaveLength(5);
            expect(page2Response.body.pagination.page).toBe(2);
        });

        it('should handle HATEOAS links correctly', async () => {
            const route = await Route.create({
                routeNumber: '001',
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

            expect(response.body._links).toBeDefined();
            expect(response.body._links.self).toBeDefined();
            expect(response.body._links.update).toBeDefined();
            expect(response.body._links.delete).toBeDefined();
        });
    });

    describe('Error Handling Integration', () => {
        it('should handle 404 errors consistently', async () => {
            const fakeId = new mongoose.Types.ObjectId();

            await request(app)
                .get(`/api/routes/${fakeId}`)
                .expect(404);

            await request(app)
                .get(`/api/buses/${fakeId}`)
                .expect(404);

            await request(app)
                .get(`/api/trips/${fakeId}`)
                .expect(404);
        });

        it('should handle validation errors consistently', async () => {
            const invalidRoute = {
                routeNumber: '',
                name: '',
                origin: '',
                destination: ''
            };

            const routeResponse = await request(app)
                .post('/api/routes')
                .set('Authorization', `Bearer ${authToken}`)
                .send(invalidRoute)
                .expect(400);

            expect(routeResponse.body.status).toBe('error');
            expect(routeResponse.body.message).toContain('validation');

            const invalidBus = {
                registrationNumber: '',
                model: '',
                capacity: 'invalid'
            };

            const busResponse = await request(app)
                .post('/api/buses')
                .set('Authorization', `Bearer ${authToken}`)
                .send(invalidBus)
                .expect(400);

            expect(busResponse.body.status).toBe('error');
        });

        it('should handle authentication consistently', async () => {
            await request(app)
                .post('/api/routes')
                .send({ routeNumber: '001', name: 'Test' })
                .expect(401);

            await request(app)
                .post('/api/buses')
                .send({ registrationNumber: 'WP-1234' })
                .expect(401);

            await request(app)
                .post('/api/trips')
                .send({ route: 'fake', bus: 'fake' })
                .expect(401);
        });
    });

    describe('Performance Integration', () => {
        it('should handle concurrent requests', async () => {
            const promises = [];

            for (let i = 0; i < 10; i++) {
                promises.push(
                    request(app)
                        .get('/api/routes')
                        .expect(200)
                );
            }

            const responses = await Promise.all(promises);
            responses.forEach(response => {
                expect(response.body.status).toBe('success');
            });
        });

        it('should handle large datasets efficiently', async () => {
            const routes = [];
            for (let i = 1; i <= 50; i++) {
                routes.push({
                    routeNumber: String(i).padStart(3, '0'),
                    name: `Route ${i}`,
                    origin: 'Colombo',
                    destination: `Destination ${i}`,
                    distance: 100 + i,
                    estimatedDuration: 120 + i,
                    fare: 300 + i
                });
            }

            await Route.insertMany(routes);

            const startTime = Date.now();
            const response = await request(app)
                .get('/api/routes?limit=50')
                .expect(200);
            const endTime = Date.now();

            expect(response.body.results).toBe(50);
            expect(endTime - startTime).toBeLessThan(1000);
        });
    });
});