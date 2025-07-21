/**
 * Retail Videojuegos - Admin Panel Logic
 * This script manages the entire admin dashboard, including authentication,
 * page navigation, data fetching from the API, and rendering content.
 */

const { updateProduct } = require("../../backend/controllers/productsController");

document.addEventListener('DOMContentLoaded', () => {

    // --- CONFIG & STATE ---
    const API_BASE_URL = 'http://localhost:3000/api';
    let currentUser = null;
    let authToken = null;

    const appState = {
        products: [],
        cart: [],
    };

    // --- DOM ELEMENTS ---
    const loginPage = document.getElementById('loginPage');
    const dashboardPage = document.getElementById('dashboardPage');
    const loginForm = document.getElementById('loginForm');
    const logoutBtn = document.getElementById('logoutBtn');
    const userNameEl = document.getElementById('userName');
    const loginErrorEl = document.getElementById('loginError');
    const mainContent = document.querySelector('.main-content');
    const navLinks = document.querySelectorAll('.nav-link');
    
    // Modal Elements
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    const modalClose = document.getElementById('modalClose');

    // --- UTILITY & HELPER FUNCTIONS ---

    const utils = {
        formatCurrency: (amount) => new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(amount),
        showModal: (title, content) => {
            modalTitle.textContent = title;
            modalBody.innerHTML = ''; // Clear previous content
            if (typeof content === 'string') {
                modalBody.innerHTML = content;
            } else {
                modalBody.appendChild(content);
            }
            modal.classList.remove('hidden');
        },
        hideModal: () => modal.classList.add('hidden'),
        showConfirm: (title, message) => {
            return new Promise((resolve) => {
                const content = document.createElement('div');
                content.innerHTML = `<p>${message}</p>`;
                const buttonContainer = document.createElement('div');
                buttonContainer.style.marginTop = '1.5rem';
                buttonContainer.style.textAlign = 'right';

                const confirmBtn = document.createElement('button');
                confirmBtn.textContent = 'Confirmar';
                confirmBtn.className = 'btn btn-primary';
                confirmBtn.onclick = () => {
                    utils.hideModal();
                    resolve(true);
                };

                const cancelBtn = document.createElement('button');
                cancelBtn.textContent = 'Cancelar';
                cancelBtn.className = 'btn';
                cancelBtn.style.marginLeft = '0.5rem';
                cancelBtn.onclick = () => {
                    utils.hideModal();
                    resolve(false);
                };

                buttonContainer.append(cancelBtn, confirmBtn);
                content.appendChild(buttonContainer);
                utils.showModal(title, content);
            });
        }
    };

    // --- API ABSTRACTION ---
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
                if (!response.ok) throw new Error(data.error || 'Error en la petición');
                return data;
            } catch (error) {
                console.error('API Error:', error);
                throw error;
            }
        },
        login: (username, password) => api.request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
        getProducts: () => api.request('/products/'),
        updateProduct:() => api.request('/products/'),
        deleteProduct: (id) => api.request(`/products/${id}`, { method: 'DELETE' }),
        getInventory: (sucursalId) => api.request(`/inventory?sucursal=${sucursalId}`),
        createSale: (saleData) => api.request('/sales', { method: 'POST', body: JSON.stringify(saleData) }),
        getDashboardStats: () => api.request('/dashboard/stats')
    };

    // --- AUTHENTICATION ---
    const auth = {
        login: async (username, password) => {
            try {
                loginErrorEl.style.display = 'none';
                const response = await api.login(username, password);
                currentUser = response.user;
                authToken = response.token;
                sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
                sessionStorage.setItem('authToken', authToken);
                pages.showDashboard();
            } catch (error) {
                loginErrorEl.textContent = error.message;
                loginErrorEl.style.display = 'block';
            }
        },
        logout: () => {
            currentUser = null;
            authToken = null;
            sessionStorage.clear();
            pages.showLogin();
        },
        checkAuth: () => {
            const user = sessionStorage.getItem('currentUser');
            const token = sessionStorage.getItem('authToken');
            if (user && token) {
                currentUser = JSON.parse(user);
                authToken = token;
                return true;
            }
            return false;
        }
    };

    // --- PAGE & CONTENT MANAGEMENT ---
    const pages = {
        showLogin: () => {
            loginPage.classList.add('active');
            dashboardPage.classList.remove('active');
        },
        showDashboard: () => {
            loginPage.classList.remove('active');
            dashboardPage.classList.add('active');
            userNameEl.textContent = currentUser.nombre;
            loadPageContent('dashboard'); // Load initial content
        },
        showContent: (page) => {
            document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
            document.getElementById(`${page}Content`).classList.add('active');
            navLinks.forEach(l => l.classList.remove('active'));
            document.querySelector(`a[href="#${page}"]`).classList.add('active');
        }
    };

    // --- MODULES (Dashboard, Products, POS) ---

    const dashboardModule = {
        load: async () => {
            try {
                const stats = await api.getDashboardStats();
                const grid = document.getElementById('statsGrid');
                grid.innerHTML = `
                    <div class="stat-card"><h3>Ventas Hoy</h3><p>${stats.ventasHoy || 0}</p></div>
                    <div class="stat-card"><h3>Ingresos Hoy</h3><p>${utils.formatCurrency(stats.ingresosHoy || 0)}</p></div>
                    <div class="stat-card"><h3>Stock Bajo</h3><p>${stats.stockBajo || 0}</p></div>
                    <div class="stat-card"><h3>Productos Activos</h3><p>${stats.productosActivos || 0}</p></div>
                `;
            } catch (error) {
                document.getElementById('statsGrid').innerHTML = "<p>Error al cargar estadísticas.</p>";
            }
        }
    };

    const productsModule = {
        load: async () => {
            try {
                // *** FIX: Handle the object response from the backend ***
                const response = await api.getProducts();
                // Extract the products array from the response object
                const productsData = response.products; 
                
                appState.products = productsData;
                productsModule.renderTable(productsData);
            } catch (error) {
                console.error("Error loading products in module:", error);
                document.getElementById('productsTable').innerHTML = `<p>Error al cargar productos: ${error.message}</p>`;
            }
        },
        renderTable: (products) => {
            const container = document.getElementById('productsTable');
            if (!products || products.length === 0) {
                container.innerHTML = '<p>No hay productos disponibles.</p>';
                return;
            }
            const tableHTML = `
                <table>
                    <thead>
                        <tr>
                            <th>Código</th><th>Nombre</th><th>Categoría</th><th>Precio</th><th>Stock Total</th><th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${products.map(p => `
                            <tr>
                                <td>${p.codigo}</td>
                                <td>${p.nombre}</td>
                                <td>${p.categoria}</td>
                                <td>${utils.formatCurrency(p.precio)}</td>
                                <td>${p.stock_total || 0}</td>
                                <td class="actions">
                                    <button class="btn btn-sm btn-primary" data-action="edit" data-id="${p.id}">Editar</button>
                                    <button class="btn btn-sm btn-danger" data-action="delete" data-id="${p.id}">Eliminar</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>`;
            container.innerHTML = tableHTML;
        },
        handleDelete: async (id) => {
            const confirmed = await utils.showConfirm('Eliminar Producto', '¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer.');
            if (confirmed) {
                try {
                    await api.deleteProduct(id);
                    await productsModule.load(); // Refresh list
                } catch (error) {
                    utils.showModal('Error', `<p>No se pudo eliminar el producto. ${error.message}</p>`);
                }
            }
        }
    };

    const posModule = {
        load: async () => {
            try {
                const inventory = await api.getInventory(currentUser.sucursal_id);
                posModule.renderProducts(inventory);
                posModule.clearCart();
            } catch (error) {
                document.getElementById('posProducts').innerHTML = "<p>Error al cargar inventario.</p>";
            }
        },
        renderProducts: (inventory) => {
            const container = document.getElementById('posProducts');
            container.innerHTML = inventory
                .filter(item => item.stock_actual > 0)
                .map(item => `
                    <div class="product-item" data-id="${item.producto_id}" data-name="${item.nombre}" data-price="${item.precio}" data-stock="${item.stock_actual}">
                        <div class="product-info">
                            <h4>${item.nombre}</h4>
                            <p>${item.plataforma} - Stock: ${item.stock_actual}</p>
                        </div>
                        <div class="product-price">${utils.formatCurrency(item.precio)}</div>
                    </div>
                `).join('');
        },
        addToCart: (productData) => {
            const { id, name, price, stock } = productData;
            const existingItem = appState.cart.find(item => item.id === id);
            if (existingItem) {
                if (existingItem.cantidad < stock) {
                    existingItem.cantidad++;
                } else {
                    // Maybe show a small, non-blocking notification here
                    console.warn("Stock máximo alcanzado para el item:", name);
                }
            } else {
                appState.cart.push({ id, nombre: name, precio: +price, cantidad: 1, stock: +stock });
            }
            posModule.renderCart();
        },
        updateQuantity: (id, newQuantity) => {
            const item = appState.cart.find(item => item.id === id);
            if (!item) return;
            
            if (newQuantity <= 0) {
                appState.cart = appState.cart.filter(i => i.id !== id);
            } else if (newQuantity <= item.stock) {
                item.cantidad = newQuantity;
            } else {
                item.cantidad = item.stock; // Set to max available
            }
            posModule.renderCart();
        },
        renderCart: () => {
            const container = document.getElementById('cartItems');
            const totalEl = document.getElementById('cartTotal');
            if (appState.cart.length === 0) {
                container.innerHTML = '<p>Carrito vacío</p>';
                totalEl.textContent = utils.formatCurrency(0);
                return;
            }
            container.innerHTML = appState.cart.map(item => `
                <div class="cart-item">
                    <div class="cart-item-info">
                        <h4>${item.nombre}</h4>
                        <p>${utils.formatCurrency(item.precio)} c/u</p>
                    </div>
                    <div class="cart-item-controls">
                        <input type="number" class="qty-input" value="${item.cantidad}" min="1" max="${item.stock}" data-id="${item.id}" data-action="update-qty">
                        <span>${utils.formatCurrency(item.precio * item.cantidad)}</span>
                        <button class="btn btn-sm btn-danger" data-id="${item.id}" data-action="remove-from-cart">&times;</button>
                    </div>
                </div>
            `).join('');
            const total = appState.cart.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
            totalEl.textContent = utils.formatCurrency(total);
        },
        processSale: async () => {
            if (appState.cart.length === 0) return;
            const confirmed = await utils.showConfirm('Procesar Venta', `El total es ${document.getElementById('cartTotal').textContent}. ¿Confirmar la venta?`);
            if (confirmed) {
                const saleData = {
                    usuario_id: currentUser.id,
                    sucursal_id: currentUser.sucursal_id,
                    items: appState.cart.map(item => ({
                        producto_id: item.id,
                        cantidad: item.cantidad,
                        precio_unitario: item.precio,
                        subtotal: item.precio * item.cantidad,
                    })),
                    total: appState.cart.reduce((sum, item) => sum + (item.precio * item.cantidad), 0),
                    metodo_pago: 'efectivo'
                };
                try {
                    const response = await api.createSale(saleData);
                    utils.showModal('Venta Exitosa', `<p>Venta con ID ${response.venta_id} procesada correctamente.</p>`);
                    await posModule.load(); // Reloads products and clears cart
                } catch (error) {
                    utils.showModal('Error', `<p>No se pudo procesar la venta. ${error.message}</p>`);
                }
            }
        },
        clearCart: () => {
            appState.cart = [];
            posModule.renderCart();
        }
    };

    // --- EVENT LISTENERS ---
    
    // Auth
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = e.target.elements.username.value;
        const password = e.target.elements.password.value;
        auth.login(username, password);
    });
    logoutBtn.addEventListener('click', auth.logout);

    // Navigation
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = e.target.getAttribute('href').substring(1);
            loadPageContent(page);
        });
    });

    // Dynamic content clicks (delegation)
    mainContent.addEventListener('click', (e) => {
        const target = e.target;
        const action = target.dataset.action;
        const id = target.dataset.id;

        if (action === 'delete' && id) productsModule.handleDelete(id);
        if (action === 'edit' && id) utils.showModal('Editar Producto', '<p>Funcionalidad en desarrollo.</p>');
        if (target.closest('.product-item')) {
             const productData = target.closest('.product-item').dataset;
             posModule.addToCart({id: +productData.id, name: productData.name, price: productData.price, stock: productData.stock});
        }
        if (action === 'remove-from-cart' && id) {
            appState.cart = appState.cart.filter(i => i.id !== +id);
            posModule.renderCart();
        }
        if (target.id === 'processSale') posModule.processSale();
    });
    
    mainContent.addEventListener('change', (e) => {
        const target = e.target;
        const action = target.dataset.action;
        const id = target.dataset.id;
        
        if (action === 'update-qty' && id) {
            posModule.updateQuantity(+id, parseInt(target.value, 10));
        }
    });

    // Modal
    modalClose.addEventListener('click', utils.hideModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) utils.hideModal();
    });

    // --- INITIALIZATION ---
    function loadPageContent(page) {
        pages.showContent(page);
        switch (page) {
            case 'dashboard': dashboardModule.load(); break;
            case 'products': productsModule.load(); break;
            case 'sales': posModule.load(); break;
            // Other cases for inventory, clients, reports...
        }
    }

    if (auth.checkAuth()) {
        pages.showDashboard();
    } else {
        pages.showLogin();
    }
});