const express = require('express');
const router = express.Router();

router.post('/', (req, res) => {
    res.status(200).json({ status: 'success', message: 'Location endpoints - In progress' });
});

module.exports = router;
