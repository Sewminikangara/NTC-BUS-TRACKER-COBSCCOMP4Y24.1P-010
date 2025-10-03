const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.status(200).json({ status: 'success', message: 'Operator endpoints - In progress' });
});

module.exports = router;
