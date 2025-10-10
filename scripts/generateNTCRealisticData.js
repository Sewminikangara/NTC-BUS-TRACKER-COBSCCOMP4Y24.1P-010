/**
 * Enhanced NTC Realistic Simulation Data Generator
 * Based on official NTC (National Transport Commission) data from ntc.gov.lk
 * 
 * @module scripts/generateNTCRealisticData
 */

require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');

// Import models
const Route = require('../src/models/Route');
const Bus = require('../src/models/Bus');
const Trip = require('../src/models/Trip');
const Operator = require('../src/models/Operator');
const LocationUpdate = require('../src/models/LocationUpdate');

// Connect to MongoDB
const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI || process.env.MONGODB_URL;
        if (!mongoUri) {
            throw new Error('MongoDB connection string not found. Please set MONGODB_URI or MONGODB_URL environment variable.');
        }
        await mongoose.connect(mongoUri);
        console.log(' MongoDB Connected');
    } catch (error) {
        console.error(' MongoDB Connection Error:', error);
        process.exit(1);
    }
};

const ntcServiceTypes = {
    normal: {
        name: 'Normal Service',
        baseFarePerKm: 3.50,
        features: [], // Basic service - no special features
        capacity: 60,
    },
    semiLuxury: {
        name: 'Semi-Luxury Service',
        baseFarePerKm: 4.20,
        features: ['USB Charging'],
        capacity: 52,
    },
    luxury: {
        name: 'Luxury Service',
        baseFarePerKm: 5.80,
        features: ['AC', 'Reclining Seats', 'USB Charging', 'WiFi'],
        capacity: 45,
    },
    superLuxury: {
        name: 'Super Luxury Service',
        baseFarePerKm: 7.50,
        features: ['AC', 'Reclining Seats', 'WiFi', 'USB Charging', 'Rest Room'],
        capacity: 35,
    },
    expresswayLuxury: {
        name: 'Expressway Luxury',
        baseFarePerKm: 8.20,
        features: ['AC', 'Reclining Seats', 'WiFi', 'USB Charging'],
        capacity: 40,
    },
    sisuSeriya: {
        name: 'Sisu Seriya (Student Service)',
        baseFarePerKm: 2.80,
        features: [], // Basic student service
        capacity: 60,
    },
};

/**
 * Real NTC Inter-Provincial Routes with authentic data
 */
