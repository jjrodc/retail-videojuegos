const pool = require('../config/postgres');
const { getDB } = require('../config/mongodb');

const getSalesReport = async (req, res) => {
    try {
        const { fecha_inicio, fecha_fin, sucursal_id, tipo = 'diario' } = req.query;
        const userSucursalId = req.user.sucursal_id;

        // Determinar sucursal final
        const finalSucursalId = req.user.rol_nombre === 'admin' ? 
            (sucursal_id || userSucursalId) : userSucursalId;

        let groupBy, dateFormat;
        switch (tipo) {
            case 'diario':
                groupBy = 'DATE(v.fecha)';
                dateFormat = 'YYYY-MM-DD';
                break;
            case 'semanal':
                groupBy = 'DATE_TRUNC(\'week\', v.fecha)';
                dateFormat = 'YYYY-"W"WW';
                break;
            case 'mensual':
                groupBy = 'DATE_TRUNC(\'month\', v.fecha)';
                dateFormat = 'YYYY-MM';
                break;
            default:
                groupBy = 'DATE(v.fecha)';
                dateFormat = 'YYYY-MM-DD';
        }

        const query = `
            SELECT 
                ${groupBy} as periodo,
                COUNT(*) as total_ventas,
                SUM(v.total) as total_ingresos,
                AVG(v.total) as venta_promedio,
                SUM(dv.cantidad) as items_vendidos
            FROM ventas v
            JOIN detalle_ventas dv ON v.id = dv.venta_id
            WHERE v.sucursal_id = $1
            AND v.fecha >= $2 AND v.fecha <= $3
            GROUP BY ${groupBy}
            ORDER BY periodo DESC
        `;

        const result = await pool.query(query, [finalSucursalId, fecha_inicio, fecha_fin]);

        // Productos más vendidos
        const topProductsQuery = `
            SELECT 
                p.nombre as producto,
                pl.nombre as plataforma,
                SUM(dv.cantidad) as cantidad_vendida,
                SUM(dv.subtotal) as total_ventas
            FROM detalle_ventas dv
            JOIN ventas v ON dv.venta_id = v.id
            JOIN productos p ON dv.producto_id = p.id
            JOIN plataformas pl ON dv.plataforma_id = pl.id
            WHERE v.sucursal_id = $1
            AND v.fecha >= $2 AND v.fecha <= $3
            GROUP BY p.nombre, pl.nombre
            ORDER BY cantidad_vendida DESC
            LIMIT 10
        `;

        const topProducts = await pool.query(topProductsQuery, [finalSucursalId, fecha_inicio, fecha_fin]);

        res.json({
            success: true,
            reporte: {
                periodo: { inicio: fecha_inicio, fin: fecha_fin },
                tipo,
                ventas_por_periodo: result.rows,
                productos_mas_vendidos: topProducts.rows
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getInventoryReport = async (req, res) => {
    try {
        const { sucursal_id } = req.query;
        const userSucursalId = req.user.sucursal_id;

        const finalSucursalId = req.user.rol_nombre === 'admin' ? 
            (sucursal_id || userSucursalId) : userSucursalId;

        // Productos con stock bajo
        const stockBajoQuery = `
            SELECT 
                p.nombre as producto,
                pl.nombre as plataforma,
                i.stock_actual,
                i.stock_minimo,
                p.precio
            FROM inventario i
            JOIN productos p ON i.producto_id = p.id
            JOIN plataformas pl ON i.plataforma_id = pl.id
            WHERE i.sucursal_id = $1
            AND i.stock_actual <= i.stock_minimo
            ORDER BY i.stock_actual ASC
        `;

        const stockBajo = await pool.query(stockBajoQuery, [finalSucursalId]);

        // Productos sin stock
        const sinStockQuery = `
            SELECT 
                p.nombre as producto,
                pl.nombre as plataforma,
                i.stock_actual,
                p.precio
            FROM inventario i
            JOIN productos p ON i.producto_id = p.id
            JOIN plataformas pl ON i.plataforma_id = pl.id
            WHERE i.sucursal_id = $1
            AND i.stock_actual = 0
            ORDER BY p.nombre
        `;

        const sinStock = await pool.query(sinStockQuery, [finalSucursalId]);

        // Valor total del inventario
        const valorInventarioQuery = `
            SELECT 
                SUM(i.stock_actual * p.precio) as valor_total,
                COUNT(*) as total_items
            FROM inventario i
            JOIN productos p ON i.producto_id = p.id
            WHERE i.sucursal_id = $1
        `;

        const valorInventario = await pool.query(valorInventarioQuery, [finalSucursalId]);

        res.json({
            success: true,
            reporte: {
                productos_stock_bajo: stockBajo.rows,
                productos_sin_stock: sinStock.rows,
                valor_inventario: valorInventario.rows[0],
                resumen: {
                    total_productos_bajo_stock: stockBajo.rows.length,
                    total_productos_sin_stock: sinStock.rows.length
                }
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getDashboard = async (req, res) => {
    try {
        const userSucursalId = req.user.sucursal_id;
        const hoy = new Date().toISOString().split('T')[0];

        // Ventas del día
        const ventasHoyQuery = `
            SELECT 
                COUNT(*) as total_ventas,
                COALESCE(SUM(total), 0) as total_ingresos
            FROM ventas 
            WHERE sucursal_id = $1 
            AND DATE(fecha) = $2
        `;

        const ventasHoy = await pool.query(ventasHoyQuery, [userSucursalId, hoy]);

        // Productos con stock bajo
        const stockBajoQuery = `
            SELECT COUNT(*) as productos_stock_bajo
            FROM inventario i
            JOIN productos p ON i.producto_id = p.id
            WHERE i.sucursal_id = $1
            AND i.stock_actual <= i.stock_minimo
            AND p.activo = true
        `;

        const stockBajo = await pool.query(stockBajoQuery, [userSucursalId]);

        // Ventas de la semana
        const ventasSemanaQuery = `
            SELECT 
                DATE(fecha) as fecha,
                COUNT(*) as ventas,
                SUM(total) as ingresos
            FROM ventas 
            WHERE sucursal_id = $1 
            AND fecha >= CURRENT_DATE - INTERVAL '7 days'
            GROUP BY DATE(fecha)
            ORDER BY fecha
        `;

        const ventasSemana = await pool.query(ventasSemanaQuery, [userSucursalId]);

        // Top 5 productos más vendidos del mes
        const topProductosQuery = `
            SELECT 
                p.nombre as producto,
                pl.nombre as plataforma,
                SUM(dv.cantidad) as cantidad_vendida
            FROM detalle_ventas dv
            JOIN ventas v ON dv.venta_id = v.id
            JOIN productos p ON dv.producto_id = p.id
            JOIN plataformas pl ON dv.plataforma_id = pl.id
            WHERE v.sucursal_id = $1
            AND v.fecha >= DATE_TRUNC('month', CURRENT_DATE)
            GROUP BY p.nombre, pl.nombre
            ORDER BY cantidad_vendida DESC
            LIMIT 5
        `;

        const topProductos = await pool.query(topProductosQuery, [userSucursalId]);

        res.json({
            success: true,
            dashboard: {
                ventas_hoy: ventasHoy.rows[0],
                productos_stock_bajo: stockBajo.rows[0].productos_stock_bajo,
                ventas_semana: ventasSemana.rows,
                top_productos_mes: topProductos.rows
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { getSalesReport, getInventoryReport, getDashboard };