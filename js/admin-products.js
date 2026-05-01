// js/admin-products.js - Admin products management
(function() {
    'use strict';
    
    const API_BASE = 'https://linknet-fiber-backend.onrender.com/api';
    const AUTH_KEY = 'linknet_admin_auth';
    
    let products = [];
    
    // Get auth headers
    const getAuthHeaders = () => {
        try {
            const authData = localStorage.getItem(AUTH_KEY);
            if (!authData) {
                window.location.href = '/admin/login/';
                return {};
            }
            const parsed = JSON.parse(authData);
            if (parsed.expires && parsed.expires < Date.now()) {
                localStorage.removeItem(AUTH_KEY);
                window.location.href = '/admin/login/';
                return {};
            }
            return {
                'Authorization': `Bearer ${parsed.token}`
            };
        } catch (error) {
            console.error('Error parsing auth data:', error);
            localStorage.removeItem(AUTH_KEY);
            window.location.href = '/admin/login/';
            return {};
        }
    };
    
    // Initialize
    const init = () => {
        loadProducts();
        initModal();
        initSearch();
    };
    
    // Load products from backend
    const loadProducts = async () => {
        try {
            const response = await fetch(`${API_BASE}/products`, {
                headers: getAuthHeaders()
            });
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
        const imageInput = document.getElementById('product-image');
        const imagePreview = document.getElementById('image-preview');
        
        // Image preview
        imageInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    imagePreview.innerHTML = `
                        <img src="${e.target.result}" alt="Product Image">
                        <div class="remove-image" onclick="removeImage()">Remove Image</div>
                    `;
                    imagePreview.classList.add('active');
                };
                reader.readAsDataURL(file);
            } else {
                imagePreview.innerHTML = '';
                imagePreview.classList.remove('active');
            }
        });
        
        // Remove image function
        window.removeImage = () => {
            imageInput.value = '';
            imagePreview.innerHTML = '';
            imagePreview.classList.remove('active');
        };
        
        addBtn.addEventListener('click', () => {
            document.getElementById('modal-title').textContent = 'Add Product';
            form.reset();
            document.getElementById('product-id').value = '';
            imagePreview.innerHTML = '';
            imagePreview.classList.remove('active');
            modal.style.display = 'flex';
        });
        
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
        
        cancelBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
        
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
        const authHeaders = getAuthHeaders();
        
        // Check if authenticated
        if (!authHeaders.Authorization) {
            alert('You must be logged in to save products. Redirecting to login...');
            window.location.href = '/admin/login/';
            return;
        }
        
        const productId = document.getElementById('product-id').value;
        const imageInput = document.getElementById('product-image');
        
        const formData = new FormData();
        formData.append('name', document.getElementById('product-name').value);
        formData.append('category', document.getElementById('product-category').value);
        formData.append('description', document.getElementById('product-description').value);
        formData.append('price', document.getElementById('product-price').value);
        formData.append('stock', document.getElementById('product-stock').value);
        formData.append('icon', document.getElementById('product-icon').value);
        formData.append('features', document.getElementById('product-features').value);
        formData.append('status', document.getElementById('product-status').value);
        
        // Append image if selected
        if (imageInput.files[0]) {
            formData.append('image', imageInput.files[0]);
        }
        
        try {
            const url = productId 
                ? `${API_BASE}/products/${productId}`
                : `${API_BASE}/products`;
            
            const method = productId ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method,
                headers: authHeaders,
                body: formData
            });
            
            const data = await response.json();
            
            if (response.ok) {
                document.getElementById('product-modal').style.display = 'none';
                loadProducts();
                alert(productId ? 'Product updated successfully!' : 'Product added successfully!');
            } else {
                console.error('Error saving product:', data);
                alert(`Error saving product: ${data.error || 'Unknown error'}`);
                if (response.status === 401) {
                    alert('Session expired. Please login again.');
                    window.location.href = '/admin/login/';
                }
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
                method: 'DELETE',
                headers: getAuthHeaders()
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
