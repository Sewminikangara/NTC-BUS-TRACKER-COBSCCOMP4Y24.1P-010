const express = require('express');
const locationController = require('../controllers/locationController');
const { protect, restrictTo } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createLocationUpdateSchema, idParamSchema } = require('../utils/validationSchemas');

const router = express.Router();

router.get('/bus/:busId/latest', validate(idParamSchema), locationController.getLatestLocation);
router.get('/bus/:busId/history', validate(idParamSchema), locationController.getLocationHistory);
router.get('/bus/:busId/stats', validate(idParamSchema), locationController.getBusLocationStats);
router.get('/trip/:tripId', validate(idParamSchema), locationController.getLocationsByTrip);
router.get('/all-buses', locationController.getAllBusesLatestLocation);
router.get('/nearby', locationController.getNearbyBuses);

router.use(protect);

router.post('/', restrictTo('operator', 'admin'), validate(createLocationUpdateSchema), locationController.createLocationUpdate);

router.delete('/cleanup', restrictTo('admin'), locationController.cleanupOldLocations);

module.exports = router;
