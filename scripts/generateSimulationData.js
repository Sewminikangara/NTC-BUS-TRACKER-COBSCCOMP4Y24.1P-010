/**
 * Simulation Data Generator
 
 * 
 * @module scripts/generateSimulationData
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
const User = require('../src/models/User');

// Connect to MongoDB
const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI || process.env.MONGODB_URL;
        if (!mongoUri) {
            throw new Error('MongoDB connection string not found. Please set MONGODB_URI or MONGODB_URL environment variable.');
        }
        await mongoose.connect(mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log(' MongoDB Connected');
    } catch (error) {
        console.error(' MongoDB Connection Error:', error);
        process.exit(1);
    }
};

/**
 * Real inter-provincial routes  with GPS coordinates
 */
const routesData = [
    {
        routeNumber: '001',
        name: 'Colombo - Kandy Express',
        origin: 'Colombo',
        destination: 'Kandy',
        distance: 115,
        estimatedDuration: 180, // 3 hours
        fare: 350,
        status: 'active',
        stops: [
            { name: 'Colombo Fort', order: 1, coordinates: { lat: 6.9344, lng: 79.8428 } },
            { name: 'Kadawatha', order: 2, coordinates: { lat: 7.0008, lng: 79.9520 } },
            { name: 'Gampaha', order: 3, coordinates: { lat: 7.0916, lng: 79.9999 } },
            { name: 'Pasyala', order: 4, coordinates: { lat: 7.1655, lng: 80.1189 } },
            { name: 'Ambepussa', order: 5, coordinates: { lat: 7.2641, lng: 80.1989 } },
            { name: 'Kegalle', order: 6, coordinates: { lat: 7.2523, lng: 80.3436 } },
            { name: 'Mawanella', order: 7, coordinates: { lat: 7.2531, lng: 80.4467 } },
            { name: 'Kadugannawa', order: 8, coordinates: { lat: 7.2550, lng: 80.5208 } },
            { name: 'Peradeniya', order: 9, coordinates: { lat: 7.2650, lng: 80.5975 } },
            { name: 'Kandy', order: 10, coordinates: { lat: 7.2906, lng: 80.6337 } },
        ],
    },
    {
        routeNumber: '002',
        name: 'Colombo - Galle Coastal Route',
        origin: 'Colombo',
        destination: 'Galle',
        distance: 119,
        estimatedDuration: 150, // 2.5 hours
        fare: 320,
        status: 'active',
        stops: [
            { name: 'Colombo Fort', order: 1, coordinates: { lat: 6.9344, lng: 79.8428 } },
            { name: 'Mount Lavinia', order: 2, coordinates: { lat: 6.8365, lng: 79.8630 } },
            { name: 'Moratuwa', order: 3, coordinates: { lat: 6.7727, lng: 79.8816 } },
            { name: 'Panadura', order: 4, coordinates: { lat: 6.7133, lng: 79.9026 } },
            { name: 'Kalutara', order: 5, coordinates: { lat: 6.5831, lng: 79.9607 } },
            { name: 'Aluthgama', order: 6, coordinates: { lat: 6.4255, lng: 79.9989 } },
            { name: 'Hikkaduwa', order: 7, coordinates: { lat: 6.1408, lng: 80.1025 } },
            { name: 'Galle', order: 8, coordinates: { lat: 6.0535, lng: 80.2210 } },
        ],
    },
    {
        routeNumber: '003',
        name: 'Colombo - Matara Southern Highway',
        origin: 'Colombo',
        destination: 'Matara',
        distance: 160,
        estimatedDuration: 180, // 3 hours
        fare: 420,
        status: 'active',
        stops: [
            { name: 'Colombo Fort', order: 1, coordinates: { lat: 6.9344, lng: 79.8428 } },
            { name: 'Panadura', order: 2, coordinates: { lat: 6.7133, lng: 79.9026 } },
            { name: 'Kalutara', order: 3, coordinates: { lat: 6.5831, lng: 79.9607 } },
            { name: 'Hikkaduwa', order: 4, coordinates: { lat: 6.1408, lng: 80.1025 } },
            { name: 'Galle', order: 5, coordinates: { lat: 6.0535, lng: 80.2210 } },
            { name: 'Ahangama', order: 6, coordinates: { lat: 5.9753, lng: 80.3686 } },
            { name: 'Weligama', order: 7, coordinates: { lat: 5.9736, lng: 80.4297 } },
            { name: 'Matara', order: 8, coordinates: { lat: 5.9549, lng: 80.5550 } },
        ],
    },
    {
        routeNumber: '004',
        name: 'Colombo - Jaffna A9 Highway',
        origin: 'Colombo',
        destination: 'Jaffna',
        distance: 395,
        estimatedDuration: 480, // 8 hours
        fare: 1200,
        status: 'active',
        stops: [
            { name: 'Colombo Fort', order: 1, coordinates: { lat: 6.9344, lng: 79.8428 } },
            { name: 'Vavuniya', order: 2, coordinates: { lat: 8.7543, lng: 80.4970 } },
            { name: 'Mannar', order: 3, coordinates: { lat: 8.9810, lng: 79.9042 } },
            { name: 'Kilinochchi', order: 4, coordinates: { lat: 9.3961, lng: 80.3994 } },
            { name: 'Elephant Pass', order: 5, coordinates: { lat: 9.5239, lng: 80.4093 } },
            { name: 'Jaffna', order: 6, coordinates: { lat: 9.6615, lng: 80.0255 } },
        ],
    },
    {
        routeNumber: '005',
        name: 'Kandy - Jaffna Central Route',
        origin: 'Kandy',
        destination: 'Jaffna',
        distance: 285,
        estimatedDuration: 360, // 6 hours
        fare: 950,
        status: 'active',
        stops: [
            { name: 'Kandy', order: 1, coordinates: { lat: 7.2906, lng: 80.6337 } },
            { name: 'Matale', order: 2, coordinates: { lat: 7.4697, lng: 80.6234 } },
            { name: 'Dambulla', order: 3, coordinates: { lat: 7.8606, lng: 80.6517 } },
            { name: 'Anuradhapura', order: 4, coordinates: { lat: 8.3114, lng: 80.4037 } },
            { name: 'Vavuniya', order: 5, coordinates: { lat: 8.7543, lng: 80.4970 } },
            { name: 'Kilinochchi', order: 6, coordinates: { lat: 9.3961, lng: 80.3994 } },
            { name: 'Jaffna', order: 7, coordinates: { lat: 9.6615, lng: 80.0255 } },
        ],
    },
    {
        routeNumber: '006',
        name: 'Colombo - Trincomalee East Coast',
        origin: 'Colombo',
        destination: 'Trincomalee',
        distance: 257,
        estimatedDuration: 300, // 5 hours
        fare: 780,
        status: 'active',
        stops: [
            { name: 'Colombo Fort', order: 1, coordinates: { lat: 6.9344, lng: 79.8428 } },
            { name: 'Kurunegala', order: 2, coordinates: { lat: 7.4863, lng: 80.3623 } },
            { name: 'Dambulla', order: 3, coordinates: { lat: 7.8606, lng: 80.6517 } },
            { name: 'Habarana', order: 4, coordinates: { lat: 8.0363, lng: 80.7518 } },
            { name: 'Polonnaruwa', order: 5, coordinates: { lat: 7.9403, lng: 81.0188 } },
            { name: 'Trincomalee', order: 6, coordinates: { lat: 8.5874, lng: 81.2152 } },
        ],
    },
];

