const express = require('express');
const router = express.Router();

// Importar controladores
const authController = require('../controllers/authController');
const productsController = require('../controllers/productsController');
const inventoryController = require('../controllers/inventoryController');
const salesController = require('../controllers/salesController');
const clientsController = require('../controllers/clientsController');
const reportsController = require('../controllers/reportsController');

// Importar middlewares
const { authenticateToken, authorize } = require('../middleware/auth');

// Rutas públicas
router.post('/auth/login', authController.login);

// Rutas protegidas
router.use(authenticateToken);

// Rutas de productos
router.get('/products', productsController.getAllProducts);
router.post('/products', authorize(['admin', 'manager']), productsController.createProduct);
router.put('/products/:id', authorize(['admin', 'manager']), productsController.updateProduct);
router.delete('/products/:id', authorize(['admin']), productsController.deleteProduct);

// Rutas de inventario
router.get('/inventory', inventoryController.getInventory);
router.post('/inventory/update-stock', authorize(['admin', 'manager']), inventoryController.updateStock);
router.get('/inventory/movements', inventoryController.getMovimientos);

// Rutas de ventas
router.post('/sales', salesController.createSale);
router.get('/sales', salesController.getSales);
router.get('/sales/:id', salesController.getSaleDetail);

// Rutas de clientes
router.get('/clients', clientsController.getAllClients);
router.post('/clients', clientsController.createClient);
router.get('/clients/:cliente_id/history', clientsController.getClientHistory);
router.put('/clients/:cliente_id', clientsController.updateClient);

// Rutas de reportes
router.get('/reports/sales', authorize(['admin', 'manager']), reportsController.getSalesReport);
router.get('/reports/inventory', authorize(['admin', 'manager']), reportsController.getInventoryReport);
router.get('/reports/dashboard', reportsController.getDashboard);

// Rutas de administración
router.post('/auth/register', authorize(['admin']), authController.register);

module.exports = router;