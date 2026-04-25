// js/admin-dashboard.js - Clean Admin Dashboard
const AUTH_KEY = 'linknet_admin_auth';
const API_BASE = 'https://linknet-fiber-backend.onrender.com/api';

// Utility functions - defined outside IIFE for global access
const getAuthHeaders = () => {
    const authData = localStorage.getItem(AUTH_KEY);
    console.log('Raw auth data from localStorage:', authData); // Debug
    
    if (!authData) {
        console.log('No auth data found, redirecting to login');
        window.location.href = '/admin/login/';
        return {};
    }
    
    try {
        const parsed = JSON.parse(authData);
        console.log('Parsed auth data:', parsed); // Debug
        
        if (parsed.expires && parsed.expires < Date.now()) {
            console.log('Token expired, removing and redirecting');
            localStorage.removeItem(AUTH_KEY);
            window.location.href = '/admin/login/';
            return {};
        }
        
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${parsed.token}`
        };
        console.log('Generated headers:', headers); // Debug
        return headers;
    } catch (error) {
        console.error('Error parsing auth data:', error);
        localStorage.removeItem(AUTH_KEY);
        window.location.href = '/admin/login/';
        return {};
    }
};

// Expose to window immediately
window.getAuthHeaders = getAuthHeaders;

const showToast = (message, type = 'info') => {
    // Remove any existing toasts to prevent stacking
    const existingToasts = document.querySelectorAll('.toast-notification');
    existingToasts.forEach(toast => toast.remove());
    
    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;
    
    // Create icon based on type
    const icon = type === 'success' ? 'fa-check-circle' : 
                type === 'error' ? 'fa-exclamation-circle' : 
                'fa-info-circle';
    
    toast.innerHTML = `
        <div class="toast-content">
            <i class="fas ${icon} toast-icon"></i>
            <span class="toast-message">${message}</span>
            <button class="toast-close" onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    // Add professional styling
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        color: #374151;
        padding: 0;
        border-radius: 8px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        z-index: 10000;
        min-width: 300px;
        max-width: 400px;
        border-left: 4px solid ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        animation: slideInRight 0.3s ease-out;
        font-family: 'Inter', sans-serif;
        font-size: 14px;
    `;
    
    // Add internal styles for toast content
    const style = document.createElement('style');
    style.textContent = `
        .toast-content {
            display: flex;
            align-items: center;
            padding: 12px 16px;
            gap: 12px;
        }
        .toast-icon {
            color: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
            font-size: 16px;
            flex-shrink: 0;
        }
        .toast-message {
            flex: 1;
            font-weight: 500;
            line-height: 1.4;
        }
        .toast-close {
            background: none;
            border: none;
            color: #9ca3af;
            cursor: pointer;
            padding: 4px;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            transition: all 0.2s ease;
        }
        .toast-close:hover {
            background: #f3f4f6;
            color: #6b7280;
        }
        @keyframes slideInRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        @keyframes slideOutRight {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(toast);
    
    // Auto-remove after 4 seconds with slide-out animation
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
            // Remove style element if no more toasts exist
            if (document.querySelectorAll('.toast-notification').length === 0) {
                style.remove();
            }
        }, 300);
    }, 4000);
};

// Expose to window immediately
window.showToast = showToast;

const hideModal = (modalId) => {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
    }
};

// Expose to window immediately
window.hideModal = hideModal;

