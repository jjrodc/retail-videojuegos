-- CONFIGURACIÓN Y MAESTROS
CREATE TABLE sucursales (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    direccion TEXT NOT NULL,
    telefono VARCHAR(20),
    activo BOOLEAN DEFAULT true
);

CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) UNIQUE NOT NULL,
    permisos TEXT,
    activo BOOLEAN DEFAULT true
);

CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol_id INTEGER REFERENCES roles(id),
    sucursal_id INTEGER REFERENCES sucursales(id),
    nombre VARCHAR(100) NOT NULL,
    activo BOOLEAN DEFAULT true
);

CREATE TABLE parametros_sistema (
    id SERIAL PRIMARY KEY,
    clave VARCHAR(100) UNIQUE NOT NULL,
    valor TEXT NOT NULL,
    descripcion TEXT
);

-- CATÁLOGO DE PRODUCTOS
CREATE TABLE categorias (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) UNIQUE NOT NULL,
    activo BOOLEAN DEFAULT true
);

CREATE TABLE plataformas (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) UNIQUE NOT NULL,
    activo BOOLEAN DEFAULT true
);

CREATE TABLE desarrolladores (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(200) UNIQUE NOT NULL,
    activo BOOLEAN DEFAULT true
);

CREATE TABLE distribuidores (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    telefono VARCHAR(20),
    email VARCHAR(100),
    activo BOOLEAN DEFAULT true
);

CREATE TABLE productos (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    categoria_id INTEGER REFERENCES categorias(id),
    desarrollador_id INTEGER REFERENCES desarrolladores(id),
    precio DECIMAL(10,2) NOT NULL,
    activo BOOLEAN DEFAULT true
);

CREATE TABLE productos_plataformas (
    producto_id INTEGER REFERENCES productos(id),
    plataforma_id INTEGER REFERENCES plataformas(id),
    PRIMARY KEY (producto_id, plataforma_id)
);

-- INVENTARIO
CREATE TABLE inventario (
    id SERIAL PRIMARY KEY,
    producto_id INTEGER REFERENCES productos(id),
    sucursal_id INTEGER REFERENCES sucursales(id),
    plataforma_id INTEGER REFERENCES plataformas(id),
    stock_actual INTEGER NOT NULL DEFAULT 0,
    stock_minimo INTEGER NOT NULL DEFAULT 5,
    UNIQUE(producto_id, sucursal_id, plataforma_id)
);

CREATE TABLE movimientos_inventario (
    id SERIAL PRIMARY KEY,
    inventario_id INTEGER REFERENCES inventario(id),
    tipo VARCHAR(20) NOT NULL,
    cantidad INTEGER NOT NULL,
    referencia_id INTEGER,
    usuario_id INTEGER REFERENCES usuarios(id),
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TRANSACCIONES
CREATE TABLE ventas (
    id SERIAL PRIMARY KEY,
    numero VARCHAR(20) UNIQUE NOT NULL,
    cliente_id VARCHAR(50),
    sucursal_id INTEGER REFERENCES sucursales(id),
    usuario_id INTEGER REFERENCES usuarios(id),
    subtotal DECIMAL(10,2) NOT NULL,
    descuento DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE detalle_ventas (
    id SERIAL PRIMARY KEY,
    venta_id INTEGER REFERENCES ventas(id),
    producto_id INTEGER REFERENCES productos(id),
    plataforma_id INTEGER REFERENCES plataformas(id),
    cantidad INTEGER NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL
);

CREATE TABLE pagos (
    id SERIAL PRIMARY KEY,
    venta_id INTEGER REFERENCES ventas(id),
    metodo VARCHAR(20) NOT NULL,
    monto DECIMAL(10,2) NOT NULL
);

CREATE TABLE compras (
    id SERIAL PRIMARY KEY,
    numero VARCHAR(20) UNIQUE NOT NULL,
    distribuidor_id INTEGER REFERENCES distribuidores(id),
    sucursal_id INTEGER REFERENCES sucursales(id),
    usuario_id INTEGER REFERENCES usuarios(id),
    total DECIMAL(10,2) NOT NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE detalle_compras (
    id SERIAL PRIMARY KEY,
    compra_id INTEGER REFERENCES compras(id),
    producto_id INTEGER REFERENCES productos(id),
    plataforma_id INTEGER REFERENCES plataformas(id),
    cantidad INTEGER NOT NULL,
    costo_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL
);

CREATE TABLE devoluciones (
    id SERIAL PRIMARY KEY,
    numero VARCHAR(20) UNIQUE NOT NULL,
    venta_id INTEGER REFERENCES ventas(id),
    cliente_id VARCHAR(50),
    motivo VARCHAR(200) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    usuario_id INTEGER REFERENCES usuarios(id),
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE detalle_devoluciones (
    id SERIAL PRIMARY KEY,
    devolucion_id INTEGER REFERENCES devoluciones(id),
    producto_id INTEGER REFERENCES productos(id),
    plataforma_id INTEGER REFERENCES plataformas(id),
    cantidad INTEGER NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL
);

-- AUDITORÍA
CREATE TABLE auditoria (
    id SERIAL PRIMARY KEY,
    tabla VARCHAR(50) NOT NULL,
    accion VARCHAR(20) NOT NULL,
    registro_id INTEGER NOT NULL,
    usuario_id INTEGER REFERENCES usuarios(id),
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ÍNDICES
CREATE INDEX idx_ventas_fecha ON ventas(fecha);
CREATE INDEX idx_ventas_cliente ON ventas(cliente_id);
CREATE INDEX idx_inventario_producto ON inventario(producto_id);
CREATE INDEX idx_auditoria_fecha ON auditoria(fecha);