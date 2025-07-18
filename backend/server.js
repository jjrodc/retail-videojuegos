const app = require('./app');
const { connectMongoDB } = require('./config/mongodb');

const PORT = process.env.PORT || 3000;

async function startServer() {
    try {
        // Conectar MongoDB
        await connectMongoDB();
        
        // Iniciar servidor
        app.listen(PORT, () => {
            console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
            console.log(`📡 API disponible en http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('❌ Error iniciando servidor:', error);
        process.exit(1);
    }
}

startServer();