// js/client-dashboard.js - Client Dashboard API Integration
(function() {
    'use strict';
    
    const API_BASE = 'https://linknet-fiber-backend.onrender.com/api';
    const CLIENT_TOKEN_KEY = 'clientToken';
    
    console.log('🔧 CLIENT DASHBOARD API_BASE SET TO:', API_BASE);
    
    // Authentication check
    const checkClientAuth = () => {
        const token = localStorage.getItem(CLIENT_TOKEN_KEY);
        if (!token) {
            window.location.href = '../login.html';
            return false;
        }
        return token;
    };
    
    // Get auth headers
    const getAuthHeaders = () => {
        const token = checkClientAuth();
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
    };
    
    // Load customer profile data
    const loadCustomerProfile = async () => {
        try {
            const response = await fetch(`${API_BASE}/customers/profile`, {
                headers: getAuthHeaders()
            });
            
            if (!response.ok) {
                if (response.status === 401) {
                    localStorage.removeItem(CLIENT_TOKEN_KEY);
                    window.location.href = '../login.html';
                    return;
                }
                throw new Error('Failed to load profile');
            }
            
            const data = await response.json();
            if (data.success && data.customer) {
                updateCustomerProfile(data.customer);
                updateDashboardStats(data.customer);
            }
        } catch (error) {
            console.error('Error loading customer profile:', error);
            showErrorMessage('Failed to load profile data');
        }
    };
    
    // Update customer profile UI
    const updateCustomerProfile = (customer) => {
        // Update profile information
        const profileName = document.getElementById('profile-name');
        const profileEmail = document.getElementById('profile-email');
        const profilePhone = document.getElementById('profile-phone');
        const profileAddress = document.getElementById('profile-address');
        
        if (profileName) profileName.textContent = customer.name || 'N/A';
        if (profileEmail) profileEmail.textContent = customer.email || 'N/A';
        if (profilePhone) profilePhone.textContent = customer.phone || 'N/A';
        if (profileAddress) profileAddress.textContent = customer.address || 'N/A';
        
        // Update welcome message
        const welcomeMessage = document.querySelector('.welcome-message h2');
        if (welcomeMessage) {
            welcomeMessage.textContent = `Welcome back, ${customer.name || 'Customer'}!`;
        }
    };
    
    // Update dashboard statistics
    const updateDashboardStats = (customer) => {
        // Update package information
        const packageName = document.getElementById('package-name');
        const packageSpeed = document.getElementById('package-speed');
        const packagePrice = document.getElementById('package-price');
        
        if (packageName) packageName.textContent = customer.package?.name || 'No Package';
        if (packageSpeed) packageSpeed.textContent = customer.package?.speed ? `${customer.package.speed} Mbps` : 'N/A';
        if (packagePrice) packagePrice.textContent = customer.package?.price ? `KES ${customer.package.price.toLocaleString()}/month` : 'N/A';
        
        // Update account status
        const accountStatus = document.getElementById('account-status');
        if (accountStatus) {
            accountStatus.textContent = customer.status || 'Active';
            accountStatus.className = `status-badge ${customer.status === 'active' ? 'approved' : 'pending'}`;
        }
    };
    
    // Load customer's installation requests
    const loadInstallationRequests = async () => {
        try {
            const response = await fetch(`${API_BASE}/customers/requests`, {
                headers: getAuthHeaders()
            });
            
            if (!response.ok) throw new Error('Failed to load requests');
            
            const data = await response.json();
            if (data.success && data.requests) {
                updateRequestsTable(data.requests);
            }
        } catch (error) {
            console.error('Error loading requests:', error);
        }
    };
    
    // Update requests table
    const updateRequestsTable = (requests) => {
        const tbody = document.getElementById('requests-table-body');
        if (!tbody) return;
        
        if (requests.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 40px; color: #6B7280;">
                        No installation requests found.
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = requests.map(request => `
            <tr>
                <td>${request.package?.name || 'N/A'}</td>
                <td>${request.status || 'Pending'}</td>
                <td>${new Date(request.createdAt).toLocaleDateString()}</td>
                <td>${request.estimatedDate ? new Date(request.estimatedDate).toLocaleDateString() : 'N/A'}</td>
                <td>
                    <button class="btn btn-sm btn-outline" onclick="viewRequestDetails('${request._id}')">
                        View Details
                    </button>
                </td>
            </tr>
        `).join('');
    };
    
    // Load billing information
    const loadBillingInfo = async () => {
        try {
            const response = await fetch(`${API_BASE}/customers/billing`, {
                headers: getAuthHeaders()
            });
            
            if (!response.ok) throw new Error('Failed to load billing');
            
            const data = await response.json();
            if (data.success && data.billing) {
                updateBillingSection(data.billing);
            }
        } catch (error) {
            console.error('Error loading billing:', error);
        }
    };
    
    // Update billing section
    const updateBillingSection = (billing) => {
        const currentBill = document.getElementById('current-bill');
        const dueDate = document.getElementById('due-date');
        const lastPayment = document.getElementById('last-payment');
        
        if (currentBill) currentBill.textContent = billing.currentAmount ? `KES ${billing.currentAmount.toLocaleString()}` : 'KES 0';
        if (dueDate) dueDate.textContent = billing.dueDate ? new Date(billing.dueDate).toLocaleDateString() : 'N/A';
        if (lastPayment) lastPayment.textContent = billing.lastPaymentDate ? new Date(billing.lastPaymentDate).toLocaleDateString() : 'N/A';
    };
    
    // Create new installation request
    const createInstallationRequest = async (requestData) => {
        try {
            const response = await fetch(`${API_BASE}/customers/requests`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(requestData)
            });
            
            if (!response.ok) throw new Error('Failed to create request');
            
            const data = await response.json();
            if (data.success) {
                showSuccessMessage('Installation request created successfully!');
                loadInstallationRequests(); // Refresh requests
                return true;
            }
        } catch (error) {
            console.error('Error creating request:', error);
            showErrorMessage('Failed to create installation request');
            return false;
        }
    };
    
    // Update customer profile
    const updateCustomerProfileData = async (profileData) => {
        try {
            const response = await fetch(`${API_BASE}/customers/profile`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(profileData)
            });
            
            if (!response.ok) throw new Error('Failed to update profile');
            
            const data = await response.json();
            if (data.success) {
                showSuccessMessage('Profile updated successfully!');
                loadCustomerProfile(); // Refresh profile
                return true;
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            showErrorMessage('Failed to update profile');
            return false;
        }
    };
    
    // Show success message
    const showSuccessMessage = (message) => {
        const toast = document.createElement('div');
        toast.className = 'toast success';
        toast.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
        `;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 4000);
    };
    
    // Show error message
    const showErrorMessage = (message) => {
        const toast = document.createElement('div');
        toast.className = 'toast error';
        toast.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            <span>${message}</span>
        `;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 4000);
    };
    
    // View request details
    const viewRequestDetails = (requestId) => {
        // Implement request details modal
        console.log('View request details:', requestId);
    };
    
    // Initialize client dashboard
    const initClientDashboard = () => {
        // Load all customer data
        loadCustomerProfile();
        loadInstallationRequests();
        loadBillingInfo();
    };
    
    // Expose functions globally
    window.clientDashboard = {
        loadCustomerProfile,
        loadInstallationRequests,
        loadBillingInfo,
        createInstallationRequest,
        updateCustomerProfileData,
        viewRequestDetails
    };
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initClientDashboard);
    } else {
        initClientDashboard();
    }
    
})();