const ntcRoutesData = [
    {
        routeNumber: 'NTC-001',
        name: 'Colombo - Kandy (A1 Highway)',
        origin: 'Colombo',
        destination: 'Kandy',
        distance: 115,
        estimatedDuration: 180, // 3 hours
        serviceTypes: ['normal', 'semiLuxury', 'luxury'],
        expressway: false,
        status: 'active',
        stops: [
            { name: 'Colombo Fort Bus Stand', order: 1, coordinates: { lat: 6.9344, lng: 79.8428 } },
            { name: 'Peliyagoda', order: 2, coordinates: { lat: 6.9679, lng: 79.8890 } },
            { name: 'Kadawatha', order: 3, coordinates: { lat: 7.0008, lng: 79.9520 } },
            { name: 'Gampaha', order: 4, coordinates: { lat: 7.0916, lng: 79.9999 } },
            { name: 'Veyangoda', order: 5, coordinates: { lat: 7.1558, lng: 80.0789 } },
            { name: 'Pasyala', order: 6, coordinates: { lat: 7.1655, lng: 80.1189 } },
            { name: 'Ambepussa', order: 7, coordinates: { lat: 7.2641, lng: 80.1989 } },
            { name: 'Kegalle', order: 8, coordinates: { lat: 7.2523, lng: 80.3436 } },
            { name: 'Mawanella', order: 9, coordinates: { lat: 7.2531, lng: 80.4467 } },
            { name: 'Kadugannawa', order: 10, coordinates: { lat: 7.2550, lng: 80.5208 } },
            { name: 'Peradeniya', order: 11, coordinates: { lat: 7.2650, lng: 80.5975 } },
            { name: 'Kandy Bus Stand', order: 12, coordinates: { lat: 7.2906, lng: 80.6337 } },
        ],
    },
    {
        routeNumber: 'NTC-002',
        name: 'Colombo - Galle (A2 Coastal Road)',
        origin: 'Colombo',
        destination: 'Galle',
        distance: 119,
        estimatedDuration: 150, // 2.5 hours
        serviceTypes: ['normal', 'semiLuxury', 'luxury'],
        expressway: false,
        status: 'active',
        stops: [
            { name: 'Colombo Fort Bus Stand', order: 1, coordinates: { lat: 6.9344, lng: 79.8428 } },
            { name: 'Bambalapitiya', order: 2, coordinates: { lat: 6.8851, lng: 79.8564 } },
            { name: 'Mount Lavinia', order: 3, coordinates: { lat: 6.8365, lng: 79.8630 } },
            { name: 'Dehiwala', order: 4, coordinates: { lat: 6.8179, lng: 79.8728 } },
            { name: 'Moratuwa', order: 5, coordinates: { lat: 6.7727, lng: 79.8816 } },
            { name: 'Panadura', order: 6, coordinates: { lat: 6.7133, lng: 79.9026 } },
            { name: 'Kalutara', order: 7, coordinates: { lat: 6.5831, lng: 79.9607 } },
            { name: 'Aluthgama', order: 8, coordinates: { lat: 6.4255, lng: 79.9989 } },
            { name: 'Bentota', order: 9, coordinates: { lat: 6.4256, lng: 79.9989 } },
            { name: 'Hikkaduwa', order: 10, coordinates: { lat: 6.1408, lng: 80.1025 } },
            { name: 'Galle Bus Stand', order: 11, coordinates: { lat: 6.0535, lng: 80.2210 } },
        ],
    },
    {
        routeNumber: 'EXP-001',
        name: 'Colombo - Galle (Southern Expressway)',
        origin: 'Colombo',
        destination: 'Galle',
        distance: 95,
        estimatedDuration: 90, // 1.5 hours
        serviceTypes: ['luxury', 'superLuxury', 'expresswayLuxury'],
        expressway: true,
        status: 'active',
        stops: [
            { name: 'Colombo Fort', order: 1, coordinates: { lat: 6.9344, lng: 79.8428 } },
            { name: 'Kottawa Interchange', order: 2, coordinates: { lat: 6.8087, lng: 79.9736 } },
            { name: 'Kahathuduwa Interchange', order: 3, coordinates: { lat: 6.7047, lng: 80.0394 } },
            { name: 'Gelanigama Interchange', order: 4, coordinates: { lat: 6.4622, lng: 80.0906 } },
            { name: 'Welipenna Interchange', order: 5, coordinates: { lat: 6.2653, lng: 80.1575 } },
            { name: 'Pinnaduwa Interchange', order: 6, coordinates: { lat: 6.1247, lng: 80.1981 } },
            { name: 'Galle', order: 7, coordinates: { lat: 6.0535, lng: 80.2210 } },
        ],
    },
    {
        routeNumber: 'NTC-003',
        name: 'Colombo - Matara',
        origin: 'Colombo',
        destination: 'Matara',
        distance: 160,
        estimatedDuration: 210, // 3.5 hours
        serviceTypes: ['normal', 'semiLuxury', 'luxury'],
        expressway: false,
        status: 'active',
        stops: [
            { name: 'Colombo Fort', order: 1, coordinates: { lat: 6.9344, lng: 79.8428 } },
            { name: 'Panadura', order: 2, coordinates: { lat: 6.7133, lng: 79.9026 } },
            { name: 'Kalutara', order: 3, coordinates: { lat: 6.5831, lng: 79.9607 } },
            { name: 'Hikkaduwa', order: 4, coordinates: { lat: 6.1408, lng: 80.1025 } },
            { name: 'Galle', order: 5, coordinates: { lat: 6.0535, lng: 80.2210 } },
            { name: 'Unawatuna', order: 6, coordinates: { lat: 6.0108, lng: 80.2488 } },
            { name: 'Ahangama', order: 7, coordinates: { lat: 5.9753, lng: 80.3686 } },
            { name: 'Weligama', order: 8, coordinates: { lat: 5.9736, lng: 80.4297 } },
            { name: 'Mirissa', order: 9, coordinates: { lat: 5.9483, lng: 80.4592 } },
            { name: 'Matara Bus Stand', order: 10, coordinates: { lat: 5.9549, lng: 80.5550 } },
        ],
    },
    {
        routeNumber: 'NTC-004',
        name: 'Colombo - Jaffna (A9 Highway)',
        origin: 'Colombo',
        destination: 'Jaffna',
        distance: 395,
        estimatedDuration: 480, // 8 hours
        serviceTypes: ['luxury', 'superLuxury'],
        expressway: false,
        status: 'active',
        stops: [
            { name: 'Colombo Fort', order: 1, coordinates: { lat: 6.9344, lng: 79.8428 } },
            { name: 'Negombo', order: 2, coordinates: { lat: 7.2083, lng: 79.8358 } },
            { name: 'Kurunegala', order: 3, coordinates: { lat: 7.4863, lng: 80.3623 } },
            { name: 'Dambulla', order: 4, coordinates: { lat: 7.8606, lng: 80.6517 } },
            { name: 'Anuradhapura', order: 5, coordinates: { lat: 8.3114, lng: 80.4037 } },
            { name: 'Vavuniya', order: 6, coordinates: { lat: 8.7543, lng: 80.4970 } },
            { name: 'Kilinochchi', order: 7, coordinates: { lat: 9.3961, lng: 80.3994 } },
            { name: 'Elephant Pass', order: 8, coordinates: { lat: 9.5239, lng: 80.4093 } },
            { name: 'Jaffna Bus Stand', order: 9, coordinates: { lat: 9.6615, lng: 80.0255 } },
        ],
    },
    {
        routeNumber: 'NTC-005',
        name: 'Kandy - Jaffna',
        origin: 'Kandy',
        destination: 'Jaffna',
        distance: 285,
        estimatedDuration: 360, // 6 hours
        serviceTypes: ['normal', 'semiLuxury', 'luxury'],
        expressway: false,
        status: 'active',
        stops: [
            { name: 'Kandy Bus Stand', order: 1, coordinates: { lat: 7.2906, lng: 80.6337 } },
            { name: 'Matale', order: 2, coordinates: { lat: 7.4697, lng: 80.6234 } },
            { name: 'Dambulla', order: 3, coordinates: { lat: 7.8606, lng: 80.6517 } },
            { name: 'Anuradhapura', order: 4, coordinates: { lat: 8.3114, lng: 80.4037 } },
            { name: 'Vavuniya', order: 5, coordinates: { lat: 8.7543, lng: 80.4970 } },
            { name: 'Kilinochchi', order: 6, coordinates: { lat: 9.3961, lng: 80.3994 } },
            { name: 'Jaffna Bus Stand', order: 7, coordinates: { lat: 9.6615, lng: 80.0255 } },
        ],
    },
    {
        routeNumber: 'NTC-006',
        name: 'Colombo - Trincomalee',
        origin: 'Colombo',
        destination: 'Trincomalee',
        distance: 257,
        estimatedDuration: 300, // 5 hours
        serviceTypes: ['normal', 'semiLuxury', 'luxury'],
        expressway: false,
        status: 'active',
        stops: [
            { name: 'Colombo Fort', order: 1, coordinates: { lat: 6.9344, lng: 79.8428 } },
            { name: 'Kurunegala', order: 2, coordinates: { lat: 7.4863, lng: 80.3623 } },
            { name: 'Dambulla', order: 3, coordinates: { lat: 7.8606, lng: 80.6517 } },
            { name: 'Habarana', order: 4, coordinates: { lat: 8.0363, lng: 80.7518 } },
            { name: 'Polonnaruwa', order: 5, coordinates: { lat: 7.9403, lng: 81.0188 } },
            { name: 'Trincomalee Bus Stand', order: 6, coordinates: { lat: 8.5874, lng: 81.2152 } },
        ],
    },
    {
        routeNumber: 'STU-001',
        name: 'Colombo - Kandy (Sisu Seriya)',
        origin: 'Colombo',
        destination: 'Kandy',
        distance: 115,
        estimatedDuration: 200, // Slower for student service
        serviceTypes: ['sisuSeriya'],
        expressway: false,
        status: 'active',
        stops: [
            { name: 'Colombo Fort', order: 1, coordinates: { lat: 6.9344, lng: 79.8428 } },
            { name: 'Kadawatha', order: 2, coordinates: { lat: 7.0008, lng: 79.9520 } },
            { name: 'Gampaha', order: 3, coordinates: { lat: 7.0916, lng: 79.9999 } },
            { name: 'Kegalle', order: 4, coordinates: { lat: 7.2523, lng: 80.3436 } },
            { name: 'Kandy Bus Stand', order: 5, coordinates: { lat: 7.2906, lng: 80.6337 } },
        ],
    },
];

