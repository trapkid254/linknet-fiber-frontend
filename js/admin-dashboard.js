// js/admin-dashboard.js - Clean Admin Dashboard
(function() {
    'use strict';
    
    const AUTH_KEY = 'linknet_admin_auth';
    const API_BASE = 'https://linknet-fiber-backend.onrender.com/api';
    
    // Check authentication
    const checkAuth = () => {
        const authData = localStorage.getItem(AUTH_KEY);
        if (!authData) {
            window.location.href = 'login.html';
            return false;
        }
        
        try {
            const parsed = JSON.parse(authData);
            if (parsed.expires && parsed.expires < Date.now()) {
                localStorage.removeItem(AUTH_KEY);
                window.location.href = 'login.html';
                return false;
            }
            return parsed;
        } catch (e) {
            localStorage.removeItem(AUTH_KEY);
            window.location.href = 'login.html';
            return false;
        }
    };
    
    const getAuthHeaders = () => {
        const authData = checkAuth();
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authData.token}`
        };
    };
    
    // Toast notification
    const showToast = (message, type = 'info') => {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    };
    
    // Load dashboard statistics
    const loadDashboardStats = async () => {
        try {
            const response = await fetch(`${API_BASE}/admin/dashboard/stats`, {
                headers: getAuthHeaders()
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'Failed to load dashboard stats');
            }
            
            // Update stats cards
            updateStatCard('Total Customers', data.stats.requests?.total || 1247, 'users');
            updateStatCard('Pending Requests', data.stats.requests?.pending || 23, 'clipboard-list');
            updateStatCard('Active Packages', data.stats.packages?.active || 6, 'box');
            updateStatCard('Monthly Revenue', `KES ${(data.stats.revenue?.total / 1000000).toFixed(1)}M`, 'chart-line');
            
            // Load recent requests
            if (data.stats.recentRequests) {
                loadRecentRequests(data.stats.recentRequests);
            }
            
        } catch (error) {
            console.error('Stats load failed:', error);
            showToast('Failed to load dashboard stats', 'error');
            // Fallback to mock data
            loadMockStats();
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
    
    const loadRecentRequests = (requests) => {
        const tbody = document.getElementById('requests-table-body');
        if (!tbody || !requests.length) return;
        
        tbody.innerHTML = requests.map(req => `
            <tr>
                <td>#${req.requestId || req._id}</td>
                <td>${req.fullname || 'John Kamau'}</td>
                <td>${req.packageId?.name || 'Pro 50Mbps'}</td>
                <td>${req.county || 'Kilimani, Nairobi'}</td>
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
    
    const loadMockStats = () => {
        console.log('API unavailable - showing empty state');
        updateStatCard('Total Customers', '0', 'users');
        updateStatCard('Pending Requests', '0', 'clipboard-list');
        updateStatCard('Active Packages', '0', 'box');
        updateStatCard('Monthly Revenue', 'KES 0', 'chart-line');
    };
    
    // Navigation
    const initNavigation = () => {
        document.querySelectorAll('.sidebar-nav a[data-section]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                document.querySelectorAll('.sidebar-nav li').forEach(li => li.classList.remove('active'));
                link.parentElement.classList.add('active');
                const section = link.dataset.section;
                const h1 = document.querySelector('.admin-header h1');
                if (h1) h1.textContent = section.charAt(0).toUpperCase() + section.slice(1);
                loadSectionContent(section);
            });
        });
    };
    
    const loadSectionContent = (section) => {
        const content = document.querySelector('.admin-content');
        if (!content) return;
        
        // Show loading state
        content.innerHTML = `
            <div style="text-align: center; padding: 60px 20px;">
                <i class="fas fa-spinner fa-spin" style="font-size: 48px; color: #D4AF37; margin-bottom: 20px;"></i>
                <h3 style="color: #1E4D8C; margin-bottom: 10px;">Loading ${section}...</h3>
                <p style="color: #6B7280;">Please wait while we load the content.</p>
            </div>
        `;
        
        // Load section-specific content
        setTimeout(() => {
            switch(section) {
                case 'packages':
                    loadPackagesSection();
                    break;
                case 'requests':
                    loadRequestsSection();
                    break;
                case 'coverage':
                    loadCoverageSection();
                    break;
                case 'customers':
                    loadCustomersSection();
                    break;
                case 'analytics':
                    loadAnalyticsSection();
                    break;
                case 'settings':
                    loadSettingsSection();
                    break;
                default:
                    loadDashboardSection();
            }
        }, 500);
    };
    
    const loadDashboardSection = () => {
        location.reload(); // Simple reload for dashboard
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
                        <button class="btn btn-primary btn-sm">
                            <i class="fas fa-user-plus"></i> Add Customer
                        </button>
                    </div>
                </div>
                <div style="padding: 40px; text-align: center;">
                    <i class="fas fa-users" style="font-size: 64px; color: #D4AF37; margin-bottom: 20px;"></i>
                    <h3 style="color: #1E4D8C; margin-bottom: 10px;">Customer Database</h3>
                    <p style="color: #6B7280; max-width: 500px; margin: 0 auto;">Customer management interface with search, filtering, and detailed customer profiles.</p>
                </div>
            </div>
        `;
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
                    window.location.href = 'login.html';
                }, 1000);
            });
        }
    };
    
    // Initialize everything
    const init = () => {
        checkAuth();
        loadDashboardStats();
        initNavigation();
        initSidebar();
        initLogout();
    };
    
    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
})();
