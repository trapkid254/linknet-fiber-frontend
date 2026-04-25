// js/request.js - Installation request functionality
(function() {
    'use strict';
    
    const API_BASE = 'https://linknet-fiber-backend.onrender.com/api';
    
    // Set minimum date for installation (tomorrow)
    const setMinDate = () => {
        const dateInput = document.getElementById('install-date');
        if (!dateInput) return;
        
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const year = tomorrow.getFullYear();
        const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
        const day = String(tomorrow.getDate()).padStart(2, '0');
        
        dateInput.min = `${year}-${month}-${day}`;
        
        // Set max date to 30 days from now
        const maxDate = new Date();
        maxDate.setDate(maxDate.getDate() + 30);
        const maxYear = maxDate.getFullYear();
        const maxMonth = String(maxDate.getMonth() + 1).padStart(2, '0');
        const maxDay = String(maxDate.getDate()).padStart(2, '0');
        dateInput.max = `${maxYear}-${maxMonth}-${maxDay}`;
    };
    
    // Load packages for card selection
    const loadPackages = async () => {
        const container = document.getElementById('packages-container');
        const packageInput = document.getElementById('package');
        if (!container || !packageInput) return;
        
        // Show container with loading state
        container.style.display = 'grid';
        container.innerHTML = '<div class="loading-spinner">Loading packages...</div>';
        
        // Force reflow to ensure display change takes effect
        void container.offsetHeight;
        
        try {
            const response = await fetch(`${API_BASE}/packages`);
            if (!response.ok) throw new Error('Failed to load packages');
            
            const result = await response.json();
            console.log('API Response:', result);
            
            // Handle both response formats: direct array or {success, data}
            let packages = [];
            if (Array.isArray(result)) {
                packages = result;
            } else if (result && result.data && Array.isArray(result.data)) {
                packages = result.data;
            } else if (result && result.packages && Array.isArray(result.packages)) {
                packages = result.packages;
            }
            
            console.log('Packages array:', packages);
            
            if (!Array.isArray(packages) || packages.length === 0) {
                console.log('No packages found, loading mock data');
                loadMockPackages(container, packageInput);
                return;
            }
            
            displayPackageCards(packages, container, packageInput);
            
            // Check for pre-selected package from URL
            const urlParams = new URLSearchParams(window.location.search);
            const packageId = urlParams.get('package');
            if (packageId) {
                selectPackage(packageId);
            }
            
        } catch (error) {
            console.error('Error loading packages:', error);
            // Load mock packages as fallback
            loadMockPackages(container, packageInput);
        }
    };
    
    // Display packages as cards
    const displayPackageCards = (packages, container, packageInput) => {
        container.innerHTML = packages.map(pkg => `
            <div class="package-selection-card" data-package-id="${pkg.id || pkg._id}" data-price="${pkg.price}">
                <div class="package-card-header">
                    <h4 class="package-name">${pkg.name}</h4>
                    <div class="package-speed">${pkg.speed} <small>Mbps</small></div>
                </div>
                <div class="package-card-price">
                    <span class="price">KES ${pkg.price.toLocaleString()}</span>
                    <span class="period">/month</span>
                </div>
                <ul class="package-features">
                    ${pkg.features ? pkg.features.slice(0, 3).map(feature => `
                        <li><i class="fas fa-check-circle"></i> ${feature}</li>
                    `).join('') : '<li><i class="fas fa-check-circle"></i> Unlimited Data</li><li><i class="fas fa-check-circle"></i> Free Installation</li><li><i class="fas fa-check-circle"></i> WiFi Router Included</li>'}
                </ul>
            </div>
        `).join('');
        
        // Add click handlers
        container.querySelectorAll('.package-selection-card').forEach(card => {
            card.addEventListener('click', () => {
                const packageId = card.dataset.packageId;
                selectPackage(packageId);
            });
        });
    };
    
    // Select a package
    const selectPackage = (packageId) => {
        const packageInput = document.getElementById('package');
        const cards = document.querySelectorAll('.package-selection-card');
        
        // Update hidden input
        packageInput.value = packageId;
        
        // Update card selection
        cards.forEach(card => {
            if (card.dataset.packageId === packageId) {
                card.classList.add('selected');
            } else {
                card.classList.remove('selected');
            }
        });
    };
    
    // Mock packages as fallback
    const loadMockPackages = (container, packageInput) => {
        const mockPackages = [
            { 
                id: 1, 
                name: 'Basic', 
                speed: 20, 
                price: 2999,
                features: ['Unlimited Data', 'Free Installation', 'WiFi Router Included']
            },
            { 
                id: 2, 
                name: 'Pro', 
                speed: 50, 
                price: 4999,
                features: ['Unlimited Data', 'Free Installation', 'WiFi 6 Router', '24/7 Priority Support']
            },
            { 
                id: 3, 
                name: 'Business', 
                speed: 100, 
                price: 9999,
                features: ['Unlimited Data', 'Free Installation', 'WiFi 6 Router', 'Static IP Included', 'SLA Guarantee']
            },
            { 
                id: 4, 
                name: 'Enterprise', 
                speed: 500, 
                price: 24999,
                features: ['Unlimited Data', 'Free Installation', 'Enterprise Router', '99.9% SLA', 'Dedicated Support']
            }
        ];
        
        displayPackageCards(mockPackages, container, packageInput);
    };
    
    // Handle form submission
    const initRequestForm = () => {
        const form = document.getElementById('installation-form');
        if (!form) return;
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            
            // Handle checkbox values - ensure they're booleans, not strings
            const termsCheckbox = form.querySelector('input[name="terms"]');
            const marketingCheckbox = form.querySelector('input[name="marketing"]');
            data.terms = termsCheckbox ? termsCheckbox.checked : false;
            data.marketing = marketingCheckbox ? marketingCheckbox.checked : false;
            
            // Remove checkbox string values if they exist
            delete data.terms;
            delete data.marketing;
            // Re-add as booleans
            data.terms = termsCheckbox ? termsCheckbox.checked : false;
            data.marketing = marketingCheckbox ? marketingCheckbox.checked : false;
            
            // Validate phone number
            const phoneRegex = /^(?:\+254|0)[17]\d{8}$/;
            if (!phoneRegex.test(data.phone.replace(/\s/g, ''))) {
                showResult('Please enter a valid Kenyan phone number (e.g., 0712 345 678)', 'error');
                return;
            }
            
            // Validate email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(data.email)) {
                showResult('Please enter a valid email address', 'error');
                return;
            }
            
            // Show loading state
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
            submitBtn.disabled = true;
            
            try {
                // Validate package is selected
                if (!data.packageId) {
                    showResult('Please select a package', 'error');
                    return;
                }
                
                console.log('Submitting request with data:', data);
                
                const response = await fetch(`${API_BASE}/requests`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        ...data,
                        status: 'pending',
                        createdAt: new Date().toISOString()
                    })
                });
                
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('Server error response:', errorText);
                    let error;
                    try {
                        error = JSON.parse(errorText);
                    } catch {
                        error = { message: errorText || 'Failed to submit request' };
                    }
                    // Show detailed error from server
                    const errorMessage = error.error || error.message || 'Failed to submit request';
                    if (error.details && Array.isArray(error.details)) {
                        throw new Error(`${errorMessage}: ${error.details.join(', ')}`);
                    }
                    throw new Error(errorMessage);
                }
                
                const result = await response.json();
                
                // Store data in localStorage and redirect to success page
                const successData = {
                    requestId: result.data?.requestId || 'LN-' + Date.now(),
                    fullname: data.fullname,
                    email: data.email,
                    phone: data.phone,
                    county: data.county,
                    estate: data.estate,
                    street: data.street,
                    building: data.building || '-',
                    houseNumber: data.houseNumber || '-',
                    packageName: result.data?.package?.name || 'Selected Package',
                    billingCycle: data.billingCycle,
                    preferredDate: data.preferredDate,
                    preferredTime: data.preferredTime
                };
                
                localStorage.setItem('requestSuccessData', JSON.stringify(successData));
                
                // Small delay to ensure localStorage is set before redirect
                setTimeout(() => {
                    window.location.href = '/request-success/';
                }, 100);
                
                form.reset();
                
                // Scroll to result
                document.getElementById('request-result').scrollIntoView({ behavior: 'smooth' });
                
            } catch (error) {
                console.error('Error submitting request:', error);
                showResult(error.message || 'Unable to submit request. Please try again.', 'error');
            } finally {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
    };
    
    const showResult = (message, type) => {
        const resultDiv = document.getElementById('request-result');
        if (resultDiv) {
            resultDiv.className = `form-result ${type}`;
            resultDiv.innerHTML = message;
            resultDiv.style.display = 'block';
        }
    };
    
    // Initialize
    const init = () => {
        setMinDate();
        
        // Add click handler for Select Package button
        const selectPackageBtn = document.getElementById('select-package-btn');
        if (selectPackageBtn) {
            selectPackageBtn.addEventListener('click', loadPackages);
        }
        
        initRequestForm();
    };
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