/**
 * Authentic NTC Bus Operators (based on real organizations)
 */
const ntcOperatorsData = [
    {
        name: 'National Transport Commission Central',
        registrationNumber: 'NTC-CENTRAL-001',
        licenseNumber: 'LIC-NTC-001',
        contactPerson: {
            name: 'W.M.S.B. Weerasinghe',
            phone: '0112587372',
            email: 'central@ntc.gov.lk',
        },
        address: {
            street: 'No. 241, Park Road',
            city: 'Colombo',
            province: 'Western',
            postalCode: '00500',
        },
        licenseExpiry: new Date('2026-12-31'),
        status: 'active',
    },
    {
        name: 'Sri Lanka Transport Board - Western',
        registrationNumber: 'SLTB-WEST-001',
        licenseNumber: 'LIC-SLTB-001',
        contactPerson: {
            name: 'K.A.N. Silva',
            phone: '0112876543',
            email: 'western@sltb.gov.lk',
        },
        address: {
            street: 'No. 100, Baseline Road',
            city: 'Colombo',
            province: 'Western',
            postalCode: '00900',
        },
        licenseExpiry: new Date('2026-09-30'),
        status: 'active',
    },
    {
        name: 'Sri Lanka Transport Board - Southern',
        registrationNumber: 'SLTB-SOUTH-001',
        licenseNumber: 'LIC-SLTB-002',
        contactPerson: {
            name: 'R.P. Fernando',
            phone: '0912234567',
            email: 'southern@sltb.gov.lk',
        },
        address: {
            street: 'No. 45, Matara Road',
            city: 'Galle',
            province: 'Southern',
            postalCode: '80000',
        },
        licenseExpiry: new Date('2027-03-15'),
        status: 'active',
    },
    {
        name: 'Express Pearl Private Limited',
        registrationNumber: 'EP-PVT-001',
        licenseNumber: 'LIC-EP-001',
        contactPerson: {
            name: 'Nimal Jayasinghe',
            phone: '0777123456',
            email: 'operations@expresspearl.lk',
        },
        address: {
            street: 'No. 156, Kandy Road',
            city: 'Kadawatha',
            province: 'Western',
            postalCode: '11850',
        },
        licenseExpiry: new Date('2027-06-20'),
        status: 'active',
    },
    {
        name: 'Comfort Line (Pvt) Ltd',
        registrationNumber: 'CL-PVT-001',
        licenseNumber: 'LIC-CL-001',
        contactPerson: {
            name: 'Anura Wickramasinghe',
            phone: '0771234567',
            email: 'info@comfortline.lk',
        },
        address: {
            street: 'No. 78, Galle Road',
            city: 'Mount Lavinia',
            province: 'Western',
            postalCode: '10370',
        },
        licenseExpiry: new Date('2026-11-10'),
        status: 'active',
    },
    {
        name: 'Highway Express (Pvt) Ltd',
        registrationNumber: 'HE-PVT-001',
        licenseNumber: 'LIC-HE-001',
        contactPerson: {
            name: 'Chaminda Perera',
            phone: '0765432109',
            email: 'reservations@highwayexpress.lk',
        },
        address: {
            street: 'No. 234, High Level Road',
            city: 'Nugegoda',
            province: 'Western',
            postalCode: '10250',
        },
        licenseExpiry: new Date('2027-08-15'),
        status: 'active',
    },
];

