const pool = require('../config/postgres');
const { getDB } = require('../config/mongodb');

const createSale = async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const { cliente_id, productos, metodos_pago, descuento = 0 } = req.body;
        const numeroVenta = `VTA-${Date.now()}`;
        let subtotal = 0;
        const productosValidos = [];

        for (const item of productos) {
            const { producto_id, plataforma_id, cantidad } = item;

            const inventoryCheck = await client.query(
                `SELECT i.*, p.precio 
                 FROM inventario i 
                 JOIN productos p ON i.producto_id = p.id 
                 WHERE i.producto_id = $1 AND i.plataforma_id = $2 AND i.sucursal_id = $3`,
                [producto_id, plataforma_id, req.user.sucursal_id]
            );

            if (inventoryCheck.rows.length === 0) {
                throw new Error(`Producto no encontrado en inventario`);
            }

            const inventory = inventoryCheck.rows[0];
            if (inventory.stock_actual < cantidad) {
                throw new Error(`Stock insuficiente para el producto ${inventory.producto_id}`);
            }

            const precio_unitario = inventory.precio;
            const subtotal_item = precio_unitario * cantidad;

            productosValidos.push({
                producto_id,
                plataforma_id,
                cantidad,
                precio_unitario,
                subtotal: subtotal_item,
                inventario_id: inventory.id
            });

            subtotal += subtotal_item;
        }

        const total = subtotal - descuento;
        const totalPagos = metodos_pago.reduce((sum, pago) => sum + pago.monto, 0);
        if (Math.abs(totalPagos - total) > 0.01) {
            throw new Error('El total de pagos no coincide con el total de la venta');
        }

        const ventaResult = await client.query(
            `INSERT INTO ventas (numero, cliente_id, sucursal_id, usuario_id, subtotal, descuento, total) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [numeroVenta, cliente_id, req.user.sucursal_id, req.user.id, subtotal, descuento, total]
        );
        const ventaId = ventaResult.rows[0].id;

        for (const item of productosValidos) {
            await client.query(
                `INSERT INTO detalle_ventas (venta_id, producto_id, plataforma_id, cantidad, precio_unitario, subtotal) 
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [ventaId, item.producto_id, item.plataforma_id, item.cantidad, item.precio_unitario, item.subtotal]
            );

            await client.query(
                `UPDATE inventario SET stock_actual = stock_actual - $1 WHERE id = $2`,
                [item.cantidad, item.inventario_id]
            );

            await client.query(
                `INSERT INTO movimientos_inventario (inventario_id, tipo, cantidad, referencia_id, usuario_id) 
                 VALUES ($1, 'salida', $2, $3, $4)`,
                [item.inventario_id, item.cantidad, ventaId, req.user.id]
            );
        }

        for (const pago of metodos_pago) {
            await client.query(
                `INSERT INTO pagos (venta_id, metodo, monto) VALUES ($1, $2, $3)`,
                [ventaId, pago.metodo, pago.monto]
            );
        }

        await client.query('COMMIT');

        if (cliente_id) {
            const db = getDB();
            await db.collection('historial_clientes').insertOne({
                cliente_id,
                venta_id: ventaId,
                numero_venta: numeroVenta,
                total,
                fecha: new Date(),
                sucursal_id: req.user.sucursal_id
            });
        }

        res.json({
            success: true,
            message: 'Venta creada exitosamente',
            venta: ventaResult.rows[0],
            numero_venta: numeroVenta
        });

    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
};

const getSales = async (req, res) => {
    try {
        const { fecha_inicio, fecha_fin, cliente_id, page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT v.*, u.nombre as vendedor_nombre, s.nombre as sucursal_nombre,
                   COUNT(dv.id) as total_items
            FROM ventas v
            JOIN usuarios u ON v.usuario_id = u.id
            JOIN sucursales s ON v.sucursal_id = s.id
            LEFT JOIN detalle_ventas dv ON v.id = dv.venta_id
            WHERE 1=1
        `;

        const params = [];
        let paramCount = 1;

        if (req.user.rol_nombre !== 'admin') {
            query += ` AND v.sucursal_id = $${paramCount}`;
            params.push(req.user.sucursal_id);
            paramCount++;
        }

        if (fecha_inicio) {
            query += ` AND v.fecha >= $${paramCount}`;
            params.push(fecha_inicio);
            paramCount++;
        }

        if (fecha_fin) {
            query += ` AND v.fecha <= $${paramCount}`;
            params.push(fecha_fin);
            paramCount++;
        }

        if (cliente_id) {
            query += ` AND v.cliente_id = $${paramCount}`;
            params.push(cliente_id);
            paramCount++;
        }

        query += ` GROUP BY v.id, u.nombre, s.nombre ORDER BY v.fecha DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
        params.push(limit, offset);

        const result = await pool.query(query, params);

        res.json({
            success: true,
            sales: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getSaleDetail = async (req, res) => {
    try {
        const { id } = req.params;

        const ventaQuery = await pool.query(
            `SELECT v.*, u.nombre as vendedor_nombre, s.nombre as sucursal_nombre 
             FROM ventas v 
             JOIN usuarios u ON v.usuario_id = u.id 
             JOIN sucursales s ON v.sucursal_id = s.id 
             WHERE v.id = $1`,
            [id]
        );

        if (ventaQuery.rows.length === 0) {
            return res.status(404).json({ error: 'Venta no encontrada' });
        }

        const detalleQuery = await pool.query(
            `SELECT dv.*, p.nombre as producto_nombre, p.codigo, pl.nombre as plataforma_nombre 
             FROM detalle_ventas dv 
             JOIN productos p ON dv.producto_id = p.id 
             JOIN plataformas pl ON dv.plataforma_id = pl.id 
             WHERE dv.venta_id = $1`,
            [id]
        );

        const pagosQuery = await pool.query(
            `SELECT * FROM pagos WHERE venta_id = $1`,
            [id]
        );

        res.json({
            success: true,
            venta: ventaQuery.rows[0],
            detalles: detalleQuery.rows,
            pagos: pagosQuery.rows
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    createSale,
    getSales,
    getSaleDetail
};
