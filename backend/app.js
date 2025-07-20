require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

// Importar middleware de autenticación (asumido que tienes uno)
const { verifyToken } = require('./middleware/auth');

// Importar routers
const clientsRouter = require('./routes/client.routes');
const inventoryRouter = require('./routes/inventory.routes');
const productsRouter = require('./routes/products.routes');
const salesRouter = require('./routes/sales.routes');
const reportsRouter = require('./routes/reports.routes');

const app = express();

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Rutas públicas (por ejemplo auth si tienes)
app.use('/api/auth', authRouter);

// Rutas protegidas con token
app.use('/api/clients', verifyToken, clientsRouter);
app.use('/api/inventory', verifyToken, inventoryRouter);
app.use('/api/products', verifyToken, productsRouter);
app.use('/api/sales', verifyToken, salesRouter);
app.use('/api/reports', verifyToken, reportsRouter);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