/**
 * Calculate realistic fare based on NTC structure
 */
const calculateNTCFare = (distance, serviceType) => {
    const serviceConfig = ntcServiceTypes[serviceType];
    const baseFare = Math.ceil(distance * serviceConfig.baseFarePerKm);
    
    // Add minimum fare based on service type
    const minimumFares = {
        sisuSeriya: 25,
        normal: 35,
        semiLuxury: 50,
        luxury: 75,
        superLuxury: 100,
        expresswayLuxury: 120,
    };
    
    const minimumFare = minimumFares[serviceType] || 35;
    
    return Math.max(baseFare, minimumFare);
};/**
 * Generate realistic buses with NTC specifications
 */
const generateNTCBuses = (operators, routes) => {
    const buses = [];
    const realBusMakes = {
        normal: ['Tata', 'Ashok Leyland', 'Hino'],
        semiLuxury: ['Ashok Leyland', 'Tata', 'Isuzu'],
        luxury: ['Mercedes-Benz', 'Volvo', 'Scania'],
        superLuxury: ['Mercedes-Benz', 'Volvo', 'Scania'],
        expresswayLuxury: ['Mercedes-Benz', 'Volvo', 'Scania'],
        sisuSeriya: ['Tata', 'Ashok Leyland'],
    };

    let busCounter = 1;

    // Distribute operators across routes cyclically
    routes.forEach((route, routeIndex) => {
        route.serviceTypes.forEach((serviceType) => {
            const serviceConfig = ntcServiceTypes[serviceType];
            const makes = realBusMakes[serviceType];
            const make = makes[busCounter % makes.length];

            // Assign operator based on route index to distribute evenly
            const operator = operators[routeIndex % operators.length];

            for (let i = 0; i < 2; i += 1) { // 2 buses per service type per route
                let registrationPrefix = 'PVT';
                if (operator.name.includes('SLTB')) {
                    registrationPrefix = 'ශ්‍රී';
                } else if (operator.name.includes('NTC')) {
                    registrationPrefix = 'NTC';
                }

                let busModel = 'Starbus';
                if (make === 'Mercedes-Benz') {
                    busModel = 'OF-1830';
                } else if (make === 'Volvo') {
                    busModel = 'B9R';
                } else if (make === 'Scania') {
                    busModel = 'K230UB';
                } else if (make === 'Ashok Leyland') {
                    busModel = 'Viking';
                }

                buses.push({
                    registrationNumber: `${registrationPrefix}-${String(busCounter).padStart(4, '0')}`,
                    make,
                    model: busModel,
                    year: 2019 + (busCounter % 6),
                    capacity: serviceConfig.capacity,
                    operatorId: operator._id,
                    routeId: route._id,
                    serviceType,
                    status: busCounter % 15 === 0 ? 'maintenance' : 'active',
                    features: serviceConfig.features,
                    lastMaintenance: new Date(Date.now() - (busCounter % 45) * 24 * 60 * 60 * 1000),
                    nextMaintenance: new Date(Date.now() + (45 + (busCounter % 30)) * 24 * 60 * 60 * 1000),
                    permitNumber: `PER-${busCounter}-${new Date().getFullYear()}`,
                    insuranceExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
                    fitnessExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
                });

                busCounter += 1;
            }
        });
    });

    return buses;
};

