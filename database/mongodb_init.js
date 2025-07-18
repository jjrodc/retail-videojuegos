

// Crear colecciones e índices
db.createCollection("clientes");
db.createCollection("historial_clientes");
db.createCollection("productos_detalle");
db.createCollection("reportes_diarios");
db.createCollection("logs_sistema");

// Crear índices
db.clientes.createIndex({ "cliente_id": 1 }, { unique: true });
db.clientes.createIndex({ "cedula": 1 }, { unique: true });
db.historial_clientes.createIndex({ "cliente_id": 1 });
db.productos_detalle.createIndex({ "producto_id": 1 });
db.reportes_diarios.createIndex({ "fecha": 1, "sucursal_id": 1 });

// Datos de ejemplo
db.clientes.insertOne({
    "cliente_id": "CLI001",
    "cedula": "1234567890",
    "nombre": "Juan Pérez",
    "telefono": "0987654321",
    "email": "juan@email.com",
    "direccion": "Av. Principal 123, Quito",
    "activo": true,
    "fecha_registro": new Date()
});

print("MongoDB inicializado correctamente");