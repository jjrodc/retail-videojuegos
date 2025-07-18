const { MongoClient } = require('mongodb');
require('dotenv').config();

let db;

async function connectMongoDB() {
    try {
        const client = await MongoClient.connect(process.env.MONGODB_URI);
        db = client.db('retail_videojuegos');
        console.log('✅ MongoDB conectado');
        return db;
    } catch (error) {
        console.error('❌ Error conectando MongoDB:', error);
        process.exit(1);
    }
}

function getDB() {
    return db;
}

module.exports = { connectMongoDB, getDB };