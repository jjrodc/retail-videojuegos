const express = require('express');
const router = express.Router();
const {
    getAllClients,
    createClient,
    getClientHistory,
    updateClient
} = require('../controllers/clientController');

// Listar todos los clientes con paginación y búsqueda
router.get('/', getAllClients);

// Crear un nuevo cliente
router.post('/', createClient);

// Obtener historial de un cliente específico
router.get('/historial/:cliente_id', getClientHistory);

// Actualizar información de un cliente
router.put('/:cliente_id', updateClient);

module.exports = router;
