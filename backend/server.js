require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

// Middleware de autenticación (ejemplo simple)
const verifyToken = (req, res, next) => {
  // Aquí va tu lógica real de validación de token JWT u otro método
  // Por ahora dejamos pasar siempre:
  next();
};

// Importar routers
const clientsRouter = require('./routes/client.routes');
const inventoryRouter = require('./routes/inventory.routes');
const productsRouter = require('./routes/products.routes');
const salesRouter = require('./routes/sales.routes');
const reportsRouter = require('./routes/reports.routes');

const app = express();

// Middlewares
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});
