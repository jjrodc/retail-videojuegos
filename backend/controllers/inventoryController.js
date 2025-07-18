const pool = require('../config/postgres');

const getInventory = async (req, res) => {
    try {
        const { sucursal_id } = req.query;
        const userSucursalId = req.user.sucursal_id;

        // Si no es admin, solo puede ver su sucursal
        const finalSucursalId = req.user.rol_nombre === 'admin' ? 
            (sucursal_id || userSucursalId) : userSucursalId;

        const query = `
            SELECT i.*, p.nombre as producto_nombre, p.codigo, p.precio,
                   pl.nombre as plataforma_nombre, s.nombre as sucursal_nombre,
                   CASE 
                       WHEN i.stock_actual <= i.stock_minimo THEN 'bajo'
                       WHEN i.stock_actual = 0 THEN 'agotado'
                       ELSE 'normal'
                   END as estado_stock
            FROM inventario i
            JOIN productos p ON i.producto_id = p.id
            JOIN plataformas pl ON i.plataforma_id = pl.id
            JOIN sucursales s ON i.sucursal_id = s.id
            WHERE i.sucursal_id = $1 AND p.activo = true
            ORDER BY p.nombre, pl.nombre
        `;

        const result = await pool.query(query, [finalSucursalId]);

        res.json({
            success: true,
            inventory: result.rows
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updateStock = async (req, res) => {
    try {
        const { inventario_id, cantidad, tipo, referencia } = req.body;

        // Validar inventario existe
        const inventoryCheck = await pool.query(
            'SELECT * FROM inventario WHERE id = $1',
            [inventario_id]
        );

        if (inventoryCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Inventario no encontrado' });
        }

        const currentStock = inventoryCheck.rows[0].stock_actual;
        let newStock;

        // Calcular nuevo stock según tipo de movimiento
        switch (tipo) {
            case 'entrada':
                newStock = currentStock + cantidad;
                break;
            case 'salida':
                newStock = currentStock - cantidad;
                if (newStock < 0) {
                    return res.status(400).json({ error: 'Stock insuficiente' });
                }
                break;
            case 'ajuste':
                newStock = cantidad;
                break;
            default:
                return res.status(400).json({ error: 'Tipo de movimiento inválido' });
        }

        // Actualizar stock
        await pool.query(
            'UPDATE inventario SET stock_actual = $1 WHERE id = $2',
            [newStock, inventario_id]
        );

        // Registrar movimiento
        await pool.query(
            'INSERT INTO movimientos_inventario (inventario_id, tipo, cantidad, referencia_id, usuario_id) VALUES ($1, $2, $3, $4, $5)',
            [inventario_id, tipo, cantidad, referencia, req.user.id]
        );

        res.json({
            success: true,
            message: 'Stock actualizado exitosamente',
            nuevo_stock: newStock
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getMovimientos = async (req, res) => {
    try {
        const { inventario_id, fecha_inicio, fecha_fin } = req.query;

        let query = `
            SELECT m.*, p.nombre as producto_nombre, pl.nombre as plataforma_nombre,
                   u.nombre as usuario_nombre
            FROM movimientos_inventario m
            JOIN inventario i ON m.inventario_id = i.id
            JOIN productos p ON i.producto_id = p.id
            JOIN plataformas pl ON i.plataforma_id = pl.id
            JOIN usuarios u ON m.usuario_id = u.id
            WHERE 1=1
        `;

        const params = [];
        let paramCount = 1;

        if (inventario_id) {
            query += ` AND m.inventario_id = $${paramCount}`;
            params.push(inventario_id);
            paramCount++;
        }

        if (fecha_inicio) {
            query += ` AND m.fecha >= $${paramCount}`;
            params.push(fecha_inicio);
            paramCount++;
        }

        if (fecha_fin) {
            query += ` AND m.fecha <= $${paramCount}`;
            params.push(fecha_fin);
            paramCount++;
        }

        query += ' ORDER BY m.fecha DESC LIMIT 100';

        const result = await pool.query(query, params);

        res.json({
            success: true,
            movimientos: result.rows
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { getInventory, updateStock, getMovimientos };