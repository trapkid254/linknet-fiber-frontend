// js/admin-orders.js - Admin orders management
(function() {
    'use strict';
    
    const API_BASE = 'https://linknet-fiber-backend.onrender.com/api';
    
    let orders = [];
    
    // Initialize
    const init = () => {
        loadOrders();
        initModal();
        initSearch();
        initFilter();
    };
    
    // Load orders from backend
    const loadOrders = async () => {
        try {
            const response = await fetch(`${API_BASE}/orders`);
            const data = await response.json();
            orders = data.orders || [];
            renderOrders();
            updateStats();
        } catch (error) {
            console.error('Error loading orders:', error);
            // Use mock data for now
            orders = [];
            renderOrders();
            updateStats();
        }
    };
    
    // Render orders table
    const renderOrders = () => {
        const tbody = document.getElementById('orders-table-body');
        if (!tbody) return;
        
        if (orders.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center">
                        <p>No orders found.</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = orders.map(order => `
            <tr>
                <td><strong>${order.orderNumber || 'N/A'}</strong></td>
                <td>
                    <div>${order.customerName || 'N/A'}</div>
                    <small style="color: #64748B;">${order.customerPhone || 'N/A'}</small>
                </td>
                <td>${order.items?.length || 0} items</td>
                <td><strong>KES ${order.total?.toLocaleString()}</strong></td>
                <td>
                    <span class="badge ${order.paymentStatus === 'completed' ? 'badge-success' : 'badge-warning'}">
                        ${order.paymentStatus || 'pending'}
                    </span>
                </td>
                <td>
                    <span class="status-badge status-${order.status}">
                        ${order.status}
                    </span>
                </td>
                <td>${new Date(order.createdAt).toLocaleDateString()}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="viewOrder('${order._id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-success" onclick="updateOrderStatus('${order._id}', 'completed')">
                        <i class="fas fa-check"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    };
    
    // Update stats
    const updateStats = () => {
        document.getElementById('total-orders').textContent = orders.length;
        document.getElementById('pending-orders').textContent = orders.filter(o => o.status === 'pending').length;
        document.getElementById('processing-orders').textContent = orders.filter(o => o.status === 'processing').length;
        document.getElementById('completed-orders').textContent = orders.filter(o => o.status === 'completed').length;
    };
    
    // Initialize modal
    const initModal = () => {
        const modal = document.getElementById('order-modal');
        const closeBtn = document.getElementById('close-order-modal');
        
        if (!modal || !closeBtn) return;
        
        closeBtn.addEventListener('click', () => modal.style.display = 'none');
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.style.display = 'none';
        });
    };
    
    // View order details
    window.viewOrder = (id) => {
        const order = orders.find(o => o._id === id);
        if (!order) return;
        
        const content = document.getElementById('order-details-content');
        content.innerHTML = `
            <div class="order-details">
                <div class="detail-section">
                    <h3>Order Information</h3>
                    <div class="detail-row">
                        <span>Order Number:</span>
                        <strong>${order.orderNumber || 'N/A'}</strong>
                    </div>
                    <div class="detail-row">
                        <span>Status:</span>
                        <span class="status-badge status-${order.status}">${order.status}</span>
                    </div>
                    <div class="detail-row">
                        <span>Payment Status:</span>
                        <span class="badge ${order.paymentStatus === 'completed' ? 'badge-success' : 'badge-warning'}">${order.paymentStatus}</span>
                    </div>
                    <div class="detail-row">
                        <span>Total:</span>
                        <strong>KES ${order.total?.toLocaleString()}</strong>
                    </div>
                    <div class="detail-row">
                        <span>Delivery Fee:</span>
                        <span>KES ${order.deliveryFee?.toLocaleString()}</span>
                    </div>
                </div>
                
                <div class="detail-section">
                    <h3>Customer Information</h3>
                    <div class="detail-row">
                        <span>Name:</span>
                        <strong>${order.customerName || 'N/A'}</strong>
                    </div>
                    <div class="detail-row">
                        <span>Phone:</span>
                        <strong>${order.customerPhone || 'N/A'}</strong>
                    </div>
                </div>
                
                <div class="detail-section">
                    <h3>Order Items</h3>
                    ${order.items?.map(item => `
                        <div class="order-item">
                            <div class="item-info">
                                <i class="${item.icon || 'fas fa-box'}"></i>
                                <div>
                                    <strong>${item.name}</strong>
                                    <small>Qty: ${item.quantity}</small>
                                </div>
                            </div>
                            <span>KES ${item.price?.toLocaleString()}</span>
                        </div>
                    `).join('') || '<p>No items</p>'}
                </div>
                
                <div class="detail-section">
                    <h3>Actions</h3>
                    <div class="form-actions">
                        <button class="btn btn-primary" onclick="updateOrderStatus('${order._id}', 'processing')">
                            Mark as Processing
                        </button>
                        <button class="btn btn-success" onclick="updateOrderStatus('${order._id}', 'completed')">
                            Mark as Completed
                        </button>
                        <button class="btn btn-danger" onclick="updateOrderStatus('${order._id}', 'cancelled')">
                            Cancel Order
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('order-modal').style.display = 'flex';
    };
    
    // Update order status
    window.updateOrderStatus = async (id, status) => {
        if (!confirm(`Are you sure you want to mark this order as ${status}?`)) return;
        
        try {
            const response = await fetch(`${API_BASE}/orders/${id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            
            if (response.ok) {
                loadOrders();
                document.getElementById('order-modal').style.display = 'none';
                alert(`Order marked as ${status}!`);
            } else {
                alert('Error updating order status');
            }
        } catch (error) {
            console.error('Error updating order status:', error);
            alert('Error updating order status');
        }
    };
    
    // Initialize search
    const initSearch = () => {
        const searchInput = document.getElementById('search-orders');
        if (!searchInput) return;
        
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const filtered = orders.filter(o => 
                o.orderNumber?.toLowerCase().includes(query) ||
                o.customerName?.toLowerCase().includes(query) ||
                o.customerPhone?.includes(query)
            );
            
            renderFilteredOrders(filtered);
        });
    };
    
    // Initialize filter
    const initFilter = () => {
        const filterSelect = document.getElementById('filter-status');
        if (!filterSelect) return;
        
        filterSelect.addEventListener('change', (e) => {
            const status = e.target.value;
            if (!status) {
                renderOrders();
            } else {
                const filtered = orders.filter(o => o.status === status);
                renderFilteredOrders(filtered);
            }
        });
    };
    
    // Render filtered orders
    const renderFilteredOrders = (filteredOrders) => {
        const tbody = document.getElementById('orders-table-body');
        if (!tbody) return;
        
        if (filteredOrders.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center">
                        <p>No orders found.</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = filteredOrders.map(order => `
            <tr>
                <td><strong>${order.orderNumber || 'N/A'}</strong></td>
                <td>
                    <div>${order.customerName || 'N/A'}</div>
                    <small style="color: #64748B;">${order.customerPhone || 'N/A'}</small>
                </td>
                <td>${order.items?.length || 0} items</td>
                <td><strong>KES ${order.total?.toLocaleString()}</strong></td>
                <td>
                    <span class="badge ${order.paymentStatus === 'completed' ? 'badge-success' : 'badge-warning'}">
                        ${order.paymentStatus || 'pending'}
                    </span>
                </td>
                <td>
                    <span class="status-badge status-${order.status}">
                        ${order.status}
                    </span>
                </td>
                <td>${new Date(order.createdAt).toLocaleDateString()}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="viewOrder('${order._id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-success" onclick="updateOrderStatus('${order._id}', 'completed')">
                        <i class="fas fa-check"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    };
    
    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
