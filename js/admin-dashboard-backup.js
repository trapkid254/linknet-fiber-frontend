
// js/admin-dashboard.js - Admin Dashboard
(function () {
    'use strict';

    const AUTH_KEY = 'linknet_admin_auth';
    const API_BASE = 'https://linknet-fiber-backend.onrender.com/api';

    // ── Auth helpers ────────────────────────────────────────────────────────────
    const getAuthData = () => {
        try {
            return JSON.parse(localStorage.getItem(AUTH_KEY));
        } catch (e) {
            return null;
        }
    };

    const getToken = () => {
        const d = getAuthData();
        return d ? d.token : null;
    };

    const authHeaders = () => ({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
    });

    const checkAuth = () => {
        const data = getAuthData();
        if (!data || !data.token) {
            window.location.href = 'login.html';
            return false;
        }
        if (data.expires && data.expires < Date.now()) {

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

    // ── Toast notification ──────────────────────────────────────────────────────
    const showToast = (message, type = 'info') => {
        const existing = document.querySelector('.toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.style.cssText = `
            position:fixed; bottom:24px; right:24px; z-index:9999;
            padding:12px 20px; border-radius:8px; color:#fff; font-weight:500;
            box-shadow:0 4px 12px rgba(0,0,0,.2); transition:opacity .3s;
            background:${type === 'success' ? '#38a169' : type === 'error' ? '#e53e3e' : '#3182ce'};
        `;
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 3500);
    };

    // ── User info in sidebar ────────────────────────────────────────────────────
    const updateUserInfo = () => {
        const data = getAuthData();
        if (!data) return;
        const nameEl = document.querySelector('.user-name');
        const roleEl = document.querySelector('.user-role');
        const avatarEl = document.querySelector('.user-avatar span');
        if (nameEl) nameEl.textContent = data.name || 'Admin';
        if (roleEl) roleEl.textContent = data.role || 'Administrator';
        if (avatarEl) avatarEl.textContent = (data.name || 'A')[0].toUpperCase();
    };

    // ── Logout ──────────────────────────────────────────────────────────────────
    const initLogout = () => {
        const btn = document.getElementById('logout-btn');
        if (btn) {
            btn.addEventListener('click', () => {

        
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


    // ── Sidebar mobile toggle ───────────────────────────────────────────────────
    const initSidebar = () => {
        const toggle = document.querySelector('.sidebar-toggle');
        const sidebar = document.querySelector('.admin-sidebar');
        if (!toggle || !sidebar) return;
        toggle.addEventListener('click', () => sidebar.classList.toggle('active'));
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 1024 && !sidebar.contains(e.target) && !toggle.contains(e.target)) {
                sidebar.classList.remove('active');
            }
        });
    };

    // ── Navigation ──────────────────────────────────────────────────────────────
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
        switch (section) {
            case 'packages':  loadPackagesSection(); break;
            case 'requests':  loadRequestsSection(); break;
            case 'coverage':  loadCoverageSection(); break;
            case 'customers': loadCustomersSection(); break;
            case 'analytics': loadAnalyticsSection(); break;
            case 'settings':  loadSettingsSection(); break;
        }
    };

    // ── Dashboard Stats ─────────────────────────────────────────────────────────
    const loadDashboardStats = async () => {
        try {
            const res = await fetch(`${API_BASE}/admin/dashboard/stats`, { headers: authHeaders() });
            if (!res.ok) throw new Error('Failed');
            const { stats } = await res.json();

            const set = (sel, val) => { const el = document.querySelector(sel); if (el) el.textContent = val; };
            set('[data-stat="total-requests"]',  stats.requests.total);
            set('[data-stat="pending-requests"]', stats.requests.pending);
            set('[data-stat="active-packages"]',  stats.packages.active);
            set('[data-stat="revenue"]',          `KES ${(stats.revenue.total / 1000).toFixed(0)}K`);

            // Fallback: update stat cards by label text
            document.querySelectorAll('.stat-card').forEach(card => {
                const label = card.querySelector('.stat-label')?.textContent?.trim();
                const valueEl = card.querySelector('.stat-value');
                if (!valueEl) return;
                if (label === 'Total Customers' || label === 'Total Requests') valueEl.textContent = stats.requests.total;
                if (label === 'Pending Requests') valueEl.textContent = stats.requests.pending;
                if (label === 'Active Packages') valueEl.textContent = stats.packages.active;
                if (label === 'Monthly Revenue') valueEl.textContent = `KES ${(stats.revenue.total / 1000).toFixed(0)}K`;
            });

            if (stats.recentRequests?.length) {
                loadRecentRequests(stats.recentRequests);
            }
        } catch (err) {
            console.warn('Stats load failed (using placeholders):', err.message);
        }
    };

    // ── Recent Requests table (reusable) ────────────────────────────────────────
    const loadRecentRequests = (requests) => {
        const tbody = document.getElementById('requests-table-body');
        if (!tbody) return;

        if (!requests || requests.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">No requests found</td></tr>';
            return;
        }

        tbody.innerHTML = requests.map(req => `
            <tr>
                <td>#${(req.requestId || req._id || '').toString().slice(-6).toUpperCase()}</td>
                <td>${escHtml(req.fullname || 'N/A')}</td>
                <td>${escHtml(req.packageId?.name || 'N/A')}</td>
                <td>${escHtml(req.county || 'N/A')}</td>
                <td>${req.createdAt ? new Date(req.createdAt).toLocaleDateString('en-KE') : 'N/A'}</td>
                <td><span class="status-badge ${req.status}">${req.status}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn view-request" data-id="${req._id}" title="View">
                            <i class="fas fa-eye"></i>
                        </button>
                        ${req.status === 'pending' ? `
                            <button class="action-btn approve-request" data-id="${req._id}" title="Approve" style="color:#38a169">
                                <i class="fas fa-check"></i>
                            </button>
                            <button class="action-btn reject-request" data-id="${req._id}" title="Reject" style="color:#e53e3e">
                                <i class="fas fa-times"></i>
                            </button>
                        ` : ''}
                        <button class="action-btn delete" data-id="${req._id}" title="Delete" style="color:#e53e3e">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        tbody.querySelectorAll('.view-request').forEach(btn =>
            btn.addEventListener('click', () => viewRequest(btn.dataset.id, requests)));
        tbody.querySelectorAll('.approve-request').forEach(btn =>
            btn.addEventListener('click', () => updateRequestStatus(btn.dataset.id, 'approved')));
        tbody.querySelectorAll('.reject-request').forEach(btn =>
            btn.addEventListener('click', () => updateRequestStatus(btn.dataset.id, 'rejected')));
        tbody.querySelectorAll('.delete').forEach(btn =>
            btn.addEventListener('click', () => deleteRequest(btn.dataset.id)));
    };

    // ── Request actions ─────────────────────────────────────────────────────────
    const viewRequest = (id, requests) => {
        const req = requests?.find(r => r._id === id);
        if (!req) return;
        const info = `
Customer: ${req.fullname}
Email: ${req.email}
Phone: ${req.phone}
Package: ${req.packageId?.name || 'N/A'}
County: ${req.county}, ${req.estate}
Status: ${req.status}
Date: ${new Date(req.createdAt).toLocaleString('en-KE')}
        `.trim();
        alert(info);
    };

    const updateRequestStatus = async (id, status) => {
        try {
            const res = await fetch(`${API_BASE}/admin/requests/${id}`, {
                method: 'PUT',
                headers: authHeaders(),
                body: JSON.stringify({ status })
            });
            if (!res.ok) throw new Error('Update failed');
            showToast(`Request ${status} successfully!`, 'success');
            loadDashboardStats();
        } catch (err) {
            showToast('Failed to update request', 'error');
        }
    };

    const deleteRequest = async (id) => {
        if (!confirm('Are you sure you want to delete this request?')) return;
        try {
            const res = await fetch(`${API_BASE}/admin/requests/${id}`, {
                method: 'DELETE',
                headers: authHeaders()
            });
            if (!res.ok) throw new Error('Delete failed');
            showToast('Request deleted', 'success');
            loadDashboardStats();
        } catch (err) {
            showToast('Failed to delete request', 'error');
        }
    };

    // ── Packages section ────────────────────────────────────────────────────────
    const loadPackagesSection = () => {
        const adminContent = document.querySelector('.admin-content');
        adminContent.innerHTML = `
            <div class="data-table-container">
                <div class="table-header">
                    <h3>Package Management</h3>
                    <button class="btn btn-primary btn-sm" id="add-package-btn">
                        <i class="fas fa-plus"></i> Add Package
                    </button>
                </div>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Name</th><th>Speed</th><th>Price (KES)</th>
                            <th>Features</th><th>Status</th><th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="packages-table-body">
                        <tr><td colspan="6" class="text-center"><i class="fas fa-spinner fa-spin"></i> Loading...</td></tr>
                    </tbody>
                </table>
            </div>
            <!-- Package Modal -->
            <div id="package-modal" class="modal">
                <div class="modal-overlay"></div>
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 id="modal-title">Add Package</h3>
                        <button class="modal-close"><i class="fas fa-times"></i></button>
                    </div>
                    <form id="package-form">
                        <input type="hidden" id="package-id">
                        <div class="form-group">
                            <label>Package Name *</label>
                            <input type="text" id="package-name" name="name" required placeholder="e.g. Basic, Pro, Business">
                        </div>
                        <div class="form-group">
                            <label>Speed (Mbps) *</label>
                            <input type="number" id="package-speed" name="speed" required min="1" placeholder="e.g. 20">
                        </div>
                        <div class="form-group">
                            <label>Price (KES/month) *</label>
                            <input type="number" id="package-price" name="price" required min="0" placeholder="e.g. 2999">
                        </div>
                        <div class="form-group">
                            <label>Features (one per line)</label>
                            <textarea id="package-features" name="features" rows="4" placeholder="Unlimited Data&#10;Free Installation&#10;WiFi Router"></textarea>
                        </div>
                        <div class="form-group">
                            <label><input type="checkbox" id="package-featured" name="featured"> Featured Package</label>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-outline modal-close">Cancel</button>
                            <button type="submit" class="btn btn-primary">Save Package</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        initPackageModal();
        loadPackages();
    };

    const loadPackages = async () => {
        const tbody = document.getElementById('packages-table-body');
        if (!tbody) return;

        try {
            const res = await fetch(`${API_BASE}/packages`);
            if (!res.ok) throw new Error('Failed');
            const json = await res.json();
            // API returns { success, count, data: [...] }
            const packages = json.data || json;

            if (!packages.length) {
                tbody.innerHTML = '<tr><td colspan="6" class="text-center">No packages found</td></tr>';
                return;
            }

            tbody.innerHTML = packages.map(pkg => `
                <tr>
                    <td><strong>${escHtml(pkg.name)}</strong></td>
                    <td>${pkg.speed} Mbps</td>
                    <td>KES ${(pkg.price || 0).toLocaleString()}</td>
                    <td>${(pkg.features || []).slice(0, 2).map(f => escHtml(f)).join(', ')}${(pkg.features || []).length > 2 ? '…' : ''}</td>
                    <td><span class="status-badge ${pkg.isActive !== false ? 'approved' : 'rejected'}">${pkg.isActive !== false ? 'Active' : 'Inactive'}</span></td>
                    <td>
                        <div class="action-buttons">
                            <button class="action-btn edit-package" data-id="${pkg._id}" title="Edit"><i class="fas fa-edit"></i></button>
                            <button class="action-btn delete delete-package" data-id="${pkg._id}" title="Delete" style="color:#e53e3e"><i class="fas fa-trash"></i></button>
                        </div>
                    </td>
                </tr>
            `).join('');

            tbody.querySelectorAll('.edit-package').forEach(btn =>
                btn.addEventListener('click', () => editPackage(packages.find(p => p._id === btn.dataset.id))));
            tbody.querySelectorAll('.delete-package').forEach(btn =>
                btn.addEventListener('click', () => deletePackage(btn.dataset.id)));

        } catch (err) {
            console.error('Packages load error:', err);
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Failed to load packages</td></tr>';
        }
    };

    const editPackage = (pkg) => {
        if (!pkg) return;
        const modal = document.getElementById('package-modal');
        document.getElementById('modal-title').textContent = 'Edit Package';
        document.getElementById('package-id').value = pkg._id;
        document.getElementById('package-name').value = pkg.name;
        document.getElementById('package-speed').value = pkg.speed;
        document.getElementById('package-price').value = pkg.price;
        document.getElementById('package-features').value = (pkg.features || []).join('\n');
        document.getElementById('package-featured').checked = !!pkg.featured;
        modal.classList.add('active');
    };

    const deletePackage = async (id) => {
        if (!confirm('Delete this package?')) return;
        try {
            const res = await fetch(`${API_BASE}/admin/packages/${id}`, {
                method: 'DELETE', headers: authHeaders()
            });
            if (!res.ok) throw new Error('Failed');
            showToast('Package deleted', 'success');
            loadPackages();
        } catch (err) {
            showToast('Failed to delete package', 'error');
        }
    };

    const initPackageModal = () => {
        const modal = document.getElementById('package-modal');
        if (!modal) return;
        const form = document.getElementById('package-form');
        const addBtn = document.getElementById('add-package-btn');


    
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


        modal.querySelectorAll('.modal-close').forEach(btn =>
            btn.addEventListener('click', () => modal.classList.remove('active')));
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('active'); });

        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const id = document.getElementById('package-id').value;
                const payload = {
                    name: document.getElementById('package-name').value.trim(),
                    speed: parseInt(document.getElementById('package-speed').value),
                    price: parseInt(document.getElementById('package-price').value),
                    features: document.getElementById('package-features').value.split('\n').map(f => f.trim()).filter(Boolean),
                    featured: document.getElementById('package-featured').checked
                };

                const url = id ? `${API_BASE}/admin/packages/${id}` : `${API_BASE}/admin/packages`;
                const method = id ? 'PUT' : 'POST';

                try {
                    const res = await fetch(url, {
                        method, headers: authHeaders(), body: JSON.stringify(payload)
                    });
                    if (!res.ok) {
                        const err = await res.json();
                        throw new Error(err.error || 'Save failed');
                    }
                    showToast(`Package ${id ? 'updated' : 'created'} successfully!`, 'success');
                    modal.classList.remove('active');
                    loadPackages();
                } catch (err) {
                    showToast(err.message || 'Failed to save package', 'error');

        
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


    // ── Requests section ────────────────────────────────────────────────────────

    
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

                        <select id="status-filter" class="form-control" style="width:auto;display:inline-block;margin-right:8px">
                            <option value="">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                            <option value="completed">Completed</option>
                        </select>
                    </div>
                </div>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>ID</th><th>Customer</th><th>Package</th>
                            <th>Location</th><th>Date</th><th>Status</th><th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="requests-table-body">
                        <tr><td colspan="7" class="text-center"><i class="fas fa-spinner fa-spin"></i> Loading...</td></tr>
                    </tbody>
                </table>
            </div>
        `;

        const filter = document.getElementById('status-filter');
        if (filter) filter.addEventListener('change', () => loadAllRequests(filter.value));
        loadAllRequests();
    };

    const loadAllRequests = async (status = '') => {
        const tbody = document.getElementById('requests-table-body');
        if (!tbody) return;

        try {
            const url = `${API_BASE}/admin/requests${status ? `?status=${status}` : ''}`;
            const res = await fetch(url, { headers: authHeaders() });
            if (!res.ok) throw new Error('Failed');
            const json = await res.json();
            loadRecentRequests(json.data || []);
        } catch (err) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center text-danger">Failed to load requests</td></tr>';
        }
    };

    // ── Coverage section ────────────────────────────────────────────────────────
    const loadCoverageSection = () => {
        document.querySelector('.admin-content').innerHTML = `
            <div class="coverage-section">
                <h3>Coverage Areas</h3>
                <div class="coverage-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px;margin-top:20px">
                    ${[
                        ['Nairobi', 85], ['Mombasa', 65], ['Kisumu', 50],
                        ['Nakuru', 45], ['Eldoret', 40], ['Thika', 60]
                    ].map(([name, pct]) => `
                        <div class="stat-card" style="padding:16px">
                            <strong>${name} County</strong>
                            <p style="margin:8px 0;color:#718096">Coverage: ${pct}%</p>
                            <div style="background:#e2e8f0;border-radius:4px;height:8px">
                                <div style="background:#667eea;width:${pct}%;height:100%;border-radius:4px"></div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    };

    // ── Customers section ───────────────────────────────────────────────────────
    const loadCustomersSection = () => {
        document.querySelector('.admin-content').innerHTML = `
            <div class="data-table-container">
                <h3>Customer Management</h3>
                <p style="color:#718096;margin-top:8px">Customer data is derived from approved installation requests.</p>
                <table class="data-table" style="margin-top:16px">
                    <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Package</th><th>Location</th><th>Status</th></tr></thead>
                    <tbody id="customers-table-body">
                        <tr><td colspan="6" class="text-center"><i class="fas fa-spinner fa-spin"></i> Loading...</td></tr>
                    </tbody>
                </table>
            </div>
        `;
        loadCustomers();
    };

    const loadCustomers = async () => {
        const tbody = document.getElementById('customers-table-body');
        if (!tbody) return;
        try {
            const res = await fetch(`${API_BASE}/admin/requests?status=approved`, { headers: authHeaders() });
            if (!res.ok) throw new Error('Failed');
            const json = await res.json();
            const customers = json.data || [];
            if (!customers.length) {
                tbody.innerHTML = '<tr><td colspan="6" class="text-center">No approved customers yet</td></tr>';
                return;
            }
            tbody.innerHTML = customers.map(c => `
                <tr>
                    <td>${escHtml(c.fullname)}</td>
                    <td>${escHtml(c.email)}</td>
                    <td>${escHtml(c.phone)}</td>
                    <td>${escHtml(c.packageId?.name || 'N/A')}</td>
                    <td>${escHtml(c.county)}, ${escHtml(c.estate)}</td>
                    <td><span class="status-badge approved">Active</span></td>
                </tr>
            `).join('');
        } catch (err) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Failed to load customers</td></tr>';
        }
    };

    // ── Analytics section ───────────────────────────────────────────────────────
    const loadAnalyticsSection = () => {
        document.querySelector('.admin-content').innerHTML = `
            <div class="analytics-section">
                <h3>Analytics & Reports</h3>
                <div id="analytics-stats" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:16px;margin-top:20px">
                    <div class="stat-card"><div class="stat-label">Total Requests</div><div class="stat-value" id="a-total">–</div></div>
                    <div class="stat-card"><div class="stat-label">Pending</div><div class="stat-value" id="a-pending">–</div></div>
                    <div class="stat-card"><div class="stat-label">Approved</div><div class="stat-value" id="a-approved">–</div></div>
                    <div class="stat-card"><div class="stat-label">Rejected</div><div class="stat-value" id="a-rejected">–</div></div>
                </div>
            </div>
        `;
        fetch(`${API_BASE}/admin/dashboard/stats`, { headers: authHeaders() })
            .then(r => r.json())
            .then(({ stats }) => {
                document.getElementById('a-total').textContent = stats.requests.total;
                document.getElementById('a-pending').textContent = stats.requests.pending;
                document.getElementById('a-approved').textContent = stats.requests.approved;
                document.getElementById('a-rejected').textContent = stats.requests.rejected;
            })
            .catch(() => {});
    };

    // ── Settings section ────────────────────────────────────────────────────────
    const loadSettingsSection = () => {
        const data = getAuthData();
        document.querySelector('.admin-content').innerHTML = `
            <div class="settings-section">
                <h3>Settings</h3>
                <div class="settings-form" style="max-width:500px;margin-top:20px">
                    <div class="form-group">
                        <label>Logged in as</label>
                        <input type="text" class="form-control" value="${escHtml(data?.name || 'Admin')}" readonly>
                    </div>
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" class="form-control" value="${escHtml(data?.email || '')}" readonly>
                    </div>
                    <div class="form-group">
                        <label>Role</label>
                        <input type="text" class="form-control" value="${escHtml(data?.role || 'admin')}" readonly>
                    </div>
                    <div class="form-group" style="margin-top:24px">
                        <button class="btn btn-danger" id="settings-logout">
                            <i class="fas fa-sign-out-alt"></i> Logout
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.getElementById('settings-logout')?.addEventListener('click', () => {
            localStorage.removeItem(AUTH_KEY);
            window.location.href = 'login.html';
        });
    };

    // ── Utility ─────────────────────────────────────────────────────────────────
    const escHtml = (str) => String(str || '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#039;');

    // ── Init ─────────────────────────────────────────────────────────────────────
    const init = () => {
        if (!checkAuth()) return;

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

        loadDashboardStats();
        // Init package modal if already on dashboard with package table
        if (document.getElementById('package-modal')) initPackageModal();
    };


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
