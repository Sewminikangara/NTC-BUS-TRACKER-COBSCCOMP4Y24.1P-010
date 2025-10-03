const express = require('express');
const tripController = require('../controllers/tripController');
const { protect, restrictTo } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createTripSchema, updateTripSchema, idParamSchema } = require('../utils/validationSchemas');

const router = express.Router();

// Public routes
router.get('/', tripController.getAllTrips);
router.get('/active', tripController.getActiveTrips);
router.get('/upcoming', tripController.getUpcomingTrips);
router.get('/stats', tripController.getTripStats);
router.get('/route/:routeId', validate(idParamSchema), tripController.getTripsByRoute);
router.get('/bus/:busId', validate(idParamSchema), tripController.getTripsByBus);
router.get('/:id', validate(idParamSchema), tripController.getTrip);

// Protected routes
router.use(protect);

// Operator and Admin can update trip status
router.patch('/:id', restrictTo('admin', 'operator'), tripController.patchTrip);
router.put('/:id', restrictTo('admin', 'operator'), validate(updateTripSchema), tripController.updateTrip);

// Admin only routes
router.post('/', restrictTo('admin'), validate(createTripSchema), tripController.createTrip);
router.delete('/:id', restrictTo('admin'), validate(idParamSchema), tripController.deleteTrip);

module.exports = router;