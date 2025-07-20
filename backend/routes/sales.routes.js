const express = require('express');
const router = express.Router();
const { createSale, getSales, getSaleDetail } = require('../controllers/salesController');
const { authenticateToken } = require('../middleware/auth');  // IMPORTA la función correcta

router.use(authenticateToken); // Usa la función middleware

router.post('/', createSale);
router.get('/', getSales);
router.get('/:id', getSaleDetail);

module.exports = router;
