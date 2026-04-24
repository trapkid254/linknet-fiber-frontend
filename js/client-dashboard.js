// client-dashboard.js - Client Portal Dashboard Implementation

document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    const token = localStorage.getItem('clientToken') || sessionStorage.getItem('clientToken');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }
    
    // Theme toggle functionality
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        // Load saved theme
        const savedTheme = localStorage.getItem('clientTheme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        updateThemeIcon(savedTheme);
        
        themeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('clientTheme', newTheme);
            updateThemeIcon(newTheme);
        });
    }
    
    // Sidebar toggle functionality
    const sidebarToggle = document.querySelector('.sidebar-toggle');
    const sidebar = document.querySelector('.client-sidebar');
    
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });
    }
    
    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768) {
            if (!sidebar.contains(e.target) && !sidebarToggle.contains(e.target)) {
                sidebar.classList.remove('open');
            }
        }
    });
    
    // Logout functionality
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            // Clear client session
            localStorage.removeItem('clientEmail');
            sessionStorage.removeItem('clientEmail');
            
            // Redirect to login page
            window.location.href = 'login.html';
        });
    }
    
    // New request button
    const newRequestBtn = document.getElementById('new-request-btn');
    if (newRequestBtn) {
        newRequestBtn.addEventListener('click', () => {
            // Redirect to request installation page
            window.location.href = '../request.html';
        });
    }
    
    // Load client data
    loadClientData();
    
    // Load dashboard data
    loadDashboardData();
    
    // Usage period selector
    const usagePeriod = document.getElementById('usage-period');
    if (usagePeriod) {
        usagePeriod.addEventListener('change', (e) => {
            updateUsageChart(e.target.value);
        });
    }
});

// Update theme icon
function updateThemeIcon(theme) {
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        const icon = themeToggle.querySelector('i');
        if (icon) {
            icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
    }
}

// Load client user information
function loadClientData() {
    const clientData = localStorage.getItem('clientData') || sessionStorage.getItem('clientData');
    
    if (clientData) {
        try {
            const client = JSON.parse(clientData);
            
            // Update user info in sidebar
            const userName = document.getElementById('user-name');
            const headerUsername = document.getElementById('header-username');
            const userAvatarInitial = document.getElementById('user-avatar-initial');
            
            const fullName = `${client.firstName} ${client.lastName}`;
            const firstName = client.firstName;
            
            if (userName) userName.textContent = fullName;
            if (headerUsername) headerUsername.textContent = firstName;
            if (userAvatarInitial) userAvatarInitial.textContent = firstName.charAt(0).toUpperCase();
        } catch (error) {
            console.error('Error parsing client data:', error);
        }
    }
}

// Load dashboard data
function loadDashboardData() {
    // TODO: Replace with actual API calls when backend is ready
    // For now, using mock data
    
    // Mock current package
    const currentPackage = document.getElementById('current-package');
    if (currentPackage) {
        currentPackage.textContent = 'Pro Plan';
    }
    
    // Mock next billing
    const nextBilling = document.getElementById('next-billing');
    const billingAmount = document.getElementById('billing-amount');
    if (nextBilling) {
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        nextBilling.textContent = nextMonth.toLocaleDateString('en-US', { 
            month: 'long', 
            year: 'numeric',
            day: 'numeric'
        });
    }
    if (billingAmount) {
        billingAmount.textContent = 'KES 4,500';
    }
    
    // Mock open tickets
    const openTickets = document.getElementById('open-tickets');
    if (openTickets) {
        openTickets.textContent = '0';
    }
    
    // Mock usage data
    updateUsageChart('month');
}

// Update usage chart based on period
function updateUsageChart(period) {
    const totalUsed = document.getElementById('total-used');
    const remaining = document.getElementById('remaining');
    const usageProgress = document.querySelector('.usage-progress');
    
    // Mock data based on period
    const usageData = {
        week: { used: '45 GB', remaining: '955 GB', percentage: 4.5 },
        month: { used: '245 GB', remaining: '755 GB', percentage: 24.5 },
        year: { used: '2.1 TB', remaining: '10.9 TB', percentage: 16.2 }
    };
    
    const data = usageData[period] || usageData.month;
    
    if (totalUsed) totalUsed.textContent = data.used;
    if (remaining) remaining.textContent = data.remaining;
    if (usageProgress) usageProgress.style.width = data.percentage + '%';
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 24px;
        border-radius: 12px;
        background: ${type === 'success' ? '#10B981' : type === 'error' ? '#EF4444' : '#3B82F6'};
        color: white;
        font-weight: 600;
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.2);
    `;
    notification.textContent = message;
    
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideIn 0.3s ease-out reverse';
        setTimeout(() => {
            notification.remove();
            style.remove();
        }, 300);
    }, 3000);
}
