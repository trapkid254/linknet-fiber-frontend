// js/contact.js - Contact page functionality
(function() {
    'use strict';
    
    const API_BASE = 'https://linknet-fiber-backend.onrender.com/api';
    
    // Load packages for dropdown
    const loadPackagesForSelect = async () => {
        const packageSelect = document.getElementById('package-select');
        if (!packageSelect) return;
        
        try {
            const response = await fetch(`${API_BASE}/packages`);
            if (!response.ok) throw new Error('Failed to load packages');
            
            const result = await response.json();
            const packages = result.success && result.data ? result.data : [];
            
            packages.forEach(pkg => {
                const option = document.createElement('option');
                option.value = pkg.id;
                option.textContent = `${pkg.name} - ${pkg.speed} Mbps - KES ${pkg.price}/month`;
                packageSelect.appendChild(option);
            });
            
            // Check for pre-selected package from URL
            const urlParams = new URLSearchParams(window.location.search);
            const packageId = urlParams.get('package');
            if (packageId) {
                packageSelect.value = packageId;
                document.getElementById('subject').value = 'installation';
            }
            
        } catch (error) {
            console.error('Error loading packages:', error);
            // Load mock packages as fallback
            loadMockPackages();
        }
    };
    
    // Mock packages for fallback
    const loadMockPackages = () => {
        const packageSelect = document.getElementById('package-select');
        if (!packageSelect) return;
        
        const mockPackages = [
            {
                id: 1,
                name: 'Basic',
                speed: 20,
                price: 2999
            },
            {
                id: 2,
                name: 'Pro',
                speed: 50,
                price: 4999
            },
            {
                id: 3,
                name: 'Business',
                speed: 100,
                price: 9999
            },
            {
                id: 4,
                name: 'Enterprise',
                speed: 500,
                price: 24999
            }
        ];
        
        mockPackages.forEach(pkg => {
            const option = document.createElement('option');
            option.value = pkg.id;
            option.textContent = `${pkg.name} - ${pkg.speed} Mbps - KES ${pkg.price}/month`;
            packageSelect.appendChild(option);
        });
    };
    
    // Handle contact form submission
    const initContactForm = () => {
        const form = document.getElementById('contact-form');
        if (!form) return;
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            
            // Validate phone number (Kenyan format)
            const phoneRegex = /^(?:\+254|0)[17]\d{8}$/;
            if (!phoneRegex.test(data.phone.replace(/\s/g, ''))) {
                showResult('Please enter a valid Kenyan phone number', 'error');
                return;
            }
            
            // Show loading state
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
            submitBtn.disabled = true;
            
            try {
                const response = await fetch(`${API_BASE}/contact`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data)
                });
                
                if (!response.ok) {
                    throw new Error('Failed to send message');
                }
                
                showResult('Thank you! Your message has been sent. We\'ll get back to you within 1 hour.', 'success');
                form.reset();
                
            } catch (error) {
                console.error('Error sending message:', error);
                showResult('Unable to send message. Please try again or call us directly.', 'error');
            } finally {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
    };
    
    const showResult = (message, type) => {
        const resultDiv = document.getElementById('contact-result');
        if (resultDiv) {
            resultDiv.className = `form-result ${type}`;
            resultDiv.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i> ${message}`;
            resultDiv.style.display = 'block';
            
            setTimeout(() => {
                resultDiv.style.display = 'none';
            }, 5000);
        }
    };
    
    // Initialize
    const init = () => {
        loadPackagesForSelect();
        initContactForm();
    };
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
