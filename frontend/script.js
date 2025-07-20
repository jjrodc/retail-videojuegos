
const API_BASE_URL = 'http://localhost:3000/api';
let authToken = null;

// Estado de la app
const appState = {
    carrito: [],
    usuario: null,
    productos: []
};

// Función: Login
async function login(username, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (!response.ok) {
            alert('Error al iniciar sesión: ' + data.error || data.message);
            return;
        }

        authToken = data.token;
        appState.usuario = data.user;
        alert(`Bienvenido ${appState.usuario.username}`);
        await cargarProductos();

    } catch (err) {
        console.error('Login Error:', err);
    }
}

// Función: Registro de usuario
async function registrarUsuario(datos) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });

        const data = await response.json();

        if (!response.ok) {
            alert('Error al registrar: ' + data.error || data.message);
            return;
        }

        alert('Usuario registrado correctamente. Ahora puedes iniciar sesión.');
    } catch (err) {
        console.error('Registro Error:', err);
    }
}

// Función: Cargar productos (GET)
async function cargarProductos() {
    try {
        const response = await fetch(`${API_BASE_URL}/productos`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        const productos = await response.json();
        appState.productos = productos;
        renderizarProductos();
    } catch (err) {
        console.error('Error al cargar productos:', err);
    }
}

// Función: Renderizar productos en la interfaz
function renderizarProductos() {
    const contenedor = document.getElementById('productos');
    contenedor.innerHTML = '';
    appState.productos.forEach(p => {
        const div = document.createElement('div');
        div.className = 'producto';
        div.innerHTML = `
            <h3>${p.nombre}</h3>
            <p>${p.descripcion}</p>
            <p>Precio: $${p.precio}</p>
            <button onclick="agregarAlCarrito('${p.id}')">Agregar</button>
        `;
        contenedor.appendChild(div);
    });
}

// Función: Agregar al carrito
function agregarAlCarrito(productoId) {
    const producto = appState.productos.find(p => p.id === productoId);
    if (producto) {
        appState.carrito.push(producto);
        alert(`Agregado ${producto.nombre} al carrito`);
    }
}

// Función: Confirmar venta
async function confirmarVenta() {
    try {
        const response = await fetch(`${API_BASE_URL}/ventas`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${authToken}`
            },
            body: JSON.stringify({
                productos: appState.carrito.map(p => ({ id: p.id, cantidad: 1 })) // puedes mejorar esto
            })
        });

        const data = await response.json();

        if (!response.ok) {
            alert('Error al registrar la venta: ' + data.error || data.message);
            return;
        }

        alert('Venta registrada con éxito.');
        appState.carrito = [];
    } catch (err) {
        console.error('Error al registrar venta:', err);
    }
}
