const express = require('express');
const operatorController = require('../controllers/operatorController');
const { protect, restrictTo } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createOperatorSchema, updateOperatorSchema, idParamSchema } = require('../utils/validationSchemas');

const router = express.Router();

// Public routes
router.get('/stats', operatorController.getOperatorStats);
router.get('/', operatorController.getAllOperators);
router.get('/:id', validate(idParamSchema), operatorController.getOperator);

// Protected routes (Admin only)
router.use(protect);
router.use(restrictTo('admin'));

router.get('/licenses/expired', operatorController.getExpiredLicenses);
router.get('/licenses/expiring-soon', operatorController.getExpiringLicenses);
router.post('/', validate(createOperatorSchema), operatorController.createOperator);
router.put('/:id', validate(updateOperatorSchema), operatorController.updateOperator);
router.delete('/:id', validate(idParamSchema), operatorController.deleteOperator);

module.exports = router;