// js/buy.js - Buy/Shop page functionality
(function() {
    'use strict';
    
    // Product filtering
    const initProductFilters = () => {
        const filterBtns = document.querySelectorAll('.filter-btn');
        const productCards = document.querySelectorAll('.product-card');
        
        if (!filterBtns.length || !productCards.length) return;
        
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Update active state
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Filter products
                const filter = btn.dataset.filter;
                
                productCards.forEach(card => {
                    const category = card.dataset.category;
                    
                    if (filter === 'all' || category === filter) {
                        card.style.display = 'block';
                        card.style.animation = 'fadeIn 0.3s ease';
                    } else {
                        card.style.display = 'none';
                    }
                });
            });
        });
    };
    
    // Add to cart functionality
    const initAddToCart = () => {
        const addToCartBtns = document.querySelectorAll('.product-card .btn-primary');
        
        addToCartBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const card = e.target.closest('.product-card');
                const productName = card.querySelector('h3').textContent;
                const price = card.querySelector('.price').textContent;
                
                // Show toast notification
                showToast(`${productName} added to cart!`, 'success');
                
                // In a real implementation, this would add to a cart system
                console.log('Added to cart:', productName, price);
            });
        });
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
            initProductFilters();
            initAddToCart();
        });
    } else {
        initProductFilters();
        initAddToCart();
    }
})();