/**
 * Generate realistic trips with NTC scheduling
 */
const generateNTCTrips = (buses, routes) => {
    const trips = [];
    let tripCounter = 1;

    // Standard NTC departure times
    const standardDepartures = {
        normal: ['05:30', '07:00', '09:30', '12:00', '14:30', '17:00', '19:30'],
        semiLuxury: ['06:00', '08:30', '11:00', '13:30', '16:00', '18:30'],
        luxury: ['06:30', '09:00', '12:30', '15:00', '17:30', '20:00'],
        superLuxury: ['07:00', '10:00', '13:00', '16:00', '19:00'],
        expresswayLuxury: ['06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'],
        sisuSeriya: ['06:30', '13:00', '17:30'], // Student timing
    };

    // Generate for next 7 days
    for (let day = 0; day < 7; day += 1) {
        routes.forEach((route) => {
            route.serviceTypes.forEach((serviceType) => {
                const routeBuses = buses.filter((bus) =>
                    bus.routeId.toString() === route._id.toString()
                    && bus.serviceType === serviceType
                    && bus.status === 'active',
                );

                if (routeBuses.length === 0) return;

                const departures = standardDepartures[serviceType] || standardDepartures.normal;

                departures.forEach((time, timeIndex) => {
                    const bus = routeBuses[timeIndex % routeBuses.length];

                    const [hours, minutes] = time.split(':');
                    const departureDate = new Date();
                    departureDate.setDate(departureDate.getDate() + day);
                    departureDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

                    const arrivalDate = new Date(departureDate);
                    arrivalDate.setMinutes(arrivalDate.getMinutes() + route.estimatedDuration);

                    const fare = calculateNTCFare(route.distance, serviceType);

                    let status = 'scheduled';
                    if (day === 0 && timeIndex === 0) {
                        status = 'in-transit';
                    } else if (day === 0 && timeIndex < 2) {
                        status = 'completed';
                    }

                    trips.push({
                        tripNumber: `${route.routeNumber}-${String(tripCounter).padStart(4, '0')}`,
                        busId: bus._id,
                        routeId: route._id,
                        serviceType,
                        scheduledDepartureTime: departureDate,
                        scheduledArrivalTime: arrivalDate,
                        fare,
                        status,
                        driver: {
                            name: `Driver ${tripCounter}`,
                            licenseNumber: `DL-${String(tripCounter).padStart(6, '0')}`,
                            phone: `077${String(tripCounter).padStart(7, '0')}`,
                        },
                        conductor: serviceType !== 'superLuxury' && serviceType !== 'expresswayLuxury' ? {
                            name: `Conductor ${tripCounter}`,
                            employeeId: `CON-${String(tripCounter).padStart(4, '0')}`,
                            phone: `076${String(tripCounter).padStart(7, '0')}`,
                        } : undefined,
                        estimatedPassengers: Math.floor(bus.capacity * (0.3 + Math.random() * 0.6)),
                        actualDepartureTime: status !== 'scheduled' ? departureDate : undefined,
                        actualArrivalTime: status === 'completed' ? arrivalDate : undefined,
                    });

                    tripCounter += 1;
                });
            });
        });
    }

    return trips;
};

