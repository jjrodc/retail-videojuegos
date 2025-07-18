

// Insertar clientes de prueba
db.clientes.insertMany([
    {
        cliente_id: "CLI001",
        cedula: "1234567890",
        nombre: "Juan Pérez",
        telefono: "0987654321",
        email: "juan@email.com",
        direccion: "Av. Principal 123, Quito",
        activo: true,
        fecha_registro: new Date()
    },
    {
        cliente_id: "CLI002",
        cedula: "0987654321",
        nombre: "María García",
        telefono: "0912345678",
        email: "maria@email.com",
        direccion: "Calle Secundaria 456, Quito",
        activo: true,
        fecha_registro: new Date()
    },
    {
        cliente_id: "CLI003",
        cedula: "1122334455",
        nombre: "Carlos López",
        telefono: "0998877665",
        email: "carlos@email.com",
        direccion: "Av. Amazonas 789, Quito",
        activo: true,
        fecha_registro: new Date()
    }
]);

// Insertar detalles de productos
db.productos_detalle.insertMany([
    {
        producto_id: 1,
        descripcion: "God of War Ragnarök es la secuela del aclamado God of War (2018). Acompaña a Kratos y Atreus en una aventura épica a través de los Nueve Reinos mientras se preparan para la batalla profetizada que pondrá fin al mundo.",
        especificaciones: {
            genero: "Acción/Aventura",
            clasificacion: "M (Mature 17+)",
            jugadores: "1 jugador",
            idiomas: ["Español", "Inglés", "Francés"],
            tamano_gb: 90,
            requisitos_minimos: "PlayStation 4 o superior"
        },
        imagenes: [
            "https://example.com/gow_ragnarok_cover.jpg",
            "https://example.com/gow_ragnarok_screenshot1.jpg"
        ],
        fecha_creacion: new Date()
    },
    {
        producto_id: 2,
        descripcion: "FIFA 23 trae el juego de fútbol más auténtico del mundo con tecnología HyperMotion2 y más de 19,000 jugadores auténticos en más de 700 equipos.",
        especificaciones: {
            genero: "Deportes",
            clasificacion: "E (Everyone)",
            jugadores: "1-4 jugadores local, multijugador online",
            idiomas: ["Español", "Inglés", "Portugués"],
            tamano_gb: 40,
            requisitos_minimos: "Conexión a internet requerida"
        },
        imagenes: [
            "https://example.com/fifa23_cover.jpg",
            "https://example.com/fifa23_gameplay.jpg"
        ],
        fecha_creacion: new Date()
    }
]);

print("Datos de prueba insertados en MongoDB");