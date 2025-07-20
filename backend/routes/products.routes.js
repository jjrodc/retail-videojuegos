const express = require('express');
const router = express.Router();
const {
    getAllProducts,
    createProduct,
    updateProduct,
    deleteProduct
} = require('../controllers/productsController');

// Listar productos con detalles
router.get('/', getAllProducts);

// Crear un producto
router.post('/', createProduct);

// Actualizar producto
router.put('/:id', updateProduct);

// Eliminar (soft delete)
router.delete('/:id', deleteProduct);

module.exports = router;
