// js/buy.js - Buy/Shop page functionality
(function() {
    'use strict';
    
    const API_BASE = 'https://linknet-fiber-backend.onrender.com/api';
    let products = [];
    
    // Load products from backend
    const loadProducts = async () => {
        const container = document.getElementById('products-container');
        
        try {
            const response = await fetch(`${API_BASE}/products?status=active`);
            const data = await response.json();
            products = data.products || [];
            renderProducts(products);
        } catch (error) {
            console.error('Error loading products:', error);
            container.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Error loading products. Please try again later.</p>
                </div>
            `;
        }
    };
    
    // Render products
    const renderProducts = (productsToRender) => {
        const container = document.getElementById('products-container');
        
        if (productsToRender.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-box-open"></i>
                    <p>No products available at the moment.</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = productsToRender.map(product => `
            <div class="product-card" data-category="${product.category}" data-id="${product._id}">
                <div class="product-image">
                    ${product.image 
                        ? `<img src="${API_BASE.replace('/api', '')}${product.image}" alt="${product.name}" class="product-img">`
                        : `<i class="${product.icon || 'fas fa-box'} product-icon"></i>`
                    }
                </div>
                <div class="product-info">
                    <h3>${product.name}</h3>
                    <p class="product-description">${product.description}</p>
                    <div class="product-features">
                        ${(product.features || []).map(feature => `
                            <span><i class="fas fa-check"></i> ${feature}</span>
                        `).join('')}
                    </div>
                    <div class="product-price">
                        <span class="price">KES ${product.price.toLocaleString()}</span>
                        <button class="btn btn-primary btn-sm add-to-cart-btn" data-id="${product._id}">
                            Add to Cart
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
        
        // Initialize add to cart buttons
        initAddToCart();
    };
    
    // Product filtering
    const initProductFilters = () => {
        const filterBtns = document.querySelectorAll('.filter-btn');
        
        if (!filterBtns.length) return;
        
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Update active state
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Filter products
                const filter = btn.dataset.filter;
                
                if (filter === 'all') {
                    renderProducts(products);
                } else {
                    const filtered = products.filter(p => p.category === filter);
                    renderProducts(filtered);
                }
            });
        });
    };
    
    // Add to cart functionality
    const initAddToCart = () => {
        const addToCartBtns = document.querySelectorAll('.add-to-cart-btn');
        
        addToCartBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = e.target.dataset.id;
                const product = products.find(p => p._id === productId);
                
                if (!product) return;
                
                // Add to cart using localStorage
                let cart = JSON.parse(localStorage.getItem('linknetCart')) || [];
                const existingItem = cart.find(item => item._id === productId);
                
                if (existingItem) {
                    existingItem.quantity++;
                } else {
                    cart.push({ 
                        _id: product._id,
                        name: product.name, 
                        price: `KES ${product.price.toLocaleString()}`,
                        icon: product.icon,
                        quantity: 1 
                    });
                }
                
                localStorage.setItem('linknetCart', JSON.stringify(cart));
                
                // Update cart badge
                updateCartBadge();
                
                // Show toast notification
                showToast(`${product.name} added to cart!`, 'success');
                
                // Button feedback
                btn.textContent = 'Added!';
                btn.style.background = 'var(--color-success)';
                setTimeout(() => {
                    btn.textContent = 'Add to Cart';
                    btn.style.background = '';
                }, 1500);
            });
        });
    };
    
    // Update cart badge
    const updateCartBadge = () => {
        let cartBadge = document.getElementById('cart-badge');
        if (!cartBadge) {
            // Create cart badge if it doesn't exist
            const navActions = document.querySelector('.nav-actions');
            if (navActions) {
                const cartIcon = document.createElement('a');
                cartIcon.href = '/cart/';
                cartIcon.className = 'btn-cart-icon';
                cartIcon.style.cssText = `
                    position: relative;
                    background: transparent;
                    border: 2px solid var(--border-medium);
                    color: var(--text-primary);
                    padding: 8px 12px;
                    border-radius: var(--radius-md);
                    cursor: pointer;
                    transition: all var(--transition-base);
                    margin-right: var(--spacing-3);
                    text-decoration: none;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                `;
                cartIcon.innerHTML = '<i class="fas fa-shopping-cart"></i>';
                cartIcon.setAttribute('aria-label', 'View cart');
                
                cartBadge = document.createElement('span');
                cartBadge.id = 'cart-badge';
                cartBadge.style.cssText = `
                    position: absolute;
                    top: -8px;
                    right: -8px;
                    background: var(--color-gold);
                    color: var(--color-white);
                    font-size: 0.7rem;
                    font-weight: 700;
                    padding: 2px 6px;
                    border-radius: var(--radius-full);
                    min-width: 20px;
                    text-align: center;
                    display: none;
                `;
                cartBadge.textContent = '0';
                
                cartIcon.appendChild(cartBadge);
                navActions.insertBefore(cartIcon, navActions.firstChild);
            }
        }
        
        if (cartBadge) {
            const cart = JSON.parse(localStorage.getItem('linknetCart')) || [];
            const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
            cartBadge.textContent = totalItems;
            cartBadge.style.display = totalItems > 0 ? 'block' : 'none';
            
            // Pulse animation
            cartBadge.style.animation = 'pulse 0.3s ease';
            setTimeout(() => {
                cartBadge.style.animation = '';
            }, 300);
        }
    };
    
    // Toast notification helper
    const showToast = (message, type = 'info') => {
        // Use global showToast if available
        if (typeof window.showToast === 'function') {
            window.showToast(message, type, 3000);
            return;
        }
        
        // Fallback toast
        const existing = document.getElementById('buy-toast');
        if (existing) existing.remove();
        
        const colors = { success: '#38a169', error: '#e53e3e', info: '#3182ce' };
        const toast = document.createElement('div');
        toast.id = 'buy-toast';
        toast.style.cssText = `
            position: fixed; bottom: 28px; right: 24px; z-index: 99998;
            padding: 14px 20px; border-radius: 12px; color: #fff; font-weight: 600;
            font-size: 0.88rem; line-height: 1.4; box-shadow: 0 6px 20px rgba(0,0,0,0.2);
            background: ${colors[type] || colors.info}; transition: opacity 0.4s;
            max-width: 340px; word-wrap: break-word;
            font-family: 'Inter', system-ui, sans-serif;
            animation: slideIn 0.3s ease;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => { 
            toast.style.opacity = '0'; 
            setTimeout(() => toast.remove(), 400); 
        }, 3000);
    };
    
    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            loadProducts();
            initProductFilters();
            updateCartBadge();
        });
    } else {
        loadProducts();
        initProductFilters();
        updateCartBadge();
    }
})();
