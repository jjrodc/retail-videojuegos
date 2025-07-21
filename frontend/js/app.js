/**
 * Game Retail - Storefront Logic
 * This script manages the customer-facing store, including fetching and
 * displaying products, filtering, search, and a shopping cart.
 */
document.addEventListener('DOMContentLoaded', () => {

    // --- CONFIG & STATE ---
    const API_BASE_URL = 'http://localhost:3000/api';
    let allProducts = []; // Cache for all products from the API
    let cart = []; // Array to hold cart items

    // --- DOM ELEMENTS ---
    const productGridContainer = document.getElementById('productGridContainer');
    const searchInput = document.getElementById('searchInput');
    const sortFilter = document.getElementById('sortFilter');
    const genreFilter = document.getElementById('genreFilter');
    const platformFilter = document.getElementById('platformFilter');
    const cartButton = document.getElementById('cartButton');
    const cartCount = document.getElementById('cartCount');
    const cartModal = document.getElementById('cartModal');
    const closeCartButton = document.getElementById('closeCartButton');
    const cartModalBody = document.getElementById('cartModalBody');
    const cartModalTotal = document.getElementById('cartModalTotal');

    // --- UTILITY FUNCTIONS ---
    const formatCurrency = (amount) => new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(amount);

    // --- API FUNCTIONS ---
    const api = {
        getProducts: async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/products`);
                if (!response.ok) throw new Error('Network response was not ok');
                return await response.json();
            } catch (error) {
                console.error("Failed to fetch products:", error);
                productGridContainer.innerHTML = `<p class="col-span-full text-center text-red-400">Error al cargar los productos. Por favor, intente más tarde.</p>`;
                return [];
            }
        }
    };

    // --- PRODUCT & FILTERING LOGIC ---
    const products = {
        render: (productsToRender) => {
            if (productsToRender.length === 0) {
                productGridContainer.innerHTML = `<p class="col-span-full text-center text-gray-400">No se encontraron productos que coincidan con su búsqueda.</p>`;
                return;
            }
            productGridContainer.innerHTML = productsToRender.map(p => `
                <div class="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-blue-500/20 transition-shadow duration-300 transform hover:-translate-y-1 flex flex-col">
                    <img src="https://placehold.co/300x400/1a202c/ffffff?text=${encodeURIComponent(p.nombre)}" alt="Portada de ${p.nombre}" class="w-full h-64 object-cover">
                    <div class="p-4 flex flex-col flex-grow">
                        <h3 class="font-bold text-lg text-white flex-grow">${p.nombre}</h3>
                        <p class="text-gray-400 text-sm mb-2">${p.plataforma || 'Multiplataforma'}</p>
                        <div class="flex items-center justify-between mt-auto">
                            <p class="text-xl font-semibold text-blue-400">${formatCurrency(p.precio)}</p>
                            <button data-id="${p.id}" class="add-to-cart-btn bg-blue-600 text-white px-3 py-1 rounded-md text-sm font-semibold hover:bg-blue-700 transition">Comprar</button>
                        </div>
                    </div>
                </div>
            `).join('');
        },
        applyFilters: () => {
            let filtered = [...allProducts];
            const query = searchInput.value.toLowerCase();
            const genre = genreFilter.value;
            const platform = platformFilter.value;
            const sort = sortFilter.value;

            // Search
            if (query) {
                filtered = filtered.filter(p => p.nombre.toLowerCase().includes(query));
            }
            // Genre
            if (genre !== 'all') {
                filtered = filtered.filter(p => p.categoria === genre);
            }
            // Platform
            if (platform !== 'all') {
                filtered = filtered.filter(p => p.plataforma === platform);
            }
            // Sort
            switch (sort) {
                case 'price-asc': filtered.sort((a, b) => a.precio - b.precio); break;
                case 'price-desc': filtered.sort((a, b) => b.precio - a.precio); break;
                case 'name-asc': filtered.sort((a, b) => a.nombre.localeCompare(b.nombre)); break;
            }
            products.render(filtered);
        },
        populateFilters: () => {
            const genres = [...new Set(allProducts.map(p => p.categoria))];
            const platforms = [...new Set(allProducts.map(p => p.plataforma))];
            
            genreFilter.innerHTML += genres.map(g => `<option value="${g}">${g}</option>`).join('');
            platformFilter.innerHTML += platforms.map(p => `<option value="${p}">${p}</option>`).join('');
        }
    };

    // --- SHOPPING CART LOGIC ---
    const shoppingCart = {
        toggle: () => cartModal.classList.toggle('hidden'),
        update: () => {
            const count = cart.reduce((sum, item) => sum + item.quantity, 0);
            cartCount.textContent = count;
            
            if (cart.length === 0) {
                cartModalBody.innerHTML = `<p class="text-center text-gray-400">Tu carrito está vacío.</p>`;
                cartModalTotal.textContent = formatCurrency(0);
                return;
            }
            
            cartModalBody.innerHTML = cart.map(item => `
                <div class="flex items-center justify-between py-2 border-b border-gray-700">
                    <div>
                        <p class="font-semibold">${item.nombre}</p>
                        <p class="text-sm text-gray-400">${formatCurrency(item.precio)} x ${item.quantity}</p>
                    </div>
                    <div class="font-semibold">${formatCurrency(item.precio * item.quantity)}</div>
                </div>
            `).join('');
            
            const total = cart.reduce((sum, item) => sum + (item.precio * item.quantity), 0);
            cartModalTotal.textContent = formatCurrency(total);
        },
        add: (productId) => {
            const productToAdd = allProducts.find(p => p.id === productId);
            if (!productToAdd) return;

            const existingItem = cart.find(item => item.id === productId);
            if (existingItem) {
                existingItem.quantity++;
            } else {
                cart.push({ ...productToAdd, quantity: 1 });
            }
            shoppingCart.update();
        }
    };

    // --- EVENT LISTENERS ---
    searchInput.addEventListener('input', products.applyFilters);
    sortFilter.addEventListener('change', products.applyFilters);
    genreFilter.addEventListener('change', products.applyFilters);
    platformFilter.addEventListener('change', products.applyFilters);

    cartButton.addEventListener('click', shoppingCart.toggle);
    closeCartButton.addEventListener('click', shoppingCart.toggle);
    cartModal.addEventListener('click', (e) => {
        if (e.target === cartModal) shoppingCart.toggle();
    });

    productGridContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('add-to-cart-btn')) {
            const productId = parseInt(e.target.dataset.id, 10);
            shoppingCart.add(productId);
        }
    });

    // --- INITIALIZATION ---
    const init = async () => {
        productGridContainer.innerHTML = `<p class="col-span-full text-center">Cargando productos...</p>`;
        allProducts = await api.getProducts();
        products.populateFilters();
        products.render(allProducts);
        shoppingCart.update();
    };

    init();
});
