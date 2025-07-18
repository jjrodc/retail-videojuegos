const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/postgres');
const { getDB } = require('../config/mongodb');

const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Buscar usuario
        const userQuery = await pool.query(
            'SELECT u.*, r.nombre as rol_nombre, s.nombre as sucursal_nombre FROM usuarios u JOIN roles r ON u.rol_id = r.id JOIN sucursales s ON u.sucursal_id = s.id WHERE u.username = $1 AND u.activo = true',
            [username]
        );

        if (userQuery.rows.length === 0) {
            return res.status(401).json({ error: 'Credenciales incorrectas' });
        }

        const user = userQuery.rows[0];

        // Verificar contraseña
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Credenciales incorrectas' });
        }

        // Generar token
        const token = jwt.sign(
            { userId: user.id, username: user.username, rol: user.rol_nombre },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        // Log de acceso
        const db = getDB();
        await db.collection('logs_sistema').insertOne({
            tipo: 'login',
            usuario_id: user.id,
            username: user.username,
            sucursal_id: user.sucursal_id,
            fecha: new Date()
        });

        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                username: user.username,
                nombre: user.nombre,
                rol: user.rol_nombre,
                sucursal: user.sucursal_nombre,
                sucursal_id: user.sucursal_id
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const register = async (req, res) => {
    try {
        const { username, password, nombre, rol_id, sucursal_id } = req.body;

        // Verificar si el usuario ya existe
        const existingUser = await pool.query(
            'SELECT id FROM usuarios WHERE username = $1',
            [username]
        );

        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'El usuario ya existe' });
        }

        // Encriptar contraseña
        const saltRounds = 10;
        const password_hash = await bcrypt.hash(password, saltRounds);

        // Crear usuario
        const newUser = await pool.query(
            'INSERT INTO usuarios (username, password_hash, nombre, rol_id, sucursal_id) VALUES ($1, $2, $3, $4, $5) RETURNING id, username, nombre',
            [username, password_hash, nombre, rol_id, sucursal_id]
        );

        res.json({
            success: true,
            message: 'Usuario creado exitosamente',
            user: newUser.rows[0]
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { login, register };