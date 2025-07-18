// Configuración de la API
const API_BASE_URL = 'http://localhost:3000/api';
let currentUser = null;
let authToken = null;

// Estado de la aplicación
const appState = {
    currentPage: 'dashboard',
    cart: [],
    products: [],
    inventory: []
};

// Utilidades
const utils = {
    formatCurrency: (amount) => {
        return new Intl.NumberFormat('es-EC', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    },
    
    formatDate: (date) => {
        return new Date(date).toLocaleDateString('es-EC');
    },
    
    showAlert: (message, type = 'success') => {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        alertDiv.textContent = message;
        
        const container = document.querySelector('.main-content');
        container.insertBefore(alertDiv, container.firstChild);
        
        setTimeout(() => {
            alertDiv.remove();
        }, 3000);
    },
    
    showError: (message) => {
        utils.showAlert(message, 'error');
    },
    
    showSuccess: (message) => {
        utils.showAlert(message, 'success');
    }
};

// API Functions
const api = {
    async request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...(authToken && { 'Authorization': `Bearer ${authToken}` })
            },
            ...options
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Error en la petición');
            }
            
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    // Auth
    async login(username, password) {
        return await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
    },

    // Products
    async getProducts() {
        return await this.request('/products');
    },

    async createProduct(productData) {
        return await this.request('/products', {
            method: 'POST',
            body: JSON.stringify(productData)
        });
    },

    async updateProduct(id, productData) {
        return await this.request(`/products/${id}`, {
            method: 'PUT',
            body: JSON.stringify(productData)
        });
    },

    async deleteProduct(id) {
        return await this.request(`/products/${id}`, {
            method: 'DELETE'
        });
    },

    // Inventory
    async getInventory(sucursalId = null) {
        const url = sucursalId ? `/inventory?sucursal=${sucursalId}` : '/inventory';
        return await this.request(url);
    },

    // Sales
    async createSale(saleData) {
        return await this.request('/sales', {
            method: 'POST',
            body: JSON.stringify(saleData)
        });
    },

    async getSales(filters = {}) {
        const params = new URLSearchParams(filters);
        return await this.request(`/sales?${params}`);
    },

    // Clients
    async getClients() {
        return await this.request('/clients');
    },

    async createClient(clientData) {
        return await this.request('/clients', {
            method: 'POST',
            body: JSON.stringify(clientData)
        });
    },

    // Dashboard
    async getDashboardStats() {
        return await this.request('/dashboard/stats');
    }
};

// Auth Management
const auth = {
    login: async (username, password) => {
        try {
            const response = await api.login(username, password);
            currentUser = response.user;
            authToken = response.token;
            
            // Guardar en sessionStorage
            sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
            sessionStorage.setItem('authToken', authToken);
            
            showDashboard();
            return true;
        } catch (error) {
            document.getElementById('loginError').textContent = error.message;
            document.getElementById('loginError').style.display = 'block';
            return false;
        }
    },

    logout: () => {
        currentUser = null;
        authToken = null;
        sessionStorage.removeItem('currentUser');
        sessionStorage.removeItem('authToken');
        showLogin();
    },

    checkAuth: () => {
        const savedUser = sessionStorage.getItem('currentUser');
        const savedToken = sessionStorage.getItem('authToken');
        
        if (savedUser && savedToken) {
            currentUser = JSON.parse(savedUser);
            authToken = savedToken;
            return true;
        }
        
        return false;
    }
};

// Page Management
const pages = {
    showLogin: () => {
        document.getElementById('loginPage').classList.add('active');
        document.getElementById('dashboardPage').classList.remove('active');
    },

    showDashboard: () => {
        document.getElementById('loginPage').classList.remove('active');
        document.getElementById('dashboardPage').classList.add('active');
        
        // Actualizar UI del usuario
        document.getElementById('userName').textContent = currentUser.nombre;
        
        // Cargar contenido inicial
        loadDashboardContent();
    },

    showContent: (contentId) => {
        // Ocultar todos los contenidos
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Mostrar el contenido seleccionado
        document.getElementById(contentId).classList.add('active');
        
        // Actualizar navegación
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        document.querySelector(`[href="#${contentId.replace('Content', '')}"]`).classList.add('active');
    }
};

