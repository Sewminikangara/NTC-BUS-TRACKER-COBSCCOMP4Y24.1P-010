const mongoose = require('mongoose');
const Route = require('../src/models/Route');
const Bus = require('../src/models/Bus');
const Trip = require('../src/models/Trip');
const User = require('../src/models/User');
const Operator = require('../src/models/Operator');

describe('Model Validations', () => {
    beforeAll(async () => {
        await mongoose.connect(process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/ntc-test');
    });

    afterAll(async () => {
        await mongoose.connection.dropDatabase();
        await mongoose.connection.close();
    });

    beforeEach(async () => {
        await Route.deleteMany({});
        await Bus.deleteMany({});
        await Trip.deleteMany({});
        await User.deleteMany({});
        await Operator.deleteMany({});
    });

    describe('Route Model', () => {
        it('should create route with valid data', async () => {
            const routeData = {
                routeNumber: '001',
                name: 'Colombo - Kandy',
                origin: 'Colombo',
                destination: 'Kandy',
                distance: 115,
                estimatedDuration: 180,
                fare: 350,
            };

            const route = await Route.create(routeData);
            expect(route.routeNumber).toBe('001');
            expect(route.name).toBe('Colombo - Kandy');
        });

        it('should require mandatory fields', async () => {
            const invalidRoute = new Route({});

            let error;
            try {
                await invalidRoute.save();
            } catch (err) {
                error = err;
            }

            expect(error).toBeDefined();
            expect(error.errors.routeNumber).toBeDefined();
            expect(error.errors.name).toBeDefined();
            expect(error.errors.origin).toBeDefined();
            expect(error.errors.destination).toBeDefined();
        });

        it('should enforce unique route numbers', async () => {
            await Route.create({
                routeNumber: '002',
                name: 'Route 1',
                origin: 'Colombo',
                destination: 'Kandy',
                distance: 115,
                estimatedDuration: 180,
                fare: 350,
            });

            let error;
            try {
                await Route.create({
                    routeNumber: '002',
                    name: 'Route 2',
                    origin: 'Galle',
                    destination: 'Matara',
                    distance: 50,
                    estimatedDuration: 60,
                    fare: 150,
                });
            } catch (err) {
                error = err;
            }

            expect(error).toBeDefined();
            expect(error.code).toBe(11000);
        });
    });

    describe('Bus Model', () => {
        let operatorId;

        beforeEach(async () => {
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

        it('should create bus with valid data', async () => {
            const busData = {
                registrationNumber: 'WP-1234',
                model: 'Ashok Leyland',
                capacity: 45,
                operator: operatorId,
                status: 'active',
            };

            const bus = await Bus.create(busData);
            expect(bus.registrationNumber).toBe('WP-1234');
            expect(bus.capacity).toBe(45);
        });

        it('should require mandatory fields', async () => {
            const invalidBus = new Bus({});

            let error;
            try {
                await invalidBus.save();
            } catch (err) {
                error = err;
            }

            expect(error).toBeDefined();
            expect(error.errors.registrationNumber).toBeDefined();
            expect(error.errors.operator).toBeDefined();
        });

        it('should enforce unique registration numbers', async () => {
            await Bus.create({
                registrationNumber: 'WP-UNIQUE',
                model: 'Ashok Leyland',
                capacity: 45,
                operator: operatorId,
                status: 'active',
            });

            let error;
            try {
                await Bus.create({
                    registrationNumber: 'WP-UNIQUE',
                    model: 'Tata',
                    capacity: 50,
                    operator: operatorId,
                    status: 'active',
                });
            } catch (err) {
                error = err;
            }

            expect(error).toBeDefined();
            expect(error.code).toBe(11000);
        });
    });

    describe('User Model', () => {
        it('should create user with valid data', async () => {
            const userData = {
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123',
                role: 'operator',
            };

            const user = await User.create(userData);
            expect(user.username).toBe('testuser');
            expect(user.email).toBe('test@example.com');
            expect(user.password).not.toBe('password123');
        });

        it('should hash password before saving', async () => {
            const userData = {
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123',
                role: 'operator',
            };

            const user = await User.create(userData);
            expect(user.password).not.toBe('password123');
            expect(user.password.length).toBeGreaterThan(10);
        });

        it('should validate email format', async () => {
            const userData = {
                username: 'testuser',
                email: 'invalid-email',
                password: 'password123',
                role: 'operator',
            };

            let error;
            try {
                await User.create(userData);
            } catch (err) {
                error = err;
            }

            expect(error).toBeDefined();
            expect(error.errors.email).toBeDefined();
        });
    });

    describe('Trip Model', () => {
        let routeId;
        let busId;

        beforeEach(async () => {
            const operator = await Operator.create({
                name: 'Test Transport',
                registrationNumber: 'TEST001',
                contactInfo: {
                    phone: '+94712345678',
                    email: 'test@transport.com',
                },
            });

            const route = await Route.create({
                routeNumber: '001',
                name: 'Test Route',
                origin: 'Colombo',
                destination: 'Kandy',
                distance: 115,
                estimatedDuration: 180,
                fare: 350,
            });

            const bus = await Bus.create({
                registrationNumber: 'WP-TEST',
                model: 'Ashok Leyland',
                capacity: 45,
                operator: operator._id,
                status: 'active',
            });

            routeId = route._id;
            busId = bus._id;
        });

        it('should create trip with valid data', async () => {
            const tripData = {
                route: routeId,
                bus: busId,
                departureTime: new Date(),
                arrivalTime: new Date(Date.now() + 3 * 60 * 60 * 1000),
                status: 'scheduled',
            };

            const trip = await Trip.create(tripData);
            expect(trip.route).toEqual(routeId);
            expect(trip.bus).toEqual(busId);
            expect(trip.status).toBe('scheduled');
        });

        it('should require mandatory fields', async () => {
            const invalidTrip = new Trip({});

            let error;
            try {
                await invalidTrip.save();
            } catch (err) {
                error = err;
            }

            expect(error).toBeDefined();
            expect(error.errors.route).toBeDefined();
            expect(error.errors.bus).toBeDefined();
            expect(error.errors.departureTime).toBeDefined();
        });
    });
});