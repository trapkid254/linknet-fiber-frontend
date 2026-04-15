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
                
                // Load section content (can be implemented based on requirements)
                const section = link.dataset.section;
                console.log('Navigate to:', section);
                
                // Update header
                document.querySelector('.admin-header h1').textContent = 
                    section.charAt(0).toUpperCase() + section.slice(1);
            });
        });
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
    
    // Initialize dashboard
    const init = () => {
        if (!checkAuth()) return;
        
        initLogout();
        initSidebar();
        initNavigation();
        initPackageModal();
        loadPackages();
    };
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();