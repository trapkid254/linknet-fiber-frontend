// js/admin-products.js - Admin products management
(function() {
    'use strict';
    
    const API_BASE = 'https://linknet-fiber-backend.onrender.com/api';
    
    let products = [];
    
    // Initialize
    const init = () => {
        loadProducts();
        initModal();
        initSearch();
    };
    
    // Load products from backend
    const loadProducts = async () => {
        try {
            const response = await fetch(`${API_BASE}/products`);
            const data = await response.json();
            products = data.products || [];
            renderProducts();
            updateStats();
        } catch (error) {
            console.error('Error loading products:', error);
            // Use mock data for now
            products = [];
            renderProducts();
            updateStats();
        }
    };
    
    // Render products table
    const renderProducts = () => {
        const tbody = document.getElementById('products-table-body');
        if (!tbody) return;
        
        if (products.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center">
                        <p>No products found. Click "Add Product" to create one.</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = products.map(product => `
            <tr>
                <td>
                    <div class="product-cell">
                        <i class="${product.icon || 'fas fa-box'}" style="font-size: 1.5rem; color: #1E4D8C; margin-right: 10px;"></i>
                        <div>
                            <strong>${product.name}</strong>
                            <small style="display: block; color: #64748B;">${product.description?.substring(0, 50)}...</small>
                        </div>
                    </div>
                </td>
                <td><span class="badge">${product.category}</span></td>
                <td>KES ${product.price?.toLocaleString()}</td>
                <td>${product.stock || 0}</td>
                <td>
                    <span class="status-badge ${product.status === 'active' ? 'status-active' : 'status-inactive'}">
                        ${product.status}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="editProduct('${product._id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteProduct('${product._id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    };
    
    // Update stats
    const updateStats = () => {
        document.getElementById('total-products').textContent = products.length;
        document.getElementById('total-routers').textContent = products.filter(p => p.category === 'routers').length;
        document.getElementById('total-modems').textContent = products.filter(p => p.category === 'modems').length;
        document.getElementById('total-accessories').textContent = products.filter(p => p.category === 'accessories').length;
    };
    
    // Initialize modal
    const initModal = () => {
        const modal = document.getElementById('product-modal');
        const addBtn = document.getElementById('add-product-btn');
        const closeBtn = document.getElementById('close-product-modal');
        const cancelBtn = document.getElementById('cancel-product-btn');
        const form = document.getElementById('product-form');
        
        if (!modal || !addBtn) return;
        
        addBtn.addEventListener('click', () => {
            document.getElementById('modal-title').textContent = 'Add Product';
            form.reset();
            document.getElementById('product-id').value = '';
            modal.style.display = 'flex';
        });
        
        closeBtn.addEventListener('click', () => modal.style.display = 'none');
        cancelBtn.addEventListener('click', () => modal.style.display = 'none');
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.style.display = 'none';
        });
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await saveProduct();
        });
    };
    
    // Save product
    const saveProduct = async () => {
        const productId = document.getElementById('product-id').value;
        const productData = {
            name: document.getElementById('product-name').value,
            category: document.getElementById('product-category').value,
            description: document.getElementById('product-description').value,
            price: parseInt(document.getElementById('product-price').value),
            stock: parseInt(document.getElementById('product-stock').value),
            icon: document.getElementById('product-icon').value,
            features: document.getElementById('product-features').value.split(',').map(f => f.trim()),
            status: document.getElementById('product-status').value
        };
        
        try {
            const url = productId 
                ? `${API_BASE}/products/${productId}`
                : `${API_BASE}/products`;
            
            const method = productId ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productData)
            });
            
            if (response.ok) {
                document.getElementById('product-modal').style.display = 'none';
                loadProducts();
                alert(productId ? 'Product updated successfully!' : 'Product added successfully!');
            } else {
                alert('Error saving product');
            }
        } catch (error) {
            console.error('Error saving product:', error);
            alert('Error saving product');
        }
    };
    
    // Edit product
    window.editProduct = (id) => {
        const product = products.find(p => p._id === id);
        if (!product) return;
        
        document.getElementById('modal-title').textContent = 'Edit Product';
        document.getElementById('product-id').value = product._id;
        document.getElementById('product-name').value = product.name;
        document.getElementById('product-category').value = product.category;
        document.getElementById('product-description').value = product.description;
        document.getElementById('product-price').value = product.price;
        document.getElementById('product-stock').value = product.stock;
        document.getElementById('product-icon').value = product.icon;
        document.getElementById('product-features').value = product.features?.join(', ') || '';
        document.getElementById('product-status').value = product.status;
        
        document.getElementById('product-modal').style.display = 'flex';
    };
    
    // Delete product
    window.deleteProduct = async (id) => {
        if (!confirm('Are you sure you want to delete this product?')) return;
        
        try {
            const response = await fetch(`${API_BASE}/products/${id}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                loadProducts();
                alert('Product deleted successfully!');
            } else {
                alert('Error deleting product');
            }
        } catch (error) {
            console.error('Error deleting product:', error);
            alert('Error deleting product');
        }
    };
    
    // Initialize search
    const initSearch = () => {
        const searchInput = document.getElementById('search-products');
        if (!searchInput) return;
        
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const filtered = products.filter(p => 
                p.name.toLowerCase().includes(query) ||
                p.category.toLowerCase().includes(query) ||
                p.description?.toLowerCase().includes(query)
            );
            
            const tbody = document.getElementById('products-table-body');
            tbody.innerHTML = filtered.map(product => `
                <tr>
                    <td>
                        <div class="product-cell">
                            <i class="${product.icon || 'fas fa-box'}" style="font-size: 1.5rem; color: #1E4D8C; margin-right: 10px;"></i>
                            <div>
                                <strong>${product.name}</strong>
                                <small style="display: block; color: #64748B;">${product.description?.substring(0, 50)}...</small>
                            </div>
                        </div>
                    </td>
                    <td><span class="badge">${product.category}</span></td>
                    <td>KES ${product.price?.toLocaleString()}</td>
                    <td>${product.stock || 0}</td>
                    <td>
                        <span class="status-badge ${product.status === 'active' ? 'status-active' : 'status-inactive'}">
                            ${product.status}
                        </span>
                    </td>
                    <td>
                        <button class="btn btn-sm btn-primary" onclick="editProduct('${product._id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteProduct('${product._id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
        });
    };
    
    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
