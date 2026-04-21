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
                }
            });
        }
    };

    // ── Requests section ────────────────────────────────────────────────────────
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
        updateUserInfo();
        initLogout();
        initSidebar();
        initNavigation();
        loadDashboardStats();
        // Init package modal if already on dashboard with package table
        if (document.getElementById('package-modal')) initPackageModal();
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
