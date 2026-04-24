// js/coverage-search.js - Dynamic coverage search functionality
(function() {
    'use strict';
    
    const API_BASE = 'https://linknet-fiber-backend.onrender.com/api';
    let coverageData = {};
    let isLoading = false;
    
    const initCoverageSearch = () => {
        const form = document.getElementById('coverage-form');
        if (!form) return;
        
        const countyInput = document.getElementById('county');
        const estateInput = document.getElementById('estate');
        const resultDiv = document.getElementById('coverage-result');
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const county = countyInput.value.trim();
            const estate = estateInput.value.trim();
            
            if (!county || !estate) {
                showResult('Please select a county and enter your estate/area.', 'error');
                return;
            }
            
            if (isLoading) return;
            
            // Show loading state
            isLoading = true;
            showResult('<i class="fas fa-spinner fa-spin"></i> Checking coverage...', 'loading');
            
            try {
                const response = await fetch(`${API_BASE}/coverage/search?county=${encodeURIComponent(county)}&estate=${encodeURIComponent(estate)}`);
                
                if (!response.ok) {
                    throw new Error('Failed to check coverage');
                }
                
                const data = await response.json();
                
                if (data.success) {
                    if (data.isAvailable) {
                        showResult(`
                            <i class="fas fa-check-circle"></i>
                            <strong>Great news!</strong> Linknet Fiber is available in ${estate}, ${county}.
                            <br>
                            <a href="packages.html" class="btn btn-primary btn-sm" style="margin-top: 10px;">View Available Packages</a>
                        `, 'success');
                    } else {
                        showResult(`
                            <i class="fas fa-info-circle"></i>
                            <strong>Coming soon!</strong> We're expanding our network. Enter your email to get notified when service becomes available in ${estate}.
                            <br>
                            <input type="email" placeholder="Your email address" style="margin-top: 10px; width: 100%;">
                            <button class="btn btn-primary btn-sm" onclick="showNotification('Thanks! We\\'ll notify you.', 'success')" style="margin-top: 10px;">Notify Me</button>
                        `, 'error');
                    }
                } else {
                    throw new Error(data.error || 'Failed to check coverage');
                }
            } catch (error) {
                console.error('Coverage search error:', error);
                showResult(`
                    <i class="fas fa-exclamation-triangle"></i>
                    <strong>Unable to check coverage</strong> Please try again later.
                    <br>
                    <button class="btn btn-outline btn-sm" onclick="this.parentElement.parentElement.innerHTML=''" style="margin-top: 10px;">Try Again</button>
                `, 'error');
            } finally {
                isLoading = false;
            }
        });
        
        // No need to load coverage data for dropdowns since we're using manual input
    };
    
    const showResult = (message, type) => {
        const resultDiv = document.getElementById('coverage-result');
        if (resultDiv) {
            resultDiv.className = `coverage-result ${type}`;
            resultDiv.innerHTML = message;
            resultDiv.style.display = 'block';
            
            // Scroll to result
            resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    };
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCoverageSearch);
    } else {
        initCoverageSearch();
    }
})();
