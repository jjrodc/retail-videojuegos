// server.js
const app = require('./app');
const { connectMongoDB } = require('./config/mongodb');
const pool = require('./config/postgres'); // tu conexión a Postgres

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Conectar a MongoDB
    await connectMongoDB();
    console.log('✅ MongoDB conectado');

    // Probar conexión a Postgres
    await pool.query('SELECT NOW()');
    console.log('✅ PostgreSQL conectado');

    // Iniciar servidor solo si las dos conexiones fueron exitosas
    app.listen(PORT, () => {
      console.log(`Servidor escuchando en puerto ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
}

startServer();
