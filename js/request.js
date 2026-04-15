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
    
    // Load packages for dropdown
    const loadPackages = async () => {
        const packageSelect = document.getElementById('package');
        if (!packageSelect) return;
        
        try {
            const response = await fetch(`${API_BASE}/packages`);
            if (!response.ok) throw new Error('Failed to load packages');
            
            const packages = await response.json();
            
            packages.forEach(pkg => {
                const option = document.createElement('option');
                option.value = pkg.id;
                option.textContent = `${pkg.name} - ${pkg.speed} Mbps - KES ${pkg.price}/month`;
                option.dataset.price = pkg.price;
                packageSelect.appendChild(option);
            });
            
            // Check for pre-selected package from URL
            const urlParams = new URLSearchParams(window.location.search);
            const packageId = urlParams.get('package');
            if (packageId) {
                packageSelect.value = packageId;
            }
            
        } catch (error) {
            console.error('Error loading packages:', error);
            showResult('Unable to load packages. Please refresh the page.', 'error');
        }
    };
    
    // Handle form submission
    const initRequestForm = () => {
        const form = document.getElementById('installation-form');
        if (!form) return;
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            
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
                    const error = await response.json();
                    throw new Error(error.message || 'Failed to submit request');
                }
                
                const result = await response.json();
                
                showResult(`
                    <i class="fas fa-check-circle"></i>
                    <strong>Request Submitted Successfully!</strong><br>
                    Your reference number: <strong>${result.id || 'LN-' + Date.now()}</strong><br>
                    Our team will contact you within 1 hour to confirm your installation.
                `, 'success');
                
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
        loadPackages();
        initRequestForm();
    };
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();