/**
 * Bus operators 
 */
const operatorsData = [
    {
        name: 'NTC Central',
        registrationNumber: 'NTC-CENTRAL-001',
        licenseNumber: 'LIC-NTC-001',
        contactPerson: {
            name: 'Rajith Fernando',
            phone: '0112345678',
            email: 'rajith@ntc.lk',
        },
        address: {
            street: 'No. 250, Olcott Mawatha',
            city: 'Colombo',
            province: 'Western',
            postalCode: '01100',
        },
        licenseExpiry: new Date('2026-12-31'),
        status: 'active',
    },
    {
        name: 'NTC Southern',
        registrationNumber: 'NTC-SOUTHERN-001',
        licenseNumber: 'LIC-NTC-002',
        contactPerson: {
            name: 'Sunil Perera',
            phone: '0912234567',
            email: 'sunil@ntcsouthern.lk',
        },
        address: {
            street: 'No. 15, Matara Road',
            city: 'Galle',
            province: 'Southern',
            postalCode: '80000',
        },
        licenseExpiry: new Date('2027-03-15'),
        status: 'active',
    },
    {
        name: 'SLTB Western',
        registrationNumber: 'SLTB-WEST-001',
        licenseNumber: 'LIC-SLTB-001',
        contactPerson: {
            name: 'Kamal Silva',
            phone: '0112876543',
            email: 'kamal@sltb.gov.lk',
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
        name: 'Express Pearl',
        registrationNumber: 'EP-001',
        licenseNumber: 'LIC-EP-001',
        contactPerson: {
            name: 'Nimal Jayasinghe',
            phone: '0777123456',
            email: 'nimal@expresspearl.lk',
        },
        address: {
            street: 'No. 45, Kandy Road',
            city: 'Kadawatha',
            province: 'Western',
            postalCode: '11850',
        },
        licenseExpiry: new Date('2027-06-20'),
        status: 'active',
    },
    {
        name: 'Comfort Line',
        registrationNumber: 'CL-001',
        licenseNumber: 'LIC-CL-001',
        contactPerson: {
            name: 'Anura Wickramasinghe',
            phone: '0771234567',
            email: 'anura@comfortline.lk',
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
];

/**
 * Generate buses for each operator
 */
const generateBuses = (operators, routes) => {
    const buses = [];
    const busTypes = ['luxury', 'semi-luxury', 'normal'];
    const makes = ['Ashok Leyland', 'Tata', 'Mercedes-Benz', 'Volvo', 'Hino'];
    const models = ['Viking', 'Starbus', 'OF-1830', 'B9R', 'RK8'];
    const features = [
        ['AC', 'WiFi', 'USB Charging', 'Reclining Seats'],
        ['AC', 'USB Charging'],
        ['WiFi', 'USB Charging'],
        [],
    ];

    let busCounter = 1;

    operators.forEach((operator, opIndex) => {
        // Each operator gets 5-6 buses
        const busCount = 5 + (opIndex % 2);

        for (let i = 0; i < busCount; i++) {
            const busType = busTypes[busCounter % busTypes.length];
            const makeIndex = busCounter % makes.length;
            const capacity = busType === 'luxury' ? 45 : busType === 'semi-luxury' ? 52 : 60;
            const routeIndex = busCounter % routes.length;

            buses.push({
                registrationNumber: `${String.fromCharCode(65 + opIndex)}${String.fromCharCode(65 + (busCounter % 26))}-${1000 + busCounter}`,
                make: makes[makeIndex],
                model: models[makeIndex],
                year: 2020 + (busCounter % 5),
                capacity,
                operatorId: operator._id,
                routeId: routes[routeIndex]._id,
                status: busCounter % 10 === 0 ? 'maintenance' : 'active',
                features: busType === 'luxury' ? features[0] : busType === 'semi-luxury' ? features[1] : features[3],
                lastMaintenance: new Date(Date.now() - (busCounter % 30) * 24 * 60 * 60 * 1000),
                nextMaintenance: new Date(Date.now() + (30 + busCounter % 30) * 24 * 60 * 60 * 1000),
            });

            busCounter++;
        }
    });

    return buses;
};

/**
 * Generate trips for next 7 days
 */
const generateTrips = (buses, routes) => {
    const trips = [];
    let tripCounter = 1;

    // For each day
    for (let day = 0; day < 7; day++) {
        // For each route
        routes.forEach((route) => {
            // Get buses assigned to this route
            const routeBuses = buses.filter((bus) => bus.routeId.toString() === route._id.toString() && bus.status === 'active');

            // Multiple trips per day (early morning, morning, afternoon, evening, night)
            const departureTimes = ['05:00', '08:30', '12:00', '15:30', '19:00'];

            departureTimes.forEach((time, timeIndex) => {
                // Use different buses for different time slots
                const bus = routeBuses[timeIndex % routeBuses.length];
                if (!bus) return;

                const [hours, minutes] = time.split(':');
                const departureDate = new Date();
                departureDate.setDate(departureDate.getDate() + day);
                departureDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

                const arrivalDate = new Date(departureDate);
                arrivalDate.setMinutes(arrivalDate.getMinutes() + route.estimatedDuration);

                const status = day === 0 && timeIndex === 0 ? 'in-transit' : day === 0 && timeIndex < 2 ? 'completed' : 'scheduled';

                trips.push({
                    tripNumber: `TRIP-${String(tripCounter).padStart(4, '0')}`,
                    busId: bus._id,
                    routeId: route._id,
                    scheduledDepartureTime: departureDate,
                    scheduledArrivalTime: arrivalDate,
                    fare: route.fare,
                    status,
                    driver: {
                        name: `Driver ${tripCounter}`,
                        licenseNumber: `DL-${1000 + tripCounter}`,
                        phone: `077${1000000 + tripCounter}`,
                    },
                    estimatedPassengers: 20 + (tripCounter % 40),
                    actualDepartureTime: status !== 'scheduled' ? departureDate : undefined,
                    actualArrivalTime: status === 'completed' ? arrivalDate : undefined,
                });

                tripCounter++;
            });
        });
    }

    return trips;
};

/**
 * Generate location updates for active trips
 */
const generateLocationUpdates = (trips, routes) => {
    const locations = [];

    // Generate locations for in-transit and recently completed trips
    const activeTrips = trips.filter((trip) => trip.status === 'in-transit' || trip.status === 'completed');

    activeTrips.forEach((trip) => {
        const route = routes.find((r) => r._id.toString() === trip.routeId.toString());
        if (!route) return;

        // Generate 5-10 location points along the route
        const numPoints = 5 + Math.floor(Math.random() * 5);
        const stopInterval = Math.floor(route.stops.length / numPoints);

        for (let i = 0; i < numPoints; i++) {
            const stopIndex = Math.min(i * stopInterval, route.stops.length - 1);
            const stop = route.stops[stopIndex];

            locations.push({
                busId: trip.busId,
                tripId: trip._id,
                coordinates: {
                    lat: stop.coordinates.lat + (Math.random() - 0.5) * 0.001, // Small variation
                    lng: stop.coordinates.lng + (Math.random() - 0.5) * 0.001,
                },
                speed: 40 + Math.floor(Math.random() * 40), // 40-80 km/h
                heading: 90 + Math.floor(Math.random() * 20), // Heading direction
                accuracy: 5 + Math.floor(Math.random() * 15), // 5-20m accuracy
                timestamp: new Date(Date.now() - (numPoints - i) * 10 * 60 * 1000), // Every 10 minutes
                status: i < numPoints - 1 ? 'moving' : 'stopped',
            });
        }
    });

    return locations;
};

/**
 * Main function to generate and insert all simulation data
 */
const generateAllData = async () => {
    try {
        console.log('\n Starting Simulation Data Generation...\n');

        // Clear existing data
        console.log('  Clearing existing data...');
        await Promise.all([
            Route.deleteMany({}),
            Bus.deleteMany({}),
            Trip.deleteMany({}),
            Operator.deleteMany({}),
            LocationUpdate.deleteMany({}),
        ]);
        console.log(' Existing data cleared\n');

        // Insert Routes
        console.log(' Creating routes...');
        const routes = await Route.insertMany(routesData);
        console.log(` Created ${routes.length} routes\n`);

        // Insert Operators
        console.log(' Creating operators...');
        const operators = await Operator.insertMany(operatorsData);
        console.log(` Created ${operators.length} operators\n`);

        // Generate and insert Buses
        console.log(' Creating buses...');
        const busesData = generateBuses(operators, routes);
        const buses = await Bus.insertMany(busesData);
        console.log(` Created ${buses.length} buses\n`);

        // Generate and insert Trips
        console.log(' Creating trips for next 7 days...');
        const tripsData = generateTrips(buses, routes);
        const trips = await Trip.insertMany(tripsData);
        console.log(` Created ${trips.length} trips\n`);

        // Generate and insert Location Updates
        console.log(' Creating location updates...');
        const locationsData = generateLocationUpdates(trips, routes);
        const locations = await LocationUpdate.insertMany(locationsData);
        console.log(` Created ${locations.length} location updates\n`);

        // Create summary
        const summary = {
            routes: routes.length,
            operators: operators.length,
            buses: buses.length,
            trips: trips.length,
            locationUpdates: locations.length,
            generatedAt: new Date().toISOString(),
        };

        console.log('\n Generation Summary:');
        console.log('═══════════════════════════════════════');
        console.log(`Routes: ${summary.routes}`);
        console.log(`Operators: ${summary.operators}`);
        console.log(`Buses: ${summary.buses}`);
        console.log(`Trips (7 days): ${summary.trips}`);
        console.log(`Location Updates: ${summary.locationUpdates}`);
        console.log('═══════════════════════════════════════\n');

        // Export data as JSON
        await exportAsJSON({
            routes,
            operators,
            buses,
            trips,
            locations,
            summary,
        });

        // Export data as CSV
        await exportAsCSV({
            routes,
            operators,
            buses,
            trips,
            locations,
        });

        console.log(' Simulation data generation completed successfully!\n');

        return summary;
    } catch (error) {
        console.error(' Error generating simulation data:', error);
        throw error;
    }
};

/**
 * Export data as JSON files
 */
const exportAsJSON = async (data) => {
    try {
        const exportDir = path.join(__dirname, '../exports/json');
        await fs.mkdir(exportDir, { recursive: true });

        // Export each collection separately
        await fs.writeFile(
            path.join(exportDir, 'routes.json'),
            JSON.stringify(data.routes, null, 2),
        );
        await fs.writeFile(
            path.join(exportDir, 'operators.json'),
            JSON.stringify(data.operators, null, 2),
        );
        await fs.writeFile(
            path.join(exportDir, 'buses.json'),
            JSON.stringify(data.buses, null, 2),
        );
        await fs.writeFile(
            path.join(exportDir, 'trips.json'),
            JSON.stringify(data.trips, null, 2),
        );
        await fs.writeFile(
            path.join(exportDir, 'locations.json'),
            JSON.stringify(data.locations, null, 2),
        );
        await fs.writeFile(
            path.join(exportDir, 'summary.json'),
            JSON.stringify(data.summary, null, 2),
        );

        console.log(` JSON files exported to: ${exportDir}`);
    } catch (error) {
        console.error(' Error exporting JSON:', error);
    }
};

/**
 * Export data as CSV files
 */
const exportAsCSV = async (data) => {
    try {
        const exportDir = path.join(__dirname, '../exports/csv');
        await fs.mkdir(exportDir, { recursive: true });

        // Export routes as CSV
        const routesCSV = ['Route Number,Name,Origin,Destination,Distance,Duration,Fare,Status,Stops Count']
            .concat(
                data.routes.map((r) => `"${r.routeNumber}","${r.name}","${r.origin}","${r.destination}",${r.distance},${r.estimatedDuration},${r.fare},"${r.status}",${r.stops.length}`),
            )
            .join('\n');
        await fs.writeFile(path.join(exportDir, 'routes.csv'), routesCSV);

        // Export operators as CSV
        const operatorsCSV = ['Name,Registration Number,License Number,Contact Person,Phone,Email,License Expiry,Status']
            .concat(
                data.operators.map((o) => `"${o.name}","${o.registrationNumber}","${o.licenseNumber}","${o.contactPerson.name}","${o.contactPerson.phone}","${o.contactPerson.email}","${o.licenseExpiry}","${o.status}"`),
            )
            .join('\n');
        await fs.writeFile(path.join(exportDir, 'operators.csv'), operatorsCSV);

        // Export buses as CSV
        const busesCSV = ['Registration Number,Make,Model,Year,Capacity,Operator ID,Route ID,Status,Features']
            .concat(
                data.buses.map((b) => `"${b.registrationNumber}","${b.make}","${b.model}",${b.year},${b.capacity},"${b.operatorId}","${b.routeId}","${b.status}","${b.features.join('; ')}"`),
            )
            .join('\n');
        await fs.writeFile(path.join(exportDir, 'buses.csv'), busesCSV);

        // Export trips as CSV
        const tripsCSV = ['Trip Number,Bus ID,Route ID,Scheduled Departure,Scheduled Arrival,Fare,Status,Passengers']
            .concat(
                data.trips.map((t) => `"${t.tripNumber}","${t.busId}","${t.routeId}","${t.scheduledDepartureTime}","${t.scheduledArrivalTime}",${t.fare},"${t.status}",${t.estimatedPassengers}`),
            )
            .join('\n');
        await fs.writeFile(path.join(exportDir, 'trips.csv'), tripsCSV);

        // Export locations as CSV
        const locationsCSV = ['Bus ID,Trip ID,Latitude,Longitude,Speed,Heading,Accuracy,Timestamp,Status']
            .concat(
                data.locations.map((l) => `"${l.busId}","${l.tripId}",${l.coordinates.lat},${l.coordinates.lng},${l.speed},${l.heading},${l.accuracy},"${l.timestamp}","${l.status}"`),
            )
            .join('\n');
        await fs.writeFile(path.join(exportDir, 'locations.csv'), locationsCSV);

        console.log(` CSV files exported to: ${exportDir}`);
    } catch (error) {
        console.error(' Error exporting CSV:', error);
    }
};

// Run the generator
if (require.main === module) {
    connectDB()
        .then(() => generateAllData())
        .then(() => {
            console.log('All done! Closing database connection...');
            process.exit(0);
        })
        .catch((error) => {
            console.error(' Fatal error:', error);
            process.exit(1);
        });
}

module.exports = { generateAllData, exportAsJSON, exportAsCSV };
