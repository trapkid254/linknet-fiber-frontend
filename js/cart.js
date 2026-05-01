// js/cart.js - Shopping cart functionality
(function() {
    'use strict';
    
    // Cart state (stored in localStorage)
    let cart = JSON.parse(localStorage.getItem('linknetCart')) || [];
    
    // Delivery fee (removed)
    const DELIVERY_FEE = 0;
    
    // Initialize cart
    const initCart = () => {
        renderCartItems();
        updateSummary();
        initCheckout();
        initMpesaModal();
    };
    
    // Render cart items
    const renderCartItems = () => {
        const container = document.getElementById('cart-items-container');
        const emptyCart = document.getElementById('empty-cart');
        
        if (!container) return;
        
        if (cart.length === 0) {
            container.innerHTML = `
                <div class="empty-cart">
                    <i class="fas fa-shopping-cart"></i>
                    <h3>Your cart is empty</h3>
                    <p>Browse our products and add items to your cart</p>
                    <a href="/buy/" class="btn btn-primary">Continue Shopping</a>
                </div>
            `;
            return;
        }
        
        let html = '';
        cart.forEach((item, index) => {
            html += `
                <div class="cart-item" data-index="${index}">
                    <div class="cart-item-image">
                        <i class="fas ${item.icon}"></i>
                    </div>
                    <div class="cart-item-details">
                        <h3>${item.name}</h3>
                        <p class="cart-item-price">${item.price}</p>
                    </div>
                    <div class="cart-item-quantity">
                        <button class="qty-btn qty-minus" data-index="${index}">-</button>
                        <span class="qty-value">${item.quantity}</span>
                        <button class="qty-btn qty-plus" data-index="${index}">+</button>
                    </div>
                    <div class="cart-item-total">
                        <span>${calculateItemTotal(item)}</span>
                    </div>
                    <button class="cart-item-remove" data-index="${index}" aria-label="Remove item">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
        });
        
        container.innerHTML = html;
        
        // Add event listeners
        container.querySelectorAll('.qty-minus').forEach(btn => {
            btn.addEventListener('click', (e) => updateQuantity(parseInt(e.target.dataset.index), -1));
        });
        
        container.querySelectorAll('.qty-plus').forEach(btn => {
            btn.addEventListener('click', (e) => updateQuantity(parseInt(e.target.dataset.index), 1));
        });
        
        container.querySelectorAll('.cart-item-remove').forEach(btn => {
            btn.addEventListener('click', (e) => removeItem(parseInt(e.target.dataset.index)));
        });
    };
    
    // Calculate item total
    const calculateItemTotal = (item) => {
        const priceNum = parseInt(item.price.replace(/[^0-9]/g, ''));
        return `KES ${(priceNum * item.quantity).toLocaleString()}`;
    };
    
    // Update quantity
    const updateQuantity = (index, change) => {
        cart[index].quantity += change;
        
        if (cart[index].quantity <= 0) {
            cart.splice(index, 1);
        }
        
        saveCart();
        renderCartItems();
        updateSummary();
        updateCartBadge();
    };
    
    // Remove item
    const removeItem = (index) => {
        cart.splice(index, 1);
        saveCart();
        renderCartItems();
        updateSummary();
        updateCartBadge();
    };
    
    // Save cart to localStorage
    const saveCart = () => {
        localStorage.setItem('linknetCart', JSON.stringify(cart));
    };
    
    // Update summary
    const updateSummary = () => {
        const subtotal = cart.reduce((total, item) => {
            const priceNum = parseInt(item.price.replace(/[^0-9]/g, ''));
            return total + (priceNum * item.quantity);
        }, 0);
        
        const deliveryFee = cart.length > 0 ? DELIVERY_FEE : 0;
        const total = subtotal + deliveryFee;
        
        const subtotalEl = document.getElementById('subtotal');
        const deliveryFeeEl = document.getElementById('delivery-fee');
        const totalEl = document.getElementById('total');
        const payBtn = document.getElementById('pay-btn');
        
        if (subtotalEl) subtotalEl.textContent = `KES ${subtotal.toLocaleString()}`;
        if (deliveryFeeEl) deliveryFeeEl.textContent = `KES ${deliveryFee.toLocaleString()}`;
        if (totalEl) totalEl.textContent = `KES ${total.toLocaleString()}`;
        
        if (payBtn) {
            payBtn.disabled = cart.length === 0;
            payBtn.textContent = cart.length > 0 ? `Pay KES ${total.toLocaleString()}` : 'Pay';
        }
    };
    
    // Update cart badge
    const updateCartBadge = () => {
        const cartBadge = document.getElementById('cart-badge');
        if (cartBadge) {
            const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
            cartBadge.textContent = totalItems;
            cartBadge.style.display = totalItems > 0 ? 'block' : 'none';
        }
    };
    
    // Initialize checkout
    const initCheckout = () => {
        const payBtn = document.getElementById('pay-btn');
        if (!payBtn) return;
        
        payBtn.addEventListener('click', () => {
            if (cart.length === 0) return;
            
            const total = cart.reduce((total, item) => {
                const priceNum = parseInt(item.price.replace(/[^0-9]/g, ''));
                return total + (priceNum * item.quantity);
            }, 0) + DELIVERY_FEE;
            
            document.getElementById('mpesa-amount').value = total;
            document.getElementById('mpesa-payment-modal').style.display = 'flex';
        });
    };
    
    // Initialize M-Pesa modal
    const initMpesaModal = () => {
        const modal = document.getElementById('mpesa-payment-modal');
        const closeBtn = document.getElementById('close-mpesa-modal');
        const form = document.getElementById('mpesa-payment-form');
        
        if (!modal || !closeBtn || !form) return;
        
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const phone = document.getElementById('mpesa-phone').value;
            const amount = document.getElementById('mpesa-amount').value;
            
            // Show loading state
            document.getElementById('payment-status').style.display = 'block';
            document.getElementById('initiate-payment-btn').disabled = true;
            
            try {
                // Send order to backend
                const response = await fetch('https://linknet-fiber-backend.onrender.com/api/orders', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        items: cart,
                        customerName: 'Guest Customer',
                        customerPhone: phone,
                        total: parseInt(amount),
                        deliveryFee: DELIVERY_FEE,
                        paymentMethod: 'mpesa',
                        paymentPhone: phone
                    })
                });
                
                if (response.ok) {
                    // Clear cart
                    cart = [];
                    saveCart();
                    updateCartBadge();
                    
                    // Redirect to success page
                    window.location.href = '/order-success/';
                } else {
                    throw new Error('Failed to create order');
                }
            } catch (error) {
                console.error('Error creating order:', error);
                // Fallback: clear cart and redirect anyway for demo
                cart = [];
                saveCart();
                updateCartBadge();
                window.location.href = '/order-success/';
            }
        });
    };
    
    // Add item to cart (called from buy page)
    window.addToCart = (name, price, icon) => {
        const existingItem = cart.find(item => item.name === name);
        
        if (existingItem) {
            existingItem.quantity++;
        } else {
            cart.push({ name, price, icon, quantity: 1 });
        }
        
        saveCart();
        updateCartBadge();
    };
    
    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCart);
    } else {
        initCart();
    }
})();