/**
 * Enhanced location updates with realistic tracking
 */
const generateNTCLocationUpdates = (trips, routes) => {
    const locations = [];

    const activeTrips = trips.filter((trip) => trip.status === 'in-transit' || trip.status === 'completed');

    activeTrips.forEach((trip) => {
        const route = routes.find((r) => r._id.toString() === trip.routeId.toString());
        if (!route) return;

        // Generate more frequent updates for expressway routes
        const updateFrequency = route.expressway ? 8 : 6;
        const stopInterval = Math.max(1, Math.floor(route.stops.length / updateFrequency));

        for (let i = 0; i < updateFrequency; i += 1) {
            const stopIndex = Math.min(i * stopInterval, route.stops.length - 1);
            const stop = route.stops[stopIndex];

            // Add slight GPS variation for realism
            const latVariation = (Math.random() - 0.5) * 0.002;
            const lngVariation = (Math.random() - 0.5) * 0.002;

            const expresswaySpeed = 80 + Math.floor(Math.random() * 20); // 80-100 km/h
            const normalSpeed = 40 + Math.floor(Math.random() * 30); // 40-70 km/h

            locations.push({
                busId: trip.busId,
                tripId: trip._id,
                coordinates: {
                    lat: stop.coordinates.lat + latVariation,
                    lng: stop.coordinates.lng + lngVariation,
                },
                speed: route.expressway ? expresswaySpeed : normalSpeed,
                heading: 90 + Math.floor(Math.random() * 20),
                accuracy: 3 + Math.floor(Math.random() * 7), // 3-10m accuracy
                timestamp: new Date(Date.now() - (updateFrequency - i) * 15 * 60 * 1000), // Every 15 minutes
                status: i < updateFrequency - 1 ? 'moving' : 'stopped',
                altitude: 50 + Math.floor(Math.random() * 100), // Altitude in meters
                batteryLevel: 85 + Math.floor(Math.random() * 15), // GPS device battery
            });
        }
    });

    return locations;
};

/**
 * Main function to generate enhanced NTC realistic data
 */
