// app.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

// Middleware de autenticación (aquí puedes poner la lógica real luego)
const verifyToken = (req, res, next) => {
  next();
};

// Importar routers
const clientsRouter = require('./routes/client.routes');
const inventoryRouter = require('./routes/inventory.routes');
const productsRouter = require('./routes/products.routes');
const salesRouter = require('./routes/sales.routes');
const reportsRouter = require('./routes/reports.routes');
const authRouter = require('./routes/auth.routes'); // <-- Agrega esta línea

const app = express();

// Middlewares
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Rutas de autenticación (no requieren token)
app.use('/api/auth', authRouter); // <-- Muy importante

// Rutas protegidas
app.use('/api/clients', verifyToken, clientsRouter);
app.use('/api/inventory', verifyToken, inventoryRouter);
app.use('/api/products', verifyToken, productsRouter);
app.use('/api/sales', verifyToken, salesRouter);
app.use('/api/reports', verifyToken, reportsRouter);

// Ruta raíz
app.get('/', (req, res) => {
  res.send('API de Retail Videojuegos funcionando');
});

module.exports = app;
