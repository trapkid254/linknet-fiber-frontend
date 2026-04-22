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
        const authData = localStorage.getItem(AUTH_KEY);
        console.log('Raw auth data from localStorage:', authData); // Debug
        
        if (!authData) {
            console.log('No auth data found, redirecting to login');
            window.location.href = 'login.html';
            return {};
        }
        
        try {
            const parsed = JSON.parse(authData);
            console.log('Parsed auth data:', parsed); // Debug
            
            if (parsed.expires && parsed.expires < Date.now()) {
                console.log('Token expired, removing and redirecting');
                localStorage.removeItem(AUTH_KEY);
                window.location.href = 'login.html';
                return {};
            }
            
            const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${parsed.token}`
            };
            console.log('Generated headers:', headers); // Debug
            return headers;
        } catch (e) {
            console.error('Error parsing auth data:', e);
            localStorage.removeItem(AUTH_KEY);
            window.location.href = 'login.html';
            return {};
        }
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
            showToast('Failed to load dashboard statistics', 'error');
            loadMockStats();
        }
    };
    
    // Fallback mock stats function
    const loadMockStats = () => {
        console.log('Loading mock stats as fallback');
        updateStatCard('Total Customers', 1247, 'users');
        updateStatCard('Pending Requests', 23, 'clipboard-list');
        updateStatCard('Active Packages', 6, 'box');
        updateStatCard('Monthly Revenue', 'KES 2.4M', 'chart-line');
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
                    window.location.href = 'login.html';
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
            
            if (data.packages && data.packages.length > 0) {
                tbody.innerHTML = data.packages.map(pkg => `
                    <tr>
                        <td>${pkg.name}</td>
                        <td>${pkg.speed} Mbps</td>
                        <td>KES ${pkg.price.toLocaleString()}</td>
                        <td>${pkg.features.join(', ')}</td>
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
            }
        } catch (error) {
            console.error('Error loading packages:', error);
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
            
            if (data.requests && data.requests.length > 0) {
                tbody.innerHTML = data.requests.map(req => `
                    <tr>
                        <td>#${req.requestId || req._id}</td>
                        <td>${req.fullname}</td>
                        <td>${req.packageId?.name || 'N/A'}</td>
                        <td>${req.county}</td>
                        <td>${new Date(req.createdAt).toLocaleDateString()}</td>
                        <td><span class="status-badge ${req.status}">${req.status}</span></td>
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
            }
        } catch (error) {
            console.error('Error loading requests:', error);
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
            
            if (data.areas && data.areas.length > 0) {
                tbody.innerHTML = data.areas.map(area => `
                    <tr>
                        <td>${area.city}</td>
                        <td>${area.estate || 'N/A'}</td>
                        <td>${area.county}</td>
                        <td><span class="status-badge approved">Available</span></td>
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
            }
        } catch (error) {
            console.error('Error loading coverage areas:', error);
        }
    };
    
    // Initialize everything
    const init = () => {
        checkAuth();
        loadDashboardStats();
        initNavigation();
        initSidebar();
        initLogout();
        initFormHandlers();
    };
    
    // Modal functions
    const showPackageModal = () => {
        const modal = document.getElementById('package-modal');
        if (modal) {
            modal.classList.add('active');
            document.getElementById('package-form').reset();
        }
    };
    
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
    
    const hideModal = (modalId) => {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
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
            
            const packageData = await response.json();
            // Populate form with package data
            document.getElementById('package-name').value = packageData.name;
            document.getElementById('package-speed').value = packageData.speed;
            document.getElementById('package-price').value = packageData.price;
            document.getElementById('package-features').value = packageData.features.join(', ');
            
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
        
        const formData = {
            name: document.getElementById('package-name').value,
            speed: parseInt(document.getElementById('package-speed').value),
            price: parseInt(document.getElementById('package-price').value),
            features: document.getElementById('package-features').value.split(',').map(f => f.trim()),
            isActive: true
        };
        
        await addPackage(formData);
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
        
        if (packageForm) {
            packageForm.addEventListener('submit', handlePackageSubmit);
        }
        
        if (coverageForm) {
            coverageForm.addEventListener('submit', handleCoverageSubmit);
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
    
    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
})();