// Dashboard Functions
const dashboard = {
    async loadStats() {
        try {
            const stats = await api.getDashboardStats();
            
            document.getElementById('ventasHoy').textContent = stats.ventasHoy || 0;
            document.getElementById('ingresosHoy').textContent = utils.formatCurrency(stats.ingresosHoy || 0);
            document.getElementById('stockBajo').textContent = stats.stockBajo || 0;
            document.getElementById('productosActivos').textContent = stats.productosActivos || 0;
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }
};

// Products Management
const products = {
    async loadProducts() {
        try {
            const products = await api.getProducts();
            appState.products = products;
            this.renderProductsTable(products);
        } catch (error) {
            utils.showError('Error cargando productos');
        }
    },

    renderProductsTable(products) {
        const container = document.getElementById('productsTable');
        
        if (!products || products.length === 0) {
            container.innerHTML = '<p class="text-center">No hay productos disponibles</p>';
            return;
        }

        const table = `
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Código</th>
                            <th>Nombre</th>
                            <th>Categoría</th>
                            <th>Precio</th>
                            <th>Stock</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${products.map(product => `
                            <tr>
                                <td>${product.codigo}</td>
                                <td>${product.nombre}</td>
                                <td>${product.categoria}</td>
                                <td>${utils.formatCurrency(product.precio)}</td>
                                <td>${product.stock_total || 0}</td>
                                <td class="actions">
                                    <button class="btn btn-sm btn-primary" onclick="products.editProduct(${product.id})">
                                        Editar
                                    </button>
                                    <button class="btn btn-sm btn-danger" onclick="products.deleteProduct(${product.id})">
                                        Eliminar
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        
        container.innerHTML = table;
    },

    async deleteProduct(id) {
        if (confirm('¿Estás seguro de que deseas eliminar este producto?')) {
            try {
                await api.deleteProduct(id);
                utils.showSuccess('Producto eliminado exitosamente');
                this.loadProducts();
            } catch (error) {
                utils.showError('Error eliminando producto');
            }
        }
    },

    editProduct(id) {
        // Implementar modal de edición
        alert('Funcionalidad de edición en desarrollo');
    }
};

// Sales/POS Management
const pos = {
    async loadPOSProducts() {
        try {
            const inventory = await api.getInventory(currentUser.sucursal_id);
            this.renderPOSProducts(inventory);
        } catch (error) {
            utils.showError('Error cargando productos para POS');
        }
    },

    renderPOSProducts(inventory) {
        const container = document.getElementById('posProducts');
        
        if (!inventory || inventory.length === 0) {
            container.innerHTML = '<p class="text-center">No hay productos disponibles</p>';
            return;
        }

        const productsHTML = inventory.map(item => `
            <div class="product-item" onclick="pos.addToCart(${item.producto_id}, '${item.nombre}', ${item.precio}, ${item.stock_actual})">
                <div class="product-info">
                    <h4>${item.nombre}</h4>
                    <p>${item.plataforma} - Stock: ${item.stock_actual}</p>
                </div>
                <div class="product-price">
                    ${utils.formatCurrency(item.precio)}
                </div>
            </div>
        `).join('');

        container.innerHTML = productsHTML;
    },

    addToCart(productId, nombre, precio, stock) {
        const existingItem = appState.cart.find(item => item.productId === productId);
        
        if (existingItem) {
            if (existingItem.cantidad < stock) {
                existingItem.cantidad += 1;
                existingItem.subtotal = existingItem.cantidad * existingItem.precio;
            } else {
                utils.showError('Stock insuficiente');
                return;
            }
        } else {
            appState.cart.push({
                productId,
                nombre,
                precio,
                cantidad: 1,
                subtotal: precio,
                stock
            });
        }

        this.renderCart();
    },

    removeFromCart(productId) {
        appState.cart = appState.cart.filter(item => item.productId !== productId);
        this.renderCart();
    },

    updateQuantity(productId, newQuantity) {
        const item = appState.cart.find(item => item.productId === productId);
        if (item) {
            if (newQuantity <= 0) {
                this.removeFromCart(productId);
            } else if (newQuantity <= item.stock) {
                item.cantidad = parseInt(newQuantity);
                item.subtotal = item.cantidad * item.precio;
                this.renderCart();
            } else {
                utils.showError('Cantidad excede el stock disponible');
            }
        }
    },

    renderCart() {
        const container = document.getElementById('cartItems');
        const totalContainer = document.getElementById('cartTotal');
        
        if (appState.cart.length === 0) {
            container.innerHTML = '<p class="text-center">Carrito vacío</p>';
            totalContainer.textContent = '0.00';
            return;
        }

        const cartHTML = appState.cart.map(item => `
            <div class="cart-item">
                <div class="cart-item-info">
                    <h4>${item.nombre}</h4>
                    <p>${utils.formatCurrency(item.precio)} c/u</p>
                </div>
                <div class="cart-item-controls">
                    <div class="qty-control">
                        <button class="btn btn-sm qty-btn" onclick="pos.updateQuantity(${item.productId}, ${item.cantidad - 1})">-</button>
                        <input type="number" class="qty-input" value="${item.cantidad}" 
                               onchange="pos.updateQuantity(${item.productId}, this.value)" min="1" max="${item.stock}">
                        <button class="btn btn-sm qty-btn" onclick="pos.updateQuantity(${item.productId}, ${item.cantidad + 1})">+</button>
                    </div>
                    <div class="subtotal">${utils.formatCurrency(item.subtotal)}</div>
                    <button class="btn btn-sm btn-danger" onclick="pos.removeFromCart(${item.productId})">×</button>
                </div>
            </div>
        `).join('');

        container.innerHTML = cartHTML;
        
        const total = appState.cart.reduce((sum, item) => sum + item.subtotal, 0);
        totalContainer.textContent = total.toFixed(2);
    },

    async processSale() {
        if (appState.cart.length === 0) {
            utils.showError('El carrito está vacío');
            return;
        }

        const saleData = {
            usuario_id: currentUser.id,
            sucursal_id: currentUser.sucursal_id,
            items: appState.cart.map(item => ({
                producto_id: item.productId,
                cantidad: item.cantidad,
                precio_unitario: item.precio,
                subtotal: item.subtotal
            })),
            total: appState.cart.reduce((sum, item) => sum + item.subtotal, 0),
            metodo_pago: 'efectivo' // Por ahora fijo
        };

        try {
            const response = await api.createSale(saleData);
            utils.showSuccess(`Venta procesada exitosamente. ID: ${response.venta_id}`);
            appState.cart = [];
            this.renderCart();
            
            // Recargar productos para actualizar stock
            this.loadPOSProducts();
        } catch (error) {
            utils.showError('Error procesando la venta');
        }
    }
};

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Login Form
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        await auth.login(username, password);
    });

    // Logout Button
    document.getElementById('logoutBtn').addEventListener('click', () => {
        auth.logout();
    });

    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = e.target.getAttribute('href').substring(1);
            loadPageContent(page);
        });
    });

    // Search functionality
    document.getElementById('searchProducts')?.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const filteredProducts = appState.products.filter(product => 
            product.nombre.toLowerCase().includes(query) || 
            product.codigo.toLowerCase().includes(query)
        );
        products.renderProductsTable(filteredProducts);
    });

    document.getElementById('searchPOS')?.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const productItems = document.querySelectorAll('.product-item');
        
        productItems.forEach(item => {
            const productName = item.querySelector('h4').textContent.toLowerCase();
            if (productName.includes(query)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    });

    // Process Sale Button
    document.getElementById('processSale')?.addEventListener('click', () => {
        pos.processSale();
    });

    // Check authentication on load
    if (auth.checkAuth()) {
        pages.showDashboard();
    } else {
        pages.showLogin();
    }
});

// Helper functions
function showLogin() {
    pages.showLogin();
}

function showDashboard() {
    pages.showDashboard();
}

function loadDashboardContent() {
    dashboard.loadStats();
}

function loadPageContent(page) {
    const contentId = page + 'Content';
    pages.showContent(contentId);
    
    // Cargar contenido específico de la página
    switch(page) {
        case 'products':
            products.loadProducts();
            break;
        case 'sales':
            pos.loadPOSProducts();
            break;
        case 'dashboard':
            dashboard.loadStats();
            break;
    }
}

// Global error handler
window.addEventListener('error', (e) => {
    console.error('Global error:', e.error);
    utils.showError('Ha ocurrido un error inesperado');
});

// Make functions globally available
window.pos = pos;
window.products = products;
window.utils = utils;