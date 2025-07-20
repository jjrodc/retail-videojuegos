const express = require('express');
const router = express.Router();
const { login, register } = require('../controllers/authController');

// Ruta para login
router.post('/login', login);

// Ruta para registro
router.post('/register', register);

module.exports = router;
