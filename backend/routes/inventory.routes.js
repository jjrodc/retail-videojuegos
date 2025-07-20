const express = require('express');
const router = express.Router();
const {
    getInventory,
    updateStock,
    getMovimientos
} = require('../controllers/inventoryController');

// Obtener el inventario filtrado por sucursal
router.get('/', getInventory);

// Actualizar el stock de un producto
router.put('/actualizar-stock', updateStock);

// Consultar movimientos de inventario (filtro por inventario_id, fecha_inicio, fecha_fin)
router.get('/movimientos', getMovimientos);

module.exports = router;
