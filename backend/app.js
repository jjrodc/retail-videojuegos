const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Rutas de prueba
app.get('/api/test', (req, res) => {
    res.json({ message: 'API funcionando correctamente' });
});

// Ruta para probar PostgreSQL
app.get('/api/test/postgres', async (req, res) => {
    try {
        const pool = require('./config/postgres');
        const result = await pool.query('SELECT NOW()');
        res.json({ 
            success: true, 
            postgres: 'conectado',
            timestamp: result.rows[0].now 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Ruta para probar MongoDB
app.get('/api/test/mongodb', async (req, res) => {
    try {
        const { getDB } = require('./config/mongodb');
        const db = getDB();
        const result = await db.admin().ping();
        res.json({ 
            success: true, 
            mongodb: 'conectado',
            ping: result 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

module.exports = app;