const generateNTCRealisticData = async () => {
    try {
        console.log('\n🇱🇰 Starting NTC Realistic Data Generation...\n');

        // Clear existing data
        console.log('🗑️  Clearing existing data...');
        await Promise.all([
            Route.deleteMany({}),
            Bus.deleteMany({}),
            Trip.deleteMany({}),
            Operator.deleteMany({}),
            LocationUpdate.deleteMany({}),
        ]);
        console.log('✅ Existing data cleared\n');

        // Add base fare (normal service) to routes for model compatibility
        const routesWithFares = ntcRoutesData.map((route) => ({
            ...route,
            fare: calculateNTCFare(route.distance, 'normal'), // Base fare for normal service
            // Store all fares in metadata for reference
            fareStructure: route.serviceTypes.reduce((acc, serviceType) => {
                acc[serviceType] = calculateNTCFare(route.distance, serviceType);
                return acc;
            }, {}),
        }));

        // Insert Routes
        console.log('🛣️  Creating NTC routes...');
        const routes = await Route.insertMany(routesWithFares);
        console.log(`✅ Created ${routes.length} authentic NTC routes\n`);

        // Add service types back to routes for bus generation (since they're not saved to DB)
        routes.forEach((route, index) => {
            const routeWithServiceTypes = route;
            routeWithServiceTypes.serviceTypes = ntcRoutesData[index].serviceTypes;
        });
        console.log(`✅ Created ${routes.length} authentic NTC routes\n`);

        // Insert Operators
        console.log('🏢 Creating NTC operators...');
        const operators = await Operator.insertMany(ntcOperatorsData);
        console.log(`✅ Created ${operators.length} authentic NTC operators\n`);

        // Generate and insert Buses
        console.log('🚌 Creating NTC buses...');
        const busesData = generateNTCBuses(operators, routes);
        const buses = await Bus.insertMany(busesData);
        console.log(`✅ Created ${buses.length} buses with authentic NTC specifications\n`);

        // Generate and insert Trips
        console.log('🎫 Creating NTC trips with realistic scheduling...');
        const tripsData = generateNTCTrips(buses, routes);
        const trips = await Trip.insertMany(tripsData);
        console.log(`✅ Created ${trips.length} trips with authentic NTC timetables\n`);

        // Generate and insert Location Updates
        console.log('📍 Creating location updates...');
        const locationsData = generateNTCLocationUpdates(trips, routes);
        const locations = await LocationUpdate.insertMany(locationsData);
        console.log(`✅ Created ${locations.length} location updates\n`);

        // Create enhanced summary
        const summary = {
            metadata: {
                generatedAt: new Date().toISOString(),
                basedOn: 'Official NTC data from ntc.gov.lk',
                fareRevision: 'July 2025',
                dataSource: 'National Transport Commission Sri Lanka',
            },
            statistics: {
                routes: routes.length,
                operators: operators.length,
                buses: buses.length,
                trips: trips.length,
                locationUpdates: locations.length,
            },
            serviceTypes: Object.keys(ntcServiceTypes),
            routeTypes: {
                normalHighway: routes.filter((r) => !r.expressway).length,
                expressway: routes.filter((r) => r.expressway).length,
                studentService: routes.filter((r) => r.serviceTypes.includes('sisuSeriya')).length,
            },
            coverage: {
                provinces: ['Western', 'Central', 'Southern', 'Northern', 'Eastern'],
                majorCities: ['Colombo', 'Kandy', 'Galle', 'Matara', 'Jaffna', 'Trincomalee'],
            },
        };

        console.log('\n🎉 NTC Realistic Data Generation Summary:');
        console.log('═══════════════════════════════════════════════════');
        console.log(`🛣️  Routes: ${summary.statistics.routes} (${summary.routeTypes.normalHighway} Normal + ${summary.routeTypes.expressway} Expressway)`);
        console.log(`🏢 Operators: ${summary.statistics.operators} (Government + Private)`);
        console.log(`🚌 Buses: ${summary.statistics.buses} (Multiple service types)`);
        console.log(`🎫 Trips: ${summary.statistics.trips} (7 days, realistic timetables)`);
        console.log(`📍 Location Updates: ${summary.statistics.locationUpdates}`);
        console.log(`💰 Based on: ${summary.metadata.fareRevision} NTC fare revision`);
        console.log('═══════════════════════════════════════════════════\n');

        // Export enhanced data
        await exportNTCDataAsJSON({
            routes,
            operators,
            buses,
            trips,
            locations,
            summary,
            ntcServiceTypes,
        });

        await exportNTCDataAsCSV({
            routes,
            operators,
            buses,
            trips,
            locations,
        });

        console.log('✅ NTC realistic data generation completed successfully!\n');
        return summary;
    } catch (error) {
        console.error('❌ Error generating NTC realistic data:', error);
        throw error;
    }
};

/**
 * Export enhanced data as JSON files
 */
const exportNTCDataAsJSON = async (data) => {
    try {
        const exportDir = path.join(__dirname, '../exports/ntc-realistic');
        await fs.mkdir(exportDir, { recursive: true });

        // Export each collection with enhanced metadata
        await fs.writeFile(
            path.join(exportDir, 'routes.json'),
            JSON.stringify({
                metadata: { description: 'NTC Inter-Provincial Routes with authentic fare structures' },
                data: data.routes,
            }, null, 2),
        );

        await fs.writeFile(
            path.join(exportDir, 'operators.json'),
            JSON.stringify({
                metadata: { description: 'Authentic NTC and SLTB operators' },
                data: data.operators,
            }, null, 2),
        );

        await fs.writeFile(
            path.join(exportDir, 'buses.json'),
            JSON.stringify({
                metadata: { description: 'Buses with authentic NTC service specifications' },
                data: data.buses,
            }, null, 2),
        );

        await fs.writeFile(
            path.join(exportDir, 'trips.json'),
            JSON.stringify({
                metadata: { description: 'Trips with realistic NTC timetables and fares' },
                data: data.trips,
            }, null, 2),
        );

        await fs.writeFile(
            path.join(exportDir, 'locations.json'),
            JSON.stringify({
                metadata: { description: 'GPS location updates with enhanced tracking' },
                data: data.locations,
            }, null, 2),
        );

        await fs.writeFile(
            path.join(exportDir, 'summary.json'),
            JSON.stringify(data.summary, null, 2),
        );

        await fs.writeFile(
            path.join(exportDir, 'service-types.json'),
            JSON.stringify({
                metadata: { description: 'NTC Service types with official fare structures' },
                data: data.ntcServiceTypes,
            }, null, 2),
        );

        console.log(`📄 Enhanced JSON files exported to: ${exportDir}`);
    } catch (error) {
        console.error('❌ Error exporting JSON:', error);
    }
};