(function() {
    'use strict';
    
    // Check authentication
    const checkAuth = () => {
        const authData = localStorage.getItem(AUTH_KEY);
        if (!authData) {
            window.location.href = '/admin/login/';
            return false;
        }
        
        try {
            const parsed = JSON.parse(authData);
            if (parsed.expires && parsed.expires < Date.now()) {
                localStorage.removeItem(AUTH_KEY);
                window.location.href = '/admin/login/';
                return false;
            }
            return parsed;
        } catch (e) {
            localStorage.removeItem(AUTH_KEY);
            window.location.href = '/admin/login/';
            return false;
        }
    };
    
    // Load dashboard statistics
    const loadDashboardStats = async () => {
        try {
            const headers = getAuthHeaders();
            console.log('Auth headers:', headers); // Debug log
            
            // First try test endpoint without auth to verify API is working
            const testResponse = await fetch(`${API_BASE}/admin/test`);
            console.log('Test endpoint response:', testResponse.status);
            
            const response = await fetch(`${API_BASE}/admin/dashboard/stats`, {
                headers: headers
            });
            
            console.log('Response status:', response.status); // Debug log
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error response:', errorText); // Debug log
                
                // If 403, try to refresh auth or use fallback
                if (response.status === 403) {
                    console.log('Token expired or invalid, attempting to re-authenticate...');
                    
                    // Try verify endpoint to check if token is valid
                    try {
                        const verifyResponse = await fetch(`${API_BASE}/admin/verify`, {
                            headers: headers
                        });
                        console.log('Verify response:', verifyResponse.status);
                        
                        if (verifyResponse.ok) {
                            const verifyData = await verifyResponse.json();
                            console.log('Verify data:', verifyData);
                        }
                    } catch (verifyError) {
                        console.error('Verify error:', verifyError);
                    }
                    
                    // For now, load mock data as fallback
                    loadMockStats();
                    return;
                }
                
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'Failed to load dashboard stats');
            }
            
            // Update stats cards with real data or 0
            const customers = data.stats.requests?.total || 0;
            const pending = data.stats.requests?.pending || 0;
            const packages = data.stats.packages?.active || 0;
            const revenue = data.stats.revenue?.total || 0;
            
            updateStatCard('Total Customers', customers, 'users');
            updateStatCard('Pending Requests', pending, 'clipboard-list');
            updateStatCard('Active Packages', packages, 'box');
            updateStatCard('Monthly Revenue', `KES ${revenue}`, 'chart-line');
            
            // Update stat change messages based on actual values
            updateStatChangeMessages(customers, pending, packages, revenue);
            
            // Load recent requests (always call to show empty state if no data)
            const recentRequests = data.stats.recentRequests || [];
            loadRecentRequests(recentRequests);
            
        } catch (error) {
            console.error('Stats load failed:', error);
            // Show 0 values when API fails
            updateStatCard('Total Customers', 0, 'users');
            updateStatCard('Pending Requests', 0, 'clipboard-list');
            updateStatCard('Active Packages', 0, 'box');
            updateStatCard('Monthly Revenue', 'KES 0', 'chart-line');
            updateStatChangeMessages(0, 0, 0, 0);
            // Show empty state for requests
            loadRecentRequests([]);
        }
    };
    
    const updateStatCard = (label, value, iconClass) => {
        const statCards = document.querySelectorAll('.stat-card');
        statCards.forEach(card => {
            const statLabel = card.querySelector('.stat-label');
            if (statLabel && statLabel.textContent === label) {
                card.querySelector('.stat-value').textContent = value;
                const icon = card.querySelector('.stat-icon i');
                if (icon) icon.className = `fas fa-${iconClass}`;
            }
        });
    };
    
    const updateStatChangeMessages = (customers, requests, packages, revenue) => {
        const statCards = document.querySelectorAll('.stat-card');
        
        statCards.forEach(card => {
            const label = card.querySelector('.stat-label').textContent;
            const changeElement = card.querySelector('.stat-change');
            
            if (label === 'Total Customers') {
                if (customers === 0) {
                    changeElement.innerHTML = '<i class="fas fa-info-circle"></i> No customers yet';
                    changeElement.className = 'stat-change';
                } else if (customers > 0) {
                    changeElement.innerHTML = '<i class="fas fa-arrow-up"></i> Active customers';
                    changeElement.className = 'stat-change positive';
                }
            } else if (label === 'Pending Requests') {
                if (requests === 0) {
                    changeElement.innerHTML = '<i class="fas fa-info-circle"></i> No requests yet';
                    changeElement.className = 'stat-change';
                } else {
                    changeElement.innerHTML = `<i class="fas fa-clock"></i> ${requests} pending`;
                    changeElement.className = 'stat-change';
                }
            } else if (label === 'Active Packages') {
                if (packages === 0) {
                    changeElement.innerHTML = '<i class="fas fa-info-circle"></i> No packages added';
                    changeElement.className = 'stat-change';
                } else {
                    changeElement.innerHTML = '<i class="fas fa-check"></i> All active';
                    changeElement.className = 'stat-change positive';
                }
            } else if (label === 'Monthly Revenue') {
                if (revenue === 0) {
                    changeElement.innerHTML = '<i class="fas fa-info-circle"></i> No revenue yet';
                    changeElement.className = 'stat-change';
                } else {
                    changeElement.innerHTML = '<i class="fas fa-arrow-up"></i> Generating revenue';
                    changeElement.className = 'stat-change positive';
                }
            }
        });
    };
    
    const loadAdminUserInfo = () => {
        const authData = localStorage.getItem(AUTH_KEY);
        if (!authData) return;
        
        try {
            const parsed = JSON.parse(authData);
            if (parsed.admin) {
                // Update user name
                const userNameEl = document.getElementById('user-name');
                if (userNameEl) {
                    userNameEl.textContent = parsed.admin.name || 'Admin User';
                }
                
                // Update user role
                const userRoleEl = document.getElementById('user-role');
                if (userRoleEl) {
                    userRoleEl.textContent = parsed.admin.role ? 
                        parsed.admin.role.charAt(0).toUpperCase() + parsed.admin.role.slice(1) : 
                        'Administrator';
                }
                
                // Update avatar initial
                const userAvatarEl = document.getElementById('user-avatar-initial');
                if (userAvatarEl && parsed.admin.name) {
                    const initial = parsed.admin.name.charAt(0).toUpperCase();
                    userAvatarEl.textContent = initial;
                }
            }
        } catch (error) {
            console.error('Error loading admin user info:', error);
        }
    };
    
    const loadRecentRequests = (requests) => {
        const tbody = document.getElementById('requests-table-body');
        if (!tbody) return;
        
        if (!requests || requests.length === 0) {
            // Show empty state
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 40px; color: rgba(255, 255, 255, 0.6);">
                        <i class="fas fa-inbox" style="font-size: 24px; margin-bottom: 16px; display: block;"></i>
                        <div style="font-size: 16px; margin-bottom: 8px;">No installation requests yet</div>
                        <div style="font-size: 14px;">When customers submit requests, they will appear here</div>
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = requests.map(req => `
            <tr>
                <td>#${req.requestId || req._id}</td>
                <td>${req.fullname || 'N/A'}</td>
                <td>${req.packageId?.name || 'N/A'}</td>
                <td>${req.county || 'N/A'}</td>
                <td>${new Date(req.createdAt || Date.now()).toLocaleDateString()}</td>
                <td><span class="status-badge ${req.status || 'pending'}">${req.status || 'Pending'}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn" title="View">
                            <i class="fas fa-eye"></i>
                        </button>
                        ${req.status === 'pending' ? `
                            <button class="action-btn" title="Approve">
                                <i class="fas fa-check"></i>
                            </button>
                        ` : ''}
                        <button class="action-btn delete" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    };
    
        
    // Navigation
    const initNavigation = () => {
        // Simple direct navigation
        document.querySelectorAll('.sidebar-nav a[data-section]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.dataset.section;
                
                // Update active state
                document.querySelectorAll('.sidebar-nav li').forEach(li => li.classList.remove('active'));
                link.parentElement.classList.add('active');
                
                // Update header
                const h1 = document.querySelector('.admin-header h1');
                if (h1) h1.textContent = section.charAt(0).toUpperCase() + section.slice(1);
                
                // Simple section switching
                if (section === 'settings') {
                    // Hide dashboard, show settings
                    document.getElementById('dashboard-section').style.display = 'none';
                    document.getElementById('settings-section').style.display = 'block';
                    // Load profile data
                    setTimeout(loadAdminProfile, 100);
                } else {
                    // Hide settings, show dashboard
                    document.getElementById('settings-section').style.display = 'none';
                    document.getElementById('dashboard-section').style.display = 'block';
                }
            });
        });
    };
    
        
    const loadDashboardSection = () => {
        // Show dashboard section
        const content = document.querySelector('.admin-content');
        if (!content) return;
        
        content.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-users"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-label">Total Customers</div>
                        <div class="stat-value" id="stat-customers">0</div>
                        <div class="stat-change" id="change-customers"><i class="fas fa-info-circle"></i> No customers yet</div>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-clipboard-list"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-label">Pending Requests</div>
                        <div class="stat-value" id="stat-requests">0</div>
                        <div class="stat-change" id="change-requests"><i class="fas fa-info-circle"></i> No requests yet</div>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-box"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-label">Active Packages</div>
                        <div class="stat-value" id="stat-packages">0</div>
                        <div class="stat-change" id="change-packages"><i class="fas fa-info-circle"></i> No packages added</div>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-chart-line"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-label">Monthly Revenue</div>
                        <div class="stat-value" id="stat-revenue">KES 0</div>
                        <div class="stat-change" id="change-revenue"><i class="fas fa-info-circle"></i> No revenue yet</div>
                    </div>
                </div>
            </div>
            
            <div class="data-table-container">
                <div class="table-header">
                    <h3>Recent Installation Requests</h3>
                    <div class="table-actions">
                        <button class="btn btn-outline btn-sm" onclick="loadRequests()">
                            <i class="fas fa-sync"></i> Refresh
                        </button>
                    </div>
                </div>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Customer</th>
                            <th>Package</th>
                            <th>Location</th>
                            <th>Date</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="requests-table-body">
                        <tr>
                            <td colspan="7" style="text-align: center; padding: 40px; color: rgba(255, 255, 255, 0.6);">
                                <i class="fas fa-clipboard-list" style="font-size: 48px; margin-bottom: 16px; display: block;"></i>
                                No installation requests found.
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
        
        // Load stats and requests
        loadDashboardStats();
    };
    
    const loadPackagesSection = () => {
        const content = document.querySelector('.admin-content');
        content.innerHTML = `
            <div class="data-table-container">
                <div class="table-header">
                    <h3>Package Management</h3>
                    <div class="table-actions">
                        <button class="btn btn-primary btn-sm" onclick="showPackageModal()">
                            <i class="fas fa-plus"></i> Add Package
                        </button>
                    </div>
                </div>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Speed</th>
                            <th>Price (KES)</th>
                            <th>Features</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="packages-table-body">
                        <tr>
                            <td colspan="6" style="text-align: center; padding: 40px; color: rgba(255, 255, 255, 0.6);">
                                <i class="fas fa-inbox" style="font-size: 48px; margin-bottom: 16px; display: block;"></i>
                                No packages found. Click "Add Package" to create your first package.
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
        loadPackages();
    };
    
    const loadRequestsSection = () => {
        const content = document.querySelector('.admin-content');
        content.innerHTML = `
            <div class="data-table-container">
                <div class="table-header">
                    <h3>Installation Requests</h3>
                    <div class="table-actions">
                        <button class="btn btn-outline btn-sm" onclick="loadRequests()">
                            <i class="fas fa-sync"></i> Refresh
                        </button>
                    </div>
                </div>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Customer</th>
                            <th>Package</th>
                            <th>Location</th>
                            <th>Date</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="requests-table-body">
                        <tr>
                            <td colspan="7" style="text-align: center; padding: 40px; color: rgba(255, 255, 255, 0.6);">
                                <i class="fas fa-clipboard-list" style="font-size: 48px; margin-bottom: 16px; display: block;"></i>
                                No installation requests found.
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
        loadRequests();
    };
    
    const loadCoverageSection = () => {
        const content = document.querySelector('.admin-content');
        content.innerHTML = `
            <div class="data-table-container">
                <div class="table-header">
                    <h3>Coverage Areas</h3>
                    <div class="table-actions">
                        <button class="btn btn-primary btn-sm" onclick="showCoverageModal()">
                            <i class="fas fa-plus"></i> Add Area
                        </button>
                    </div>
                </div>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>City/Area</th>
                            <th>Estate</th>
                            <th>County</th>
                            <th>Status</th>
                            <th>Added Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="coverage-table-body">
                        <tr>
                            <td colspan="6" style="text-align: center; padding: 40px; color: rgba(255, 255, 255, 0.6);">
                                <i class="fas fa-map-marked-alt" style="font-size: 48px; margin-bottom: 16px; display: block;"></i>
                                No coverage areas found. Click "Add Area" to add your first coverage area.
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
        loadCoverageAreas();
    };
    
    const loadCustomersSection = () => {
        const content = document.querySelector('.admin-content');
        content.innerHTML = `
            <div class="data-table-container">
                <div class="table-header">
                    <h3>Customer Management</h3>
                    <div class="table-actions">
                        <button class="btn btn-primary btn-sm" onclick="showCustomerModal()">
                            <i class="fas fa-plus"></i> Add Customer
                        </button>
                    </div>
                </div>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>County</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="customers-table-body">
                        <tr>
                            <td colspan="6" style="text-align: center; padding: 40px; color: rgba(255, 255, 255, 0.6);">
                                <i class="fas fa-users" style="font-size: 48px; margin-bottom: 16px; display: block;"></i>
                                No customers found. Click "Add Customer" to add your first customer.
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
        loadCustomers();
    };
    
    const loadAnalyticsSection = () => {
        const content = document.querySelector('.admin-content');
        content.innerHTML = `
            <div class="data-table-container">
                <div class="table-header">
                    <h3>Analytics & Reports</h3>
                    <div class="table-actions">
                        <button class="btn btn-outline btn-sm">
                            <i class="fas fa-download"></i> Export
                        </button>
                    </div>
                </div>
                <div style="padding: 40px; text-align: center;">
                    <i class="fas fa-chart-line" style="font-size: 64px; color: #D4AF37; margin-bottom: 20px;"></i>
                    <h3 style="color: #1E4D8C; margin-bottom: 10px;">Analytics Dashboard</h3>
                    <p style="color: #6B7280; max-width: 500px; margin: 0 auto;">Comprehensive analytics including revenue trends, customer growth, and service performance metrics.</p>
                </div>
            </div>
        `;
    };
    
    const loadSettingsSection = () => {
        const content = document.querySelector('.admin-content');
        content.innerHTML = `
            <div class="data-table-container">
                <div class="table-header">
                    <h3>Settings</h3>
                </div>
                <div style="padding: 40px; text-align: center;">
                    <i class="fas fa-cog" style="font-size: 64px; color: #D4AF37; margin-bottom: 20px;"></i>
                    <h3 style="color: #1E4D8C; margin-bottom: 10px;">System Settings</h3>
                    <p style="color: #6B7280; max-width: 500px; margin: 0 auto;">Configure system preferences, notification settings, and administrative options.</p>
                </div>
            </div>
        `;
    };
    
    // Sidebar mobile toggle
    const initSidebar = () => {
        const toggle = document.querySelector('.sidebar-toggle');
        const sidebar = document.querySelector('.admin-sidebar');
        if (!toggle || !sidebar) return;
        
        toggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });
        
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 1024 && !sidebar.contains(e.target) && !toggle.contains(e.target)) {
                sidebar.classList.remove('active');
            }
        });
    };
    
    // Logout functionality
    const initLogout = () => {
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                localStorage.removeItem(AUTH_KEY);
                showToast('Logged out successfully', 'success');
                setTimeout(() => {
                    window.location.href = '/admin/login/';
                }, 1000);
            });
        }
    };
    
    // Load packages from API
    const loadPackages = async () => {
        try {
            const response = await fetch(`${API_BASE}/admin/packages`, {
                headers: getAuthHeaders()
            });
            
            if (!response.ok) throw new Error('Failed to load packages');
            
            const data = await response.json();
            const tbody = document.getElementById('packages-table-body');
            if (!tbody) return;
            
            if (data.success && data.data && data.data.length > 0) {
                tbody.innerHTML = data.data.map(pkg => `
                    <tr>
                        <td>${pkg.name}</td>
                        <td>${pkg.speed} Mbps</td>
                        <td>KES ${pkg.price.toLocaleString()}</td>
                        <td>${pkg.features ? pkg.features.join(', ') : 'No features listed'}</td>
                        <td><span class="status-badge ${pkg.isActive ? 'approved' : 'cancelled'}">${pkg.isActive ? 'Active' : 'Inactive'}</span></td>
                        <td>
                            <div class="action-buttons">
                                <button class="action-btn" onclick="editPackage('${pkg._id}')">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="action-btn delete" onclick="deletePackage('${pkg._id}')">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `).join('');
            } else {
                // Show empty state
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" style="text-align: center; padding: 40px; color: rgba(255, 255, 255, 0.6);">
                            <i class="fas fa-inbox" style="font-size: 48px; margin-bottom: 16px; display: block;"></i>
                            No packages found. Click "Add Package" to create your first package.
                        </td>
                    </tr>
                `;
            }
        } catch (error) {
            console.error('Error loading packages:', error);
            showToast('Failed to load packages. Please try again.', 'error');
            // Show error state
            const tbody = document.getElementById('packages-table-body');
            if (tbody) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" style="text-align: center; padding: 40px; color: rgba(239, 68, 68, 0.8);">
                            <i class="fas fa-exclamation-triangle" style="font-size: 48px; margin-bottom: 16px; display: block;"></i>
                            Failed to load packages. Please refresh to try again.
                        </td>
                    </tr>
                `;
            }
        }
    };
    
    // Load requests from API
    const loadRequests = async () => {
        try {
            const response = await fetch(`${API_BASE}/admin/requests`, {
                headers: getAuthHeaders()
            });
            
            if (!response.ok) throw new Error('Failed to load requests');
            
            const data = await response.json();
            const tbody = document.getElementById('requests-table-body');
            if (!tbody) return;
            
            if (data.success && data.data && data.data.length > 0) {
                tbody.innerHTML = data.data.map(req => `
                    <tr>
                        <td>#${req.requestId || req._id}</td>
                        <td>${req.fullname || 'N/A'}</td>
                        <td>${req.packageId?.name || 'N/A'}</td>
                        <td>${req.county || 'N/A'}</td>
                        <td>${new Date(req.createdAt).toLocaleDateString()}</td>
                        <td><span class="status-badge ${req.status || 'pending'}">${req.status || 'Pending'}</span></td>
                        <td>
                            <div class="action-buttons">
                                <button class="action-btn" onclick="viewRequest('${req._id}')">
                                    <i class="fas fa-eye"></i>
                                </button>
                                ${req.status === 'pending' ? `
                                    <button class="action-btn" onclick="updateRequestStatus('${req._id}', 'approved')">
                                        <i class="fas fa-check"></i>
                                    </button>
                                ` : ''}
                                <button class="action-btn delete" onclick="deleteRequest('${req._id}')">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `).join('');
            } else {
                // Show empty state
                tbody.innerHTML = `
                    <tr>
                        <td colspan="7" style="text-align: center; padding: 40px; color: rgba(255, 255, 255, 0.6);">
                            <i class="fas fa-clipboard-list" style="font-size: 48px; margin-bottom: 16px; display: block;"></i>
                            No installation requests found.
                        </td>
                    </tr>
                `;
            }
        } catch (error) {
            console.error('Error loading requests:', error);
            showToast('Failed to load requests. Please try again.', 'error');
            // Show error state
            const tbody = document.getElementById('requests-table-body');
            if (tbody) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="7" style="text-align: center; padding: 40px; color: rgba(239, 68, 68, 0.8);">
                            <i class="fas fa-exclamation-triangle" style="font-size: 48px; margin-bottom: 16px; display: block;"></i>
                            Failed to load requests. Please refresh to try again.
                        </td>
                    </tr>
                `;
            }
        }
    };
    
    // Load coverage areas from API
    const loadCoverageAreas = async () => {
        try {
            const response = await fetch(`${API_BASE}/admin/coverage`, {
                headers: getAuthHeaders()
            });
            
            if (!response.ok) throw new Error('Failed to load coverage areas');
            
            const data = await response.json();
            const tbody = document.getElementById('coverage-table-body');
            if (!tbody) return;
            
            if (data.success && data.data && data.data.length > 0) {
                tbody.innerHTML = data.data.map(area => `
                    <tr>
                        <td>${area.city || 'N/A'}</td>
                        <td>${area.estate || 'N/A'}</td>
                        <td>${area.county || 'N/A'}</td>
                        <td><span class="status-badge ${area.status === 'available' ? 'approved' : area.status === 'coming_soon' ? 'pending' : 'cancelled'}">${area.status === 'coming_soon' ? 'Coming Soon' : area.status === 'available' ? 'Available' : 'Unavailable'}</span></td>
                        <td>${new Date(area.createdAt).toLocaleDateString()}</td>
                        <td>
                            <div class="action-buttons">
                                <button class="action-btn" onclick="editCoverage('${area._id}')">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="action-btn delete" onclick="deleteCoverage('${area._id}')">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `).join('');
            } else {
                // Show empty state
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" style="text-align: center; padding: 40px; color: rgba(255, 255, 255, 0.6);">
                            <i class="fas fa-map-marked-alt" style="font-size: 48px; margin-bottom: 16px; display: block;"></i>
                            No coverage areas found. Click "Add Area" to add your first coverage area.
                        </td>
                    </tr>
                `;
            }
        } catch (error) {
            console.error('Error loading coverage areas:', error);
            showToast('Failed to load coverage areas. Please try again.', 'error');
            // Show error state
            const tbody = document.getElementById('coverage-table-body');
            if (tbody) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" style="text-align: center; padding: 40px; color: rgba(239, 68, 68, 0.8);">
                            <i class="fas fa-exclamation-triangle" style="font-size: 48px; margin-bottom: 16px; display: block;"></i>
                            Failed to load coverage areas. Please refresh to try again.
                        </td>
                    </tr>
                `;
            }
        }
    };
    
    // Initialize everything
    const init = () => {
        checkAuth();
        loadDashboardStats();
        loadAdminUserInfo();
        initNavigation();
        initSidebar();
        initLogout();
        initFormHandlers();
        initSettings();
    };
    
    // Modal functions
    const showPackageModal = () => {
        const modal = document.getElementById('package-modal');
        if (modal) {
            modal.classList.add('active');
            
            // Reset form and clear edit mode
            const form = document.getElementById('package-form');
            form.reset();
            delete form.dataset.editId;
            
            // Reset modal title
            const modalTitle = document.querySelector('#package-modal h3');
            if (modalTitle) {
                modalTitle.textContent = 'Add New Package';
            }
        }
    };
    
    // Expose showPackageModal to window for use in other pages
    window.showPackageModal = showPackageModal;
    
    const showCustomerModal = () => {
        const modal = document.getElementById('customer-modal');
        if (modal) {
            modal.classList.add('active');
            document.getElementById('customer-form').reset();
        }
    };
    
    const showCoverageModal = () => {
        const modal = document.getElementById('coverage-modal');
        if (modal) {
            modal.classList.add('active');
            document.getElementById('coverage-form').reset();
        }
    };
    
    // Package operations
    const addPackage = async (formData) => {
        try {
            const response = await fetch(`${API_BASE}/admin/packages`, {
                method: 'POST',
                headers: {
                    ...getAuthHeaders(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            if (!response.ok) throw new Error('Failed to add package');
            
            showToast('Package added successfully', 'success');
            hideModal('package-modal');
            loadPackages();
        } catch (error) {
            console.error('Error adding package:', error);
            showToast('Failed to add package', 'error');
        }
    };
    
    const editPackage = async (id) => {
        try {
            const response = await fetch(`${API_BASE}/admin/packages/${id}`, {
                headers: getAuthHeaders()
            });
            
            if (!response.ok) throw new Error('Failed to fetch package');
            
            const result = await response.json();
            if (!result.success) {
                throw new Error(result.error || 'Failed to fetch package');
            }
            
            const packageData = result.data;
            
            // Set form to edit mode
            const form = document.getElementById('package-form');
            if (form) {
                form.dataset.editId = id;
            }
            
            // Update modal title
            const modalTitle = document.querySelector('#package-modal h3');
            if (modalTitle) {
                modalTitle.textContent = 'Edit Package';
            }
            
            // Populate form with package data
            document.getElementById('package-name').value = packageData.name || '';
            document.getElementById('package-speed').value = packageData.speed || '';
            document.getElementById('package-price').value = packageData.price || '';
            document.getElementById('package-category').value = packageData.category || 'home';
            document.getElementById('package-features').value = packageData.features ? packageData.features.join(', ') : '';
            
            showPackageModal();
        } catch (error) {
            console.error('Error editing package:', error);
            showToast('Failed to load package data', 'error');
        }
    };
    
    const deletePackage = async (id) => {
        if (!confirm('Are you sure you want to delete this package?')) return;
        
        try {
            const response = await fetch(`${API_BASE}/admin/packages/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            
            if (!response.ok) throw new Error('Failed to delete package');
            
            showToast('Package deleted successfully', 'success');
            loadPackages();
        } catch (error) {
            console.error('Error deleting package:', error);
            showToast('Failed to delete package', 'error');
        }
    };
    
    // Expose package operations to window for use in other pages
    window.editPackage = editPackage;
    window.deletePackage = deletePackage;
    
    // Request operations
    const updateRequestStatus = async (id, status) => {
        try {
            const response = await fetch(`${API_BASE}/admin/requests/${id}`, {
                method: 'PATCH',
                headers: {
                    ...getAuthHeaders(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status })
            });
            
            if (!response.ok) throw new Error('Failed to update request');
            
            showToast(`Request ${status} successfully`, 'success');
            loadRequests();
        } catch (error) {
            console.error('Error updating request:', error);
            showToast('Failed to update request', 'error');
        }
    };
    
    const deleteRequest = async (id) => {
        if (!confirm('Are you sure you want to delete this request?')) return;
        
        try {
            const response = await fetch(`${API_BASE}/admin/requests/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            
            if (!response.ok) throw new Error('Failed to delete request');
            
            showToast('Request deleted successfully', 'success');
            loadRequests();
        } catch (error) {
            console.error('Error deleting request:', error);
            showToast('Failed to delete request', 'error');
        }
    };
    
    // Coverage operations
    const addCoverageArea = async (formData) => {
        try {
            const response = await fetch(`${API_BASE}/admin/coverage`, {
                method: 'POST',
                headers: {
                    ...getAuthHeaders(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            if (!response.ok) throw new Error('Failed to add coverage area');
            
            showToast('Coverage area added successfully', 'success');
            hideModal('coverage-modal');
            loadCoverageAreas();
        } catch (error) {
            console.error('Error adding coverage area:', error);
            showToast('Failed to add coverage area', 'error');
        }
    };
    
    const editCoverage = async (id) => {
        try {
            const response = await fetch(`${API_BASE}/admin/coverage/${id}`, {
                headers: getAuthHeaders()
            });
            
            if (!response.ok) throw new Error('Failed to fetch coverage area');
            
            const coverageData = await response.json();
            // Populate form with coverage data
            document.getElementById('coverage-city').value = coverageData.city;
            document.getElementById('coverage-estate').value = coverageData.estate || '';
            document.getElementById('coverage-county').value = coverageData.county;
            
            showCoverageModal();
        } catch (error) {
            console.error('Error editing coverage area:', error);
            showToast('Failed to load coverage data', 'error');
        }
    };
    
    const deleteCoverage = async (id) => {
        if (!confirm('Are you sure you want to delete this coverage area?')) return;
        
        try {
            const response = await fetch(`${API_BASE}/admin/coverage/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            
            if (!response.ok) throw new Error('Failed to delete coverage area');
            
            showToast('Coverage area deleted successfully', 'success');
            loadCoverageAreas();
        } catch (error) {
            console.error('Error deleting coverage area:', error);
            showToast('Failed to delete coverage area', 'error');
        }
    };
    
    // Form submission handlers
    const handlePackageSubmit = async (event) => {
        event.preventDefault();
        
        const form = document.getElementById('package-form');
        const editId = form ? form.dataset.editId : null;
        
        // Validate required fields
        const name = document.getElementById('package-name').value;
        const speed = document.getElementById('package-speed').value;
        const price = document.getElementById('package-price').value;
        const category = document.getElementById('package-category')?.value || 'home';
        const features = document.getElementById('package-features').value;
        
        if (!name || !speed || !price || !features) {
            showToast('Please fill in all required fields', 'error');
            return;
        }
        
        const formData = {
            name: name.trim(),
            speed: parseInt(speed),
            price: parseInt(price),
            category: category,
            features: features.split(',').map(f => f.trim()).filter(f => f),
            isActive: true
        };
        
        console.log('Submitting package data:', formData);
        
        try {
            let response;
            let message;
            
            if (editId) {
                // Edit existing package
                response = await fetch(`${API_BASE}/admin/packages/${editId}`, {
                    method: 'PUT',
                    headers: {
                        ...getAuthHeaders(),
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });
                message = 'Package updated successfully';
            } else {
                // Create new package
                response = await fetch(`${API_BASE}/admin/packages`, {
                    method: 'POST',
                    headers: {
                        ...getAuthHeaders(),
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });
                message = 'Package added successfully';
            }
            
            console.log('Response status:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error response:', errorText);
                throw new Error(`Failed to ${editId ? 'update' : 'add'} package: ${response.status}`);
            }
            
            const result = await response.json();
            console.log('Response data:', result);
            
            if (!result.success) {
                throw new Error(result.error || `Failed to ${editId ? 'update' : 'add'} package`);
            }
            
            showToast(message, 'success');
            hideModal('package-modal');
            loadPackages();
            
            // Reset form and edit mode
            if (form) {
                form.reset();
                delete form.dataset.editId;
            }
            
            // Reset modal title
            const modalTitle = document.querySelector('#package-modal h3');
            if (modalTitle) {
                modalTitle.textContent = 'Add New Package';
            }
            
        } catch (error) {
            console.error(`Error ${editId ? 'updating' : 'adding'} package:`, error);
            showToast(`Failed to ${editId ? 'update' : 'add'} package`, 'error');
        }
    };
    
    const handleCustomerSubmit = async (event) => {
        event.preventDefault();
        
        const formData = {
            fullname: document.getElementById('customer-name').value,
            email: document.getElementById('customer-email').value,
            phone: document.getElementById('customer-phone').value,
            address: document.getElementById('customer-address').value,
            county: document.getElementById('customer-county').value,
            status: 'active'
        };
        
        try {
            const response = await fetch(`${API_BASE}/admin/customers`, {
                method: 'POST',
                headers: {
                    ...getAuthHeaders(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            if (!response.ok) throw new Error('Failed to add customer');
            
            showToast('Customer added successfully', 'success');
            hideModal('customer-modal');
            loadCustomers();
        } catch (error) {
            console.error('Error adding customer:', error);
            showToast('Failed to add customer', 'error');
        }
    };
    
    const handleCoverageSubmit = async (event) => {
        event.preventDefault();
        
        const formData = {
            city: document.getElementById('coverage-city').value,
            estate: document.getElementById('coverage-estate').value || null,
            county: document.getElementById('coverage-county').value,
            status: 'available'
        };
        
        await addCoverageArea(formData);
    };
    
    // Initialize form handlers
    const initFormHandlers = () => {
        const packageForm = document.getElementById('package-form');
        const coverageForm = document.getElementById('coverage-form');
        const addPackageBtn = document.getElementById('add-package-btn');
        
        if (packageForm) {
            packageForm.addEventListener('submit', handlePackageSubmit);
        }
        
        if (coverageForm) {
            coverageForm.addEventListener('submit', handleCoverageSubmit);
        }
        
        if (addPackageBtn) {
            addPackageBtn.addEventListener('click', showPackageModal);
        }
        
        // Initialize modal close buttons
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal-overlay');
                if (modal) {
                    modal.classList.remove('active');
                }
            });
        });
        
        // Close modal on overlay click
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    overlay.classList.remove('active');
                }
            });
        });
    };
    
    // Load customers function
    const loadCustomers = async () => {
        try {
            const response = await fetch(`${API_BASE}/admin/customers`, {
                headers: getAuthHeaders()
            });
            
            if (!response.ok) throw new Error('Failed to load customers');
            
            const data = await response.json();
            const tbody = document.getElementById('customers-table-body');
            if (!tbody) return;
            
            if (data.customers && data.customers.length > 0) {
                tbody.innerHTML = data.customers.map(customer => `
                    <tr>
                        <td>${customer.fullname}</td>
                        <td>${customer.email}</td>
                        <td>${customer.phone}</td>
                        <td>${customer.county}</td>
                        <td><span class="status-badge ${customer.status}">${customer.status}</span></td>
                        <td>
                            <div class="action-buttons">
                                <button class="action-btn" onclick="editCustomer('${customer._id}')">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="action-btn delete" onclick="deleteCustomer('${customer._id}')">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `).join('');
            }
        } catch (error) {
            console.error('Error loading customers:', error);
        }
    };
    
    // Make functions globally accessible
    window.showPackageModal = showPackageModal;
    window.showCustomerModal = showCustomerModal;
    window.showCoverageModal = showCoverageModal;
    window.hideModal = hideModal;
    window.editPackage = editPackage;
    window.deletePackage = deletePackage;
    window.updateRequestStatus = updateRequestStatus;
    window.deleteRequest = deleteRequest;
    window.editCoverage = editCoverage;
    window.deleteCoverage = deleteCoverage;
    window.handlePackageSubmit = handlePackageSubmit;
    window.handleCustomerSubmit = handleCustomerSubmit;
    window.handleCoverageSubmit = handleCoverageSubmit;
    
    // Settings functionality
    const loadAdminProfile = async () => {
        try {
            const response = await fetch(`${API_BASE}/admin/profile`, {
                headers: getAuthHeaders()
            });
            
            if (!response.ok) throw new Error('Failed to load profile');
            
            const result = await response.json();
            if (!result.success) throw new Error(result.error || 'Failed to load profile');
            
            const profile = result.data;
            
            // Update profile form
            document.getElementById('profile-name').value = profile.name || '';
            document.getElementById('profile-email').value = profile.email || '';
            document.getElementById('profile-phone').value = profile.phone || '';
            document.getElementById('profile-role').value = profile.role || '';
            
            // Update profile image if available
            if (profile.profileImage) {
                document.getElementById('profile-image-display').src = profile.profileImage;
            }
            
            // Show system settings for super admin
            if (profile.role === 'super_admin') {
                document.getElementById('system-settings-card').style.display = 'block';
                loadSystemSettings();
            }
            
        } catch (error) {
            console.error('Error loading profile:', error);
            showToast('Failed to load profile', 'error');
        }
    };
    
    // Expose loadAdminProfile to window for use in other pages
    window.loadAdminProfile = loadAdminProfile;
    
    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        
        const formData = {
            name: document.getElementById('profile-name').value,
            email: document.getElementById('profile-email').value,
            phone: document.getElementById('profile-phone').value
        };
        
        try {
            const response = await fetch(`${API_BASE}/admin/profile`, {
                method: 'PUT',
                headers: {
                    ...getAuthHeaders(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            if (!response.ok) throw new Error('Failed to update profile');
            
            const result = await response.json();
            if (!result.success) throw new Error(result.error || 'Failed to update profile');
            
            showToast('Profile updated successfully', 'success');
            
            // Update sidebar user info
            loadAdminUserInfo();
            
        } catch (error) {
            console.error('Error updating profile:', error);
            showToast('Failed to update profile', 'error');
        }
    };
    
    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        
        const currentPassword = document.getElementById('current-password').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        
        if (newPassword !== confirmPassword) {
            showToast('New passwords do not match', 'error');
            return;
        }
        
        if (newPassword.length < 6) {
            showToast('Password must be at least 6 characters', 'error');
            return;
        }
        
        try {
            const response = await fetch(`${API_BASE}/admin/change-password`, {
                method: 'POST',
                headers: {
                    ...getAuthHeaders(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    currentPassword,
                    newPassword
                })
            });
            
            if (!response.ok) throw new Error('Failed to change password');
            
            const result = await response.json();
            if (!result.success) throw new Error(result.error || 'Failed to change password');
            
            showToast('Password changed successfully', 'success');
            
            // Clear form
            document.getElementById('password-form').reset();
            updatePasswordStrength('');
            
        } catch (error) {
            console.error('Error changing password:', error);
            showToast(error.message || 'Failed to change password', 'error');
        }
    };
    
    const handleProfileImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        if (file.size > 5 * 1024 * 1024) {
            showToast('Image size must be less than 5MB', 'error');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = async (event) => {
            const imageData = event.target.result;
            
            try {
                const response = await fetch(`${API_BASE}/admin/profile/image`, {
                    method: 'POST',
                    headers: {
                        ...getAuthHeaders(),
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ imageData })
                });
                
                if (!response.ok) throw new Error('Failed to upload image');
                
                const result = await response.json();
                if (!result.success) throw new Error(result.error || 'Failed to upload image');
                
                // Update profile image display
                document.getElementById('profile-image-display').src = imageData;
                
                // Update sidebar avatar
                loadAdminUserInfo();
                
                showToast('Profile image updated successfully', 'success');
                
            } catch (error) {
                console.error('Error uploading image:', error);
                showToast('Failed to upload image', 'error');
            }
        };
        
        reader.readAsDataURL(file);
    };
    
    const loadSystemSettings = async () => {
        try {
            const response = await fetch(`${API_BASE}/admin/settings`, {
                headers: getAuthHeaders()
            });
            
            if (!response.ok) throw new Error('Failed to load settings');
            
            const result = await response.json();
            if (!result.success) throw new Error(result.error || 'Failed to load settings');
            
            const settings = result.data;
            
            // Populate system settings form
            document.getElementById('site-name').value = settings.siteName || '';
            document.getElementById('site-description').value = settings.siteDescription || '';
            document.getElementById('contact-email').value = settings.contactEmail || '';
            document.getElementById('contact-phone').value = settings.contactPhone || '';
            document.getElementById('support-email').value = settings.supportEmail || '';
            document.getElementById('whatsapp-number').value = settings.whatsappNumber || '';
            
            // Social media
            document.getElementById('facebook-url').value = settings.socialMedia?.facebook || '';
            document.getElementById('twitter-url').value = settings.socialMedia?.twitter || '';
            document.getElementById('instagram-url').value = settings.socialMedia?.instagram || '';
            document.getElementById('linkedin-url').value = settings.socialMedia?.linkedin || '';
            
            // Business hours
            document.getElementById('weekdays-hours').value = settings.businessHours?.weekdays || '';
            document.getElementById('saturday-hours').value = settings.businessHours?.saturday || '';
            document.getElementById('sunday-hours').value = settings.businessHours?.sunday || '';
            
            // Notifications
            document.getElementById('email-notifications').checked = settings.notifications?.emailNotifications || false;
            document.getElementById('sms-notifications').checked = settings.notifications?.smsNotifications || false;
            document.getElementById('new-request-alert').checked = settings.notifications?.newRequestAlert || false;
            document.getElementById('monthly-reports').checked = settings.notifications?.monthlyReports || false;
            
        } catch (error) {
            console.error('Error loading system settings:', error);
            showToast('Failed to load system settings', 'error');
        }
    };
    
    const handleSystemSettingsSubmit = async (e) => {
        e.preventDefault();
        
        const formData = {
            siteName: document.getElementById('site-name').value,
            siteDescription: document.getElementById('site-description').value,
            contactEmail: document.getElementById('contact-email').value,
            contactPhone: document.getElementById('contact-phone').value,
            supportEmail: document.getElementById('support-email').value,
            whatsappNumber: document.getElementById('whatsapp-number').value,
            socialMedia: {
                facebook: document.getElementById('facebook-url').value,
                twitter: document.getElementById('twitter-url').value,
                instagram: document.getElementById('instagram-url').value,
                linkedin: document.getElementById('linkedin-url').value
            },
            businessHours: {
                weekdays: document.getElementById('weekdays-hours').value,
                saturday: document.getElementById('saturday-hours').value,
                sunday: document.getElementById('sunday-hours').value
            },
            notifications: {
                emailNotifications: document.getElementById('email-notifications').checked,
                smsNotifications: document.getElementById('sms-notifications').checked,
                newRequestAlert: document.getElementById('new-request-alert').checked,
                monthlyReports: document.getElementById('monthly-reports').checked
            }
        };
        
        try {
            const response = await fetch(`${API_BASE}/admin/settings`, {
                method: 'PUT',
                headers: {
                    ...getAuthHeaders(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            if (!response.ok) throw new Error('Failed to update settings');
            
            const result = await response.json();
            if (!result.success) throw new Error(result.error || 'Failed to update settings');
            
            showToast('System settings updated successfully', 'success');
            
        } catch (error) {
            console.error('Error updating system settings:', error);
            showToast('Failed to update system settings', 'error');
        }
    };
    
    const updatePasswordStrength = (password) => {
        const strengthBar = document.getElementById('strength-bar');
        const strengthText = document.getElementById('strength-text');
        
        if (!password) {
            strengthBar.style.width = '0%';
            strengthBar.className = 'strength-bar';
            strengthText.textContent = 'Enter a password';
            return;
        }
        
        let strength = 0;
        let strengthLabel = '';
        let strengthClass = '';
        
        // Check password strength
        if (password.length >= 6) strength += 25;
        if (password.length >= 10) strength += 25;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
        if (/[0-9]/.test(password)) strength += 12.5;
        if (/[^a-zA-Z0-9]/.test(password)) strength += 12.5;
        
        if (strength <= 25) {
            strengthLabel = 'Weak';
            strengthClass = 'weak';
        } else if (strength <= 50) {
            strengthLabel = 'Fair';
            strengthClass = 'fair';
        } else if (strength <= 75) {
            strengthLabel = 'Good';
            strengthClass = 'good';
        } else {
            strengthLabel = 'Strong';
            strengthClass = 'strong';
        }
        
        strengthBar.style.width = `${strength}%`;
        strengthBar.className = `strength-bar ${strengthClass}`;
        strengthText.textContent = strengthLabel;
    };
    
    // Initialize settings event listeners
    const initSettings = () => {
        // Profile form
        const profileForm = document.getElementById('profile-form');
        if (profileForm) {
            profileForm.addEventListener('submit', handleProfileSubmit);
        }
        
        // Password form
        const passwordForm = document.getElementById('password-form');
        if (passwordForm) {
            passwordForm.addEventListener('submit', handlePasswordSubmit);
        }
        
        // Profile image upload
        const imageUpload = document.getElementById('profile-image-upload');
        if (imageUpload) {
            imageUpload.addEventListener('change', handleProfileImageUpload);
        }
        
        // System settings form
        const systemSettingsForm = document.getElementById('system-settings-form');
        if (systemSettingsForm) {
            systemSettingsForm.addEventListener('submit', handleSystemSettingsSubmit);
        }
        
        // Password strength meter
        const newPasswordInput = document.getElementById('new-password');
        if (newPasswordInput) {
            newPasswordInput.addEventListener('input', (e) => {
                updatePasswordStrength(e.target.value);
            });
        }
    };
    
        
    // Simple settings navigation function
    const showSettingsPage = () => {
        // Hide dashboard, show settings
        document.getElementById('dashboard-section').style.display = 'none';
        document.getElementById('settings-section').style.display = 'block';
        
        // Update header
        const h1 = document.querySelector('.admin-header h1');
        if (h1) h1.textContent = 'Settings';
        
        // Update active state
        document.querySelectorAll('.sidebar-nav li').forEach(li => li.classList.remove('active'));
        document.querySelector('a[onclick="showSettingsPage();"]').parentElement.classList.add('active');
        
        // Load profile data
        setTimeout(loadAdminProfile, 100);
    };
    
    // Simple dashboard navigation function
    const showDashboardPage = () => {
        // Hide settings, show dashboard
        document.getElementById('settings-section').style.display = 'none';
        document.getElementById('dashboard-section').style.display = 'block';
        
        // Update header
        const h1 = document.querySelector('.admin-header h1');
        if (h1) h1.textContent = 'Dashboard';
        
        // Update active state
        document.querySelectorAll('.sidebar-nav li').forEach(li => li.classList.remove('active'));
        document.querySelector('li:first-child').classList.add('active');
    };
    
    // Make functions globally accessible
    window.handleProfileSubmit = handleProfileSubmit;
    window.handlePasswordSubmit = handlePasswordSubmit;
    window.showPackageModal = showPackageModal;
    window.hideModal = hideModal;
    window.editPackage = editPackage;
    window.deletePackage = deletePackage;
    window.deleteRequest = deleteRequest;
    window.editCoverage = editCoverage;
    window.deleteCoverage = deleteCoverage;
    window.loadRequests = loadRequests;
    window.loadPackages = loadPackages;
    window.loadCoverageAreas = loadCoverageAreas;
    window.loadCustomers = loadCustomers;
    window.updateRequestStatus = updateRequestStatus;
    window.handleSystemSettingsSubmit = handleSystemSettingsSubmit;
    window.showSettingsPage = showSettingsPage;
    window.showDashboardPage = showDashboardPage;
    
    // Add missing functions for admin pages
    window.editCustomer = editCustomer;
    window.deleteCustomer = deleteCustomer;
    window.showAddCoverageModal = showAddCoverageModal;
    window.closeAddCoverageModal = closeAddCoverageModal;
    window.saveCoverage = saveCoverage;
    window.closeEditCoverageModal = closeEditCoverageModal;
    window.saveEditCoverage = saveEditCoverage;
    window.closeViewCoverageModal = closeViewCoverageModal;
    window.exportAnalytics = exportAnalytics;
    
    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
})();
