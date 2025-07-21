const express = require('express');
const router = express.Router();
const {
    getAllProducts,
    createProduct,
    updateProduct,
    deleteProduct
} = require('../controllers/productsController');

const { authenticateToken, authorize } = require('../middleware/auth'); // Ajusta la ruta a tu middleware

// Listar productos con detalles
router.get('/', getAllProducts);


// Primero autentica el token, luego autoriza solo al rol 'admin'.
router.post('/', authenticateToken, authorize(['admin']), createProduct); 

// 🔒 Actualizar producto (Ruta Protegida - solo Admin)
router.put('/:id', authenticateToken, authorize(['admin']), updateProduct); 

// 🔒 Eliminar producto (Ruta Protegida - solo Admin)
router.delete('/:id', authenticateToken, authorize(['admin']), deleteProduct);
module.exports = router;
