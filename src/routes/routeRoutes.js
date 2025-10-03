const express = require('express');
const routeController = require('../controllers/routeController');
const { protect, restrictTo } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createRouteSchema, updateRouteSchema, idParamSchema } = require('../utils/validationSchemas');

const router = express.Router();

// Public routes
router.get('/', routeController.getAllRoutes);
router.get('/search', routeController.searchRoutes);
router.get('/stats', routeController.getRouteStats);
router.get('/:id', validate(idParamSchema), routeController.getRoute);

// Protected routes (Admin only)
router.use(protect);
router.use(restrictTo('admin'));

router.post('/', validate(createRouteSchema), routeController.createRoute);
router.put('/:id', validate(updateRouteSchema), routeController.updateRoute);
router.delete('/:id', validate(idParamSchema), routeController.deleteRoute);

module.exports = router;