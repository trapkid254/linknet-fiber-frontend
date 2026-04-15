// js/admin-dashboard.js - Admin dashboard functionality
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
            const data = JSON.parse(authData);
            if (data.expires < Date.now()) {
                localStorage.removeItem(AUTH_KEY);
                window.location.href = 'login.html';
                return false;
            }
        } catch (e) {
            localStorage.removeItem(AUTH_KEY);
            window.location.href = 'login.html';
            return false;
        }
        
        return true;
    };
    
    // Logout
    const initLogout = () => {
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                localStorage.removeItem(AUTH_KEY);
                window.location.href = 'login.html';
            });
        }
    };
    
    // Sidebar toggle for mobile
    const initSidebar = () => {
        const toggleBtn = document.querySelector('.sidebar-toggle');
        const sidebar = document.querySelector('.admin-sidebar');
        
        if (toggleBtn && sidebar) {
            toggleBtn.addEventListener('click', () => {
                sidebar.classList.toggle('active');
            });
            
            // Close sidebar when clicking outside on mobile
            document.addEventListener('click', (e) => {
                if (window.innerWidth <= 1024) {
                    if (!sidebar.contains(e.target) && !toggleBtn.contains(e.target)) {
                        sidebar.classList.remove('active');
                    }
                }
            });
        }
    };
    
    // Navigation
    const initNavigation = () => {
        const navLinks = document.querySelectorAll('.sidebar-nav a[data-section]');
        
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Update active state
                document.querySelectorAll('.sidebar-nav li').forEach(li => li.classList.remove('active'));
                link.parentElement.classList.add('active');
                
                // Load section content based on section type
                const section = link.dataset.section;
                loadSectionContent(section);
                
                // Update header
                document.querySelector('.admin-header h1').textContent = 
                    section.charAt(0).toUpperCase() + section.slice(1);
            });
        });
    };
    
    // Load section content
    const loadSectionContent = (section) => {
        const adminContent = document.querySelector('.admin-content');
        
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
                console.log('Navigate to:', section);
        }
    };
    
    // Package Management Modal
    const initPackageModal = () => {
        const modal = document.getElementById('package-modal');
        const addBtn = document.getElementById('add-package-btn');
        const closeBtns = modal.querySelectorAll('.modal-close');
        const form = document.getElementById('package-form');
        
        // Open modal
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                document.getElementById('modal-title').textContent = 'Add New Package';
                form.reset();
                document.getElementById('package-id').value = '';
                modal.classList.add('active');
            });
        }
        
        // Close modal
        closeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                modal.classList.remove('active');
            });
        });
        
        // Close on overlay click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
        
        // Handle form submission
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const formData = new FormData(form);
                const data = Object.fromEntries(formData.entries());
                
                // Convert features to array
                data.features = data.features.split('\n').filter(f => f.trim());
                data.featured = data.featured === 'on';
                data.price = parseInt(data.price);
                data.speed = parseInt(data.speed);
                
                try {
                    const url = data.id 
                        ? `${API_BASE}/admin/packages/${data.id}`
                        : `${API_BASE}/admin/packages`;
                    
                    const method = data.id ? 'PUT' : 'POST';
                    
                    const response = await fetch(url, {
                        method,
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${JSON.parse(localStorage.getItem(AUTH_KEY)).token}`
                        },
                        body: JSON.stringify(data)
                    });
                    
                    if (!response.ok) throw new Error('Failed to save package');
                    
                    showToast('Package saved successfully!', 'success');
                    modal.classList.remove('active');
                    loadPackages(); // Reload packages table
                    
                } catch (error) {
                    console.error('Error saving package:', error);
                    showToast('Failed to save package', 'error');
                }
            });
        }
    };
    
    // Load packages table
    const loadPackages = async () => {
        const tbody = document.getElementById('packages-table-body');
        if (!tbody) return;
        
        try {
            const response = await fetch(`${API_BASE}/packages`);
            if (!response.ok) throw new Error('Failed to load packages');
            
            const packages = await response.json();
            
            tbody.innerHTML = packages.map(pkg => `
                <tr>
                    <td>${pkg.name}</td>
                    <td>${pkg.speed} Mbps</td>
                    <td>KES ${pkg.price.toLocaleString()}</td>
                    <td>${pkg.features.slice(0, 3).join(', ')}${pkg.features.length > 3 ? '...' : ''}</td>
                    <td><span class="status-badge approved">Active</span></td>
                    <td>
                        <div class="action-buttons">
                            <button class="action-btn edit-package" data-id="${pkg.id}" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="action-btn delete" data-id="${pkg.id}" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `).join('');
            
            // Add event listeners to edit buttons
            tbody.querySelectorAll('.edit-package').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = btn.dataset.id;
                    const pkg = packages.find(p => p.id == id);
                    if (pkg) {
                        editPackage(pkg);
                    }
                });
            });
            
        } catch (error) {
            console.error('Error loading packages:', error);
            // Load mock data
            loadMockPackages();
        }
    };
    
    const loadMockPackages = () => {
        const tbody = document.getElementById('packages-table-body');
        if (!tbody) return;
        
        const mockPackages = [
            { id: 1, name: 'Basic', speed: 20, price: 2999, features: ['Unlimited Data', 'Free Installation'], featured: false },
            { id: 2, name: 'Pro', speed: 50, price: 4999, features: ['Unlimited Data', 'Free Installation', 'WiFi 6 Router'], featured: true },
            { id: 3, name: 'Business', speed: 100, price: 9999, features: ['Unlimited Data', 'Static IP', 'Priority Support'], featured: false }
        ];
        
        tbody.innerHTML = mockPackages.map(pkg => `
            <tr>
                <td>${pkg.name}</td>
                <td>${pkg.speed} Mbps</td>
                <td>KES ${pkg.price.toLocaleString()}</td>
                <td>${pkg.features.join(', ')}</td>
                <td><span class="status-badge approved">Active</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn" title="Edit"><i class="fas fa-edit"></i></button>
                        <button class="action-btn delete" title="Delete"><i class="fas fa-trash"></i></button>
                    </div>
                </td>
            </tr>
        `).join('');
    };
    
    const editPackage = (pkg) => {
        const modal = document.getElementById('package-modal');
        const form = document.getElementById('package-form');
        
        document.getElementById('modal-title').textContent = 'Edit Package';
        document.getElementById('package-id').value = pkg.id;
        document.getElementById('package-name').value = pkg.name;
        document.getElementById('package-speed').value = pkg.speed;
        document.getElementById('package-price').value = pkg.price;
        document.getElementById('package-features').value = pkg.features.join('\n');
        document.getElementById('package-featured').checked = pkg.featured || false;
        
        modal.classList.add('active');
    };
    
    // Load dashboard statistics
    const loadDashboardStats = async () => {
        try {
            const authData = JSON.parse(localStorage.getItem(AUTH_KEY));
            const response = await fetch(`${API_BASE}/admin/dashboard/stats`, {
                headers: {
                    'Authorization': `Bearer ${authData.token}`
                }
            });
            
            if (!response.ok) throw new Error('Failed to load dashboard stats');
            
            const data = await response.json();
            
            // Update stats cards
            updateStatCard('Total Customers', data.stats.requests.total, 'users');
            updateStatCard('Pending Requests', data.stats.requests.pending, 'clipboard-list');
            updateStatCard('Active Packages', data.stats.packages.active, 'box');
            updateStatCard('Monthly Revenue', `KES ${(data.stats.revenue.total / 1000000).toFixed(1)}M`, 'chart-line');
            
            // Load recent requests
            loadRecentRequests(data.stats.recentRequests);
            
        } catch (error) {
            console.error('Error loading dashboard stats:', error);
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
                <td>${req.fullname}</td>
                <td>${req.packageId?.name || 'N/A'}</td>
                <td>${req.county}</td>
                <td>${new Date(req.createdAt).toLocaleDateString()}</td>
                <td><span class="status-badge ${req.status}">${req.status}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn view-request" data-id="${req._id}" title="View">
                            <i class="fas fa-eye"></i>
                        </button>
                        ${req.status === 'pending' ? `
                            <button class="action-btn approve-request" data-id="${req._id}" title="Approve">
                                <i class="fas fa-check"></i>
                            </button>
                        ` : ''}
                        <button class="action-btn delete" data-id="${req._id}" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
        
        // Add event listeners
        tbody.querySelectorAll('.view-request').forEach(btn => {
            btn.addEventListener('click', () => viewRequest(btn.dataset.id));
        });
        
        tbody.querySelectorAll('.approve-request').forEach(btn => {
            btn.addEventListener('click', () => updateRequestStatus(btn.dataset.id, 'approved'));
        });
    };
    
    const loadMockStats = () => {
        // Keep existing static data as fallback
        console.log('Loading mock dashboard data');
    };
    
    const viewRequest = (id) => {
        // Implement request view modal
        console.log('View request:', id);
    };
    
    const updateRequestStatus = async (id, status) => {
        try {
            const authData = JSON.parse(localStorage.getItem(AUTH_KEY));
            const response = await fetch(`${API_BASE}/admin/requests/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authData.token}`
                },
                body: JSON.stringify({ status })
            });
            
            if (!response.ok) throw new Error('Failed to update request');
            
            showToast('Request updated successfully!', 'success');
            loadDashboardStats(); // Reload data
            
        } catch (error) {
            console.error('Error updating request:', error);
            showToast('Failed to update request', 'error');
        }
    };
    
    // Section content loaders
    const loadPackagesSection = () => {
        const adminContent = document.querySelector('.admin-content');
        adminContent.innerHTML = `
            <div class="data-table-container">
                <div class="table-header">
                    <h3>Package Management</h3>
                    <div class="table-actions">
                        <button class="btn btn-primary btn-sm" id="add-package-btn">
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
                        <!-- Dynamically populated -->
                    </tbody>
                </table>
            </div>
        `;
        
        // Re-initialize package modal for this section
        initPackageModal();
        loadPackages();
    };
    
    const loadRequestsSection = () => {
        const adminContent = document.querySelector('.admin-content');
        adminContent.innerHTML = `
            <div class="data-table-container">
                <div class="table-header">
                    <h3>Installation Requests</h3>
                    <div class="table-actions">
                        <button class="btn btn-outline btn-sm">
                            <i class="fas fa-filter"></i> Filter
                        </button>
                        <button class="btn btn-primary btn-sm">
                            <i class="fas fa-download"></i> Export
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
                        <!-- Dynamically populated -->
                    </tbody>
                </table>
            </div>
        `;
        
        loadAllRequests();
    };
    
    const loadAllRequests = async () => {
        try {
            const authData = JSON.parse(localStorage.getItem(AUTH_KEY));
            const response = await fetch(`${API_BASE}/admin/requests`, {
                headers: {
                    'Authorization': `Bearer ${authData.token}`
                }
            });
            
            if (!response.ok) throw new Error('Failed to load requests');
            
            const data = await response.json();
            loadRecentRequests(data.data);
            
        } catch (error) {
            console.error('Error loading requests:', error);
            showToast('Failed to load requests', 'error');
        }
    };
    
    const loadCoverageSection = () => {
        const adminContent = document.querySelector('.admin-content');
        adminContent.innerHTML = `
            <div class="coverage-section">
                <h3>Coverage Areas Management</h3>
                <p>Manage service coverage areas and availability.</p>
                
                <div class="coverage-grid">
                    <div class="coverage-card">
                        <h4>Nairobi County</h4>
                        <p>Coverage: 85%</p>
                        <div class="coverage-bar">
                            <div class="coverage-progress" style="width: 85%"></div>
                        </div>
                    </div>
                    <div class="coverage-card">
                        <h4>Mombasa County</h4>
                        <p>Coverage: 65%</p>
                        <div class="coverage-bar">
                            <div class="coverage-progress" style="width: 65%"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    };
    
    const loadCustomersSection = () => {
        const adminContent = document.querySelector('.admin-content');
        adminContent.innerHTML = `
            <div class="data-table-container">
                <div class="table-header">
                    <h3>Customer Management</h3>
                    <div class="table-actions">
                        <button class="btn btn-primary btn-sm">
                            <i class="fas fa-user-plus"></i> Add Customer
                        </button>
                    </div>
                </div>
                
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>Package</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td colspan="6" class="text-center">Customer management feature coming soon</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
    };
    
    const loadAnalyticsSection = () => {
        const adminContent = document.querySelector('.admin-content');
        adminContent.innerHTML = `
            <div class="analytics-section">
                <h3>Analytics & Reports</h3>
                <p>View detailed analytics and generate reports.</p>
                
                <div class="analytics-grid">
                    <div class="analytics-card">
                        <h4>Revenue Trends</h4>
                        <canvas id="revenue-chart"></canvas>
                    </div>
                    <div class="analytics-card">
                        <h4>Customer Growth</h4>
                        <canvas id="growth-chart"></canvas>
                    </div>
                </div>
            </div>
        `;
    };
    
    const loadSettingsSection = () => {
        const adminContent = document.querySelector('.admin-content');
        adminContent.innerHTML = `
            <div class="settings-section">
                <h3>Settings</h3>
                <p>Configure system settings and preferences.</p>
                
                <div class="settings-form">
                    <div class="form-group">
                        <label>Company Name</label>
                        <input type="text" value="Linknet Fiber" class="form-control">
                    </div>
                    <div class="form-group">
                        <label>Contact Email</label>
                        <input type="email" value="info@linknetfiber.com" class="form-control">
                    </div>
                    <div class="form-group">
                        <label>Phone Number</label>
                        <input type="tel" value="+254 700 000 000" class="form-control">
                    </div>
                    <button class="btn btn-primary">Save Settings</button>
                </div>
            </div>
        `;
    };
    
    // Toast notification
    const showToast = (message, type = 'info') => {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    };
    
    // Update user info in sidebar
    const updateUserInfo = () => {
        const authData = JSON.parse(localStorage.getItem(AUTH_KEY));
        if (authData) {
            const userName = document.querySelector('.user-name');
            const userRole = document.querySelector('.user-role');
            const userAvatar = document.querySelector('.user-avatar span');
            
            if (userName) userName.textContent = authData.name || 'Admin User';
            if (userRole) userRole.textContent = authData.role || 'Administrator';
            if (userAvatar) userAvatar.textContent = (authData.name || 'A')[0].toUpperCase();
        }
    };
    
    // Initialize dashboard
    const init = () => {
        if (!checkAuth()) return;
        
        updateUserInfo();
        initLogout();
        initSidebar();
        initNavigation();
        initPackageModal();
        loadPackages();
        loadDashboardStats();
    };
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
