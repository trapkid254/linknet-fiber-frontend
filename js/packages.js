// js/packages.js - Packages page functionality
(function() {
    'use strict';
    
    const API_BASE = 'https://linknet-fiber-backend.onrender.com/api';
    let currentPackages = [];
    let currentFilter = 'monthly';
    
    // Load packages from API
    const loadPackages = async () => {
        const container = document.getElementById('packages-container');
        if (!container) return;
        
        try {
            const response = await fetch(`${API_BASE}/packages`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch packages');
            }
            
            const result = await response.json();
            
            if (result.success && result.data) {
                currentPackages = result.data;
                displayPackages(currentPackages, currentFilter);
                updateComparisonTable(currentPackages);
            } else {
                throw new Error(result.error || 'Invalid packages data format');
            }
            
        } catch (error) {
            console.error('Error loading packages:', error);
            container.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Unable to load packages. Please try again later.</p>
                    <button onclick="location.reload()" class="btn btn-primary">Retry</button>
                </div>
            `;
            
            // Load mock data for demo
            loadMockPackages();
        }
    };
    
    // Mock data for demo purposes
    const loadMockPackages = () => {
        const mockPackages = [
            {
                id: 1,
                name: 'Basic',
                speed: 20,
                price: 2999,
                features: ['Unlimited Data', 'Free Installation', 'WiFi Router Included', '24/7 Support'],
                featured: false
            },
            {
                id: 2,
                name: 'Pro',
                speed: 50,
                price: 4999,
                features: ['Unlimited Data', 'Free Installation', 'WiFi 6 Router', '24/7 Priority Support', 'Static IP Available'],
                featured: true
            },
            {
                id: 3,
                name: 'Business',
                speed: 100,
                price: 9999,
                features: ['Unlimited Data', 'Free Installation', 'WiFi 6 Router', '24/7 Priority Support', 'Static IP Included', 'SLA Guarantee'],
                featured: false
            },
            {
                id: 4,
                name: 'Enterprise',
                speed: 500,
                price: 24999,
                features: ['Unlimited Data', 'Free Installation', 'Enterprise Router', '24/7 Dedicated Support', 'Multiple Static IPs', '99.9% SLA', 'Dedicated Account Manager'],
                featured: false
            }
        ];
        
        currentPackages = mockPackages;
        displayPackages(currentPackages, currentFilter);
        updateComparisonTable(currentPackages);
    };
    
    // Display packages with filter
    const displayPackages = (packages, filter) => {
        const container = document.getElementById('packages-container');
        if (!container) return;
        
        const filteredPackages = packages.map(pkg => {
            const newPkg = { ...pkg };
            
            // Apply discounts based on filter
            if (filter === 'quarterly') {
                newPkg.price = Math.round(pkg.price * 0.9);
                newPkg.period = 'quarter';
                newPkg.savings = 'Save 10%';
            } else if (filter === 'yearly') {
                newPkg.price = Math.round(pkg.price * 0.8);
                newPkg.period = 'year';
                newPkg.savings = 'Save 20%';
            } else {
                newPkg.period = 'month';
                newPkg.savings = null;
            }
            
            return newPkg;
        });
        
        container.innerHTML = filteredPackages.map(pkg => `
            <div class="package-card ${pkg.featured ? 'featured' : ''}">
                ${pkg.featured ? '<div class="package-badge">Most Popular</div>' : ''}
                ${pkg.savings ? `<div class="package-badge" style="background: var(--color-success);">${pkg.savings}</div>` : ''}
                <div class="package-header">
                    <h3 class="package-name">${pkg.name}</h3>
                    <div class="package-speed">${pkg.speed} <small>Mbps</small></div>
                </div>
                <div class="package-pricing">
                    <span class="price">KES ${pkg.price.toLocaleString()}</span>
                    <span class="period">/${pkg.period}</span>
                </div>
                <ul class="package-features">
                    ${pkg.features.map(feature => `
                        <li><i class="fas fa-check-circle"></i> ${feature}</li>
                    `).join('')}
                </ul>
                <div class="package-actions">
                    <a href="request.html?package=${pkg.id}" class="btn btn-primary btn-block">Request Installation</a>
                </div>
            </div>
        `).join('');
    };
    
    // Update comparison table
    const updateComparisonTable = (packages) => {
        const tbody = document.getElementById('comparison-body');
        if (!tbody) return;
        
        const features = [
            { name: 'Download Speed', getValue: pkg => `${pkg.speed} Mbps` },
            { name: 'Upload Speed', getValue: pkg => `${pkg.speed} Mbps` },
            { name: 'Data Limit', getValue: () => 'Unlimited' },
            { name: 'WiFi Router', getValue: pkg => pkg.features.some(f => f.includes('Router')) ? '✓ Included' : 'Optional' },
            { name: 'Static IP', getValue: pkg => pkg.features.some(f => f.includes('Static IP')) ? '✓ Available' : '—' },
            { name: 'SLA Guarantee', getValue: pkg => pkg.features.some(f => f.includes('SLA')) ? '✓ Yes' : '—' },
            { name: 'Support Level', getValue: pkg => {
                if (pkg.features.some(f => f.includes('Dedicated'))) return 'Dedicated 24/7';
                if (pkg.features.some(f => f.includes('Priority'))) return 'Priority 24/7';
                return 'Standard 24/7';
            }}
        ];
        
        tbody.innerHTML = features.map(feature => `
            <tr>
                <td><strong>${feature.name}</strong></td>
                ${packages.map(pkg => `<td>${feature.getValue(pkg)}</td>`).join('')}
            </tr>
        `).join('');
    };
    
    // Initialize filters
    const initFilters = () => {
        const filterBtns = document.querySelectorAll('.filter-btn');
        
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                currentFilter = btn.dataset.filter;
                displayPackages(currentPackages, currentFilter);
            });
        });
    };
    
    // Initialize
    const init = () => {
        loadPackages();
        initFilters();
    };
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();