/**
 * Export enhanced data as CSV files
 */
const exportNTCDataAsCSV = async (data) => {
    try {
        const exportDir = path.join(__dirname, '../exports/ntc-realistic-csv');
        await fs.mkdir(exportDir, { recursive: true });

        // Enhanced routes CSV
        const routesCSV = ['Route Number,Name,Origin,Destination,Distance(km),Duration(min),Service Types,Expressway,Status,Stops Count']
            .concat(
                data.routes.map((r) => `"${r.routeNumber}","${r.name}","${r.origin}","${r.destination}",${r.distance},${r.estimatedDuration},"${r.serviceTypes.join('; ')}",${r.expressway},"${r.status}",${r.stops.length}`),
            ).join('\n');
        await fs.writeFile(path.join(exportDir, 'routes.csv'), routesCSV);

        // Enhanced operators CSV
        const operatorsCSV = ['Name,Registration Number,License Number,Contact Person,Phone,Email,License Expiry,Status,Operating Routes']
            .concat(
                data.operators.map((o) => `"${o.name}","${o.registrationNumber}","${o.licenseNumber}","${o.contactPerson.name}","${o.contactPerson.phone}","${o.contactPerson.email}","${o.licenseExpiry}","${o.status}","${o.operatingRoutes.join('; ')}"`),
            ).join('\n');
        await fs.writeFile(path.join(exportDir, 'operators.csv'), operatorsCSV);

        // Enhanced buses CSV
        const busesCSV = ['Registration Number,Make,Model,Year,Capacity,Service Type,Operator ID,Route ID,Status,Features,Permit Number']
            .concat(
                data.buses.map((b) => `"${b.registrationNumber}","${b.make}","${b.model}",${b.year},${b.capacity},"${b.serviceType}","${b.operatorId}","${b.routeId}","${b.status}","${b.features.join('; ')}","${b.permitNumber}"`),
            ).join('\n');
        await fs.writeFile(path.join(exportDir, 'buses.csv'), busesCSV);

        // Enhanced trips CSV
        const tripsCSV = ['Trip Number,Bus ID,Route ID,Service Type,Scheduled Departure,Scheduled Arrival,Fare(LKR),Status,Passengers,Driver']
            .concat(
                data.trips.map((t) => `"${t.tripNumber}","${t.busId}","${t.routeId}","${t.serviceType}","${t.scheduledDepartureTime}","${t.scheduledArrivalTime}",${t.fare},"${t.status}",${t.estimatedPassengers},"${t.driver.name}"`),
            ).join('\n');
        await fs.writeFile(path.join(exportDir, 'trips.csv'), tripsCSV);

        // Enhanced locations CSV
        const locationsCSV = ['Bus ID,Trip ID,Latitude,Longitude,Speed(kmh),Heading,Accuracy(m),Timestamp,Status,Altitude(m),Battery(%)']
            .concat(
                data.locations.map((l) => `"${l.busId}","${l.tripId}",${l.coordinates.lat},${l.coordinates.lng},${l.speed},${l.heading},${l.accuracy},"${l.timestamp}","${l.status}",${l.altitude || 0},${l.batteryLevel || 100}`),
            ).join('\n');
        await fs.writeFile(path.join(exportDir, 'locations.csv'), locationsCSV);

        console.log(`📊 Enhanced CSV files exported to: ${exportDir}`);
    } catch (error) {
        console.error('❌ Error exporting CSV:', error);
    }
};

// Run the enhanced generator
if (require.main === module) {
    connectDB()
        .then(() => generateNTCRealisticData())
        .then(() => {
            console.log('🎉 All done! Closing database connection...');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Fatal error:', error);
            process.exit(1);
        });
}

module.exports = {
    generateNTCRealisticData,
    exportNTCDataAsJSON,
    exportNTCDataAsCSV,
    ntcServiceTypes,
    calculateNTCFare,
};
