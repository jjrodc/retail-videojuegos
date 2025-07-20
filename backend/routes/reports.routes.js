const express = require('express');
const router = express.Router();
const { getSalesReport, getInventoryReport, getDashboard } = require('../controllers/reportsController');
const { authenticateToken } = require('../middleware/auth'); // Importa sólo authenticateToken

// Proteger rutas con autenticación
router.use(authenticateToken);

// Rutas de reportes
router.get('/ventas', getSalesReport);
router.get('/inventario', getInventoryReport);
router.get('/dashboard', getDashboard);

module.exports = router;
