const jwt = require('jsonwebtoken');
const pool = require('../config/postgres');

const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Token requerido' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userQuery = await pool.query(
            'SELECT u.*, r.nombre as rol_nombre FROM usuarios u JOIN roles r ON u.rol_id = r.id WHERE u.id = $1 AND u.activo = true',
            [decoded.userId]
        );

        if (userQuery.rows.length === 0) {
            return res.status(403).json({ error: 'Usuario no válido' });
        }

        req.user = userQuery.rows[0];
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Token inválido' });
    }
};

const authorize = (roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.rol_nombre)) {
            return res.status(403).json({ error: 'No tienes permisos suficientes' });
        }
        next();
    };
};

module.exports = { authenticateToken, authorize };