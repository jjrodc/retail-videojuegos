const { getDB } = require('../config/mongodb');

const getAllClients = async (req, res) => {
    try {
        const { page = 1, limit = 20, search = '' } = req.query;
        const skip = (page - 1) * limit;

        const db = getDB();
        let query = { activo: true };

        if (search) {
            query.$or = [
                { nombre: { $regex: search, $options: 'i' } },
                { cedula: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const clients = await db.collection('clientes')
            .find(query)
            .sort({ fecha_registro: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .toArray();

        const total = await db.collection('clientes').countDocuments(query);

        res.json({
            success: true,
            clients,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const createClient = async (req, res) => {
    try {
        const { cedula, nombre, telefono, email, direccion } = req.body;

        const db = getDB();

        // Verificar si ya existe
        const existingClient = await db.collection('clientes').findOne({
            $or: [{ cedula }, { email }]
        });

        if (existingClient) {
            return res.status(400).json({ error: 'Ya existe un cliente con esa cédula o email' });
        }

        // Generar ID único
        const clienteId = `CLI-${Date.now()}`;

        const newClient = {
            cliente_id: clienteId,
            cedula,
            nombre,
            telefono,
            email,
            direccion,
            activo: true,
            fecha_registro: new Date()
        };

        await db.collection('clientes').insertOne(newClient);

        res.json({
            success: true,
            message: 'Cliente creado exitosamente',
            client: newClient
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getClientHistory = async (req, res) => {
    try {
        const { cliente_id } = req.params;

        const db = getDB();
        
        // Obtener historial de compras
        const historial = await db.collection('historial_clientes')
            .find({ cliente_id })
            .sort({ fecha: -1 })
            .limit(50)
            .toArray();

        res.json({
            success: true,
            historial
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updateClient = async (req, res) => {
    try {
        const { cliente_id } = req.params;
        const { nombre, telefono, email, direccion } = req.body;

        const db = getDB();

        const result = await db.collection('clientes').updateOne(
            { cliente_id },
            { 
                $set: { 
                    nombre, 
                    telefono, 
                    email, 
                    direccion,
                    fecha_actualizacion: new Date()
                }
            }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }

        res.json({
            success: true,
            message: 'Cliente actualizado exitosamente'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { getAllClients, createClient, getClientHistory, updateClient };