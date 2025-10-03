const express = require('express');
const busController = require('../controllers/busController');
const { protect, restrictTo } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createBusSchema, updateBusSchema, idParamSchema } = require('../utils/validationSchemas');

const router = express.Router();

// Public routes
router.get('/', busController.getAllBuses);
router.get('/stats', busController.getBusStats);
router.get('/route/:routeId', validate(idParamSchema), busController.getBusesByRoute);
router.get('/operator/:operatorId', validate(idParamSchema), busController.getBusesByOperator);
router.get('/:id', validate(idParamSchema), busController.getBus);

// Protected routes (Admin/Operator)
router.use(protect);

router.get('/maintenance/due', restrictTo('admin', 'operator'), busController.getMaintenanceDue);

// Admin only routes
router.use(restrictTo('admin'));

router.post('/', validate(createBusSchema), busController.createBus);
router.put('/:id', validate(updateBusSchema), busController.updateBus);
router.delete('/:id', validate(idParamSchema), busController.deleteBus);

module.exports = router;