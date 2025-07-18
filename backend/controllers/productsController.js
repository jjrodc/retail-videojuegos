const pool = require('../config/postgres');
const { getDB } = require('../config/mongodb');

const getAllProducts = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', categoria = '', plataforma = '' } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT p.*, c.nombre as categoria_nombre, d.nombre as desarrollador_nombre,
                   array_agg(DISTINCT pl.nombre) as plataformas
            FROM productos p
            LEFT JOIN categorias c ON p.categoria_id = c.id
            LEFT JOIN desarrolladores d ON p.desarrollador_id = d.id
            LEFT JOIN productos_plataformas pp ON p.id = pp.producto_id
            LEFT JOIN plataformas pl ON pp.plataforma_id = pl.id
            WHERE p.activo = true
        `;

        const params = [];
        let paramCount = 1;

        if (search) {
            query += ` AND p.nombre ILIKE $${paramCount}`;
            params.push(`%${search}%`);
            paramCount++;
        }

        if (categoria) {
            query += ` AND c.nombre = $${paramCount}`;
            params.push(categoria);
            paramCount++;
        }

        query += ` GROUP BY p.id, c.nombre, d.nombre ORDER BY p.nombre LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
        params.push(limit, offset);

        const result = await pool.query(query, params);

        // Obtener detalles adicionales de MongoDB
        const db = getDB();
        const productsWithDetails = await Promise.all(
            result.rows.map(async (product) => {
                const details = await db.collection('productos_detalle').findOne({
                    producto_id: product.id
                });
                return { ...product, detalles: details };
            })
        );

        res.json({
            success: true,
            products: productsWithDetails,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: result.rows.length
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const createProduct = async (req, res) => {
    try {
        const { 
            codigo, nombre, categoria_id, desarrollador_id, precio, 
            plataformas, descripcion, especificaciones, imagenes 
        } = req.body;

        // Verificar si el código ya existe
        const existingProduct = await pool.query(
            'SELECT id FROM productos WHERE codigo = $1',
            [codigo]
        );

        if (existingProduct.rows.length > 0) {
            return res.status(400).json({ error: 'El código del producto ya existe' });
        }

        // Crear producto en PostgreSQL
        const newProduct = await pool.query(
            'INSERT INTO productos (codigo, nombre, categoria_id, desarrollador_id, precio) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [codigo, nombre, categoria_id, desarrollador_id, precio]
        );

        const productId = newProduct.rows[0].id;

        // Asociar plataformas
        if (plataformas && plataformas.length > 0) {
            const platformQueries = plataformas.map(plataforma_id => 
                pool.query(
                    'INSERT INTO productos_plataformas (producto_id, plataforma_id) VALUES ($1, $2)',
                    [productId, plataforma_id]
                )
            );
            await Promise.all(platformQueries);
        }

        // Guardar detalles en MongoDB
        const db = getDB();
        await db.collection('productos_detalle').insertOne({
            producto_id: productId,
            descripcion: descripcion || '',
            especificaciones: especificaciones || {},
            imagenes: imagenes || [],
            fecha_creacion: new Date()
        });

        res.json({
            success: true,
            message: 'Producto creado exitosamente',
            product: newProduct.rows[0]
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, categoria_id, desarrollador_id, precio, plataformas, descripcion, especificaciones, imagenes } = req.body;

        // Actualizar en PostgreSQL
        const updatedProduct = await pool.query(
            'UPDATE productos SET nombre = $1, categoria_id = $2, desarrollador_id = $3, precio = $4 WHERE id = $5 RETURNING *',
            [nombre, categoria_id, desarrollador_id, precio, id]
        );

        if (updatedProduct.rows.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        // Actualizar plataformas
        if (plataformas) {
            await pool.query('DELETE FROM productos_plataformas WHERE producto_id = $1', [id]);
            
            if (plataformas.length > 0) {
                const platformQueries = plataformas.map(plataforma_id => 
                    pool.query(
                        'INSERT INTO productos_plataformas (producto_id, plataforma_id) VALUES ($1, $2)',
                        [id, plataforma_id]
                    )
                );
                await Promise.all(platformQueries);
            }
        }

        // Actualizar detalles en MongoDB
        const db = getDB();
        await db.collection('productos_detalle').updateOne(
            { producto_id: parseInt(id) },
            { 
                $set: {
                    descripcion: descripcion || '',
                    especificaciones: especificaciones || {},
                    imagenes: imagenes || [],
                    fecha_actualizacion: new Date()
                }
            },
            { upsert: true }
        );

        res.json({
            success: true,
            message: 'Producto actualizado exitosamente',
            product: updatedProduct.rows[0]
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        // Soft delete en PostgreSQL
        const deletedProduct = await pool.query(
            'UPDATE productos SET activo = false WHERE id = $1 RETURNING *',
            [id]
        );

        if (deletedProduct.rows.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        res.json({
            success: true,
            message: 'Producto eliminado exitosamente'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { getAllProducts, createProduct, updateProduct, deleteProduct };