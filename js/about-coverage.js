// js/about-coverage.js - Dynamic coverage search functionality for about.html page
(function() {
    'use strict';
    
    const API_BASE = 'https://linknet-fiber-backend.onrender.com/api';
    let coverageData = {};
    let isLoading = false;
    
    const initAboutCoverageSearch = () => {
        const form = document.getElementById('about-coverage-form');
        if (!form) return;
        
        const countySelect = document.getElementById('about-county');
        const estateInput = document.getElementById('about-estate');
        const resultDiv = document.getElementById('about-coverage-result');
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const county = countySelect.value;
            const estate = estateInput.value.trim();
            
            if (!county || !estate) {
                showAboutResult('Please select a county and enter your estate/area.', 'error');
                return;
            }
            
            if (isLoading) return;
            
            // Show loading state
            isLoading = true;
            showAboutResult('<i class="fas fa-spinner fa-spin"></i> Checking coverage...', 'loading');
            
            try {
                const response = await fetch(`${API_BASE}/admin/public/coverage/search?county=${encodeURIComponent(county)}&estate=${encodeURIComponent(estate)}`);
                
                if (!response.ok) {
                    throw new Error('Failed to check coverage');
                }
                
                const data = await response.json();
                
                if (data.success) {
                    if (data.isAvailable) {
                        showAboutResult(`
                            <i class="fas fa-check-circle"></i>
                            <strong>Great news!</strong> Linknet Fiber is available in ${estate}, ${county}.
                            <br>
                            <a href="packages.html" class="btn btn-primary btn-sm" style="margin-top: 10px;">View Available Packages</a>
                        `, 'success');
                    } else {
                        showAboutResult(`
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
                showAboutResult(`
                    <i class="fas fa-exclamation-triangle"></i>
                    <strong>Unable to check coverage</strong> Please try again later.
                    <br>
                    <button class="btn btn-outline btn-sm" onclick="this.parentElement.parentElement.innerHTML=''" style="margin-top: 10px;">Try Again</button>
                `, 'error');
            } finally {
                isLoading = false;
            }
        });
        
        // Load coverage data and populate county dropdown
        const loadCoverageData = async () => {
            try {
                const response = await fetch(`${API_BASE}/admin/public/coverage`);
                if (!response.ok) throw new Error('Failed to load coverage data');
                
                const data = await response.json();
                if (data.success) {
                    // Convert API data to the format expected by the UI
                    coverageData = {};
                    data.coverage.forEach(countyData => {
                        coverageData[countyData.county.toLowerCase()] = countyData.estates;
                    });
                    
                    // Populate county dropdown
                    populateCountyDropdown(data.availableCounties || data.coverage.map(c => c.county));
                }
            } catch (error) {
                console.error('Failed to load coverage data:', error);
                // Fallback to static data if API fails
                coverageData = {
                    nairobi: ['Westlands', 'Kilimani', 'Karen', 'Lavington', 'Kileleshwa', 'Parklands', 'Upper Hill', 'CBD', 'Runda', 'Muthaiga'],
                    mombasa: ['Nyali', 'Bamburi', 'Diani', 'Mtwapa', 'Old Town', 'Kizingo', 'Shanzu', 'Likoni'],
                    kisumu: ['Milimani', 'Kibuye', 'Mamboleo', 'Kanyakwar', 'Nyalenda', 'Kondele'],
                    nakuru: ['Milimani', 'Section 58', 'Lanet', 'Njoro', 'London', 'Kiamunyi'],
                    kericho: ['Kapsoya', 'Kipkelion', 'Ainamoi', 'Soin', 'Belgut', 'Elgon View', 'Langas', 'Pioneer', 'Kapsabet Road'],
                    kiambu: ['Juja', 'Kenyatta road', 'Juja Farm', 'Ruiru', 'Thika', 'Githurai', 'Gachororo', 'JKUAT'],
                };
                populateCountyDropdown(Object.keys(coverageData));
            }
        };

        const populateCountyDropdown = (counties) => {
            countySelect.innerHTML = '<option value="">Select County</option>';
            counties.sort().forEach(county => {
                const option = document.createElement('option');
                option.value = county;
                option.textContent = county.charAt(0).toUpperCase() + county.slice(1);
                countySelect.appendChild(option);
            });
        };

        // Auto-suggest estates based on county
        countySelect.addEventListener('change', () => {
            const county = countySelect.value.toLowerCase();
            const datalistId = 'about-estate-suggestions';
            let datalist = document.getElementById(datalistId);
            
            if (!datalist) {
                datalist = document.createElement('datalist');
                datalist.id = datalistId;
                document.body.appendChild(datalist);
            }
            
            estateInput.setAttribute('list', datalistId);
            
            if (coverageData[county]) {
                datalist.innerHTML = coverageData[county]
                    .map(area => `<option value="${area}">`)
                    .join('');
            } else {
                datalist.innerHTML = '';
            }
        });

        // Real-time estate search as user types
        estateInput.addEventListener('input', () => {
            const county = countySelect.value.toLowerCase();
            const estate = estateInput.value.trim().toLowerCase();
            
            if (!county || !estate || estate.length < 2) return;
            
            const datalistId = 'about-estate-suggestions';
            let datalist = document.getElementById(datalistId);
            
            if (!datalist) {
                datalist = document.createElement('datalist');
                datalist.id = datalistId;
                document.body.appendChild(datalist);
            }
            
            estateInput.setAttribute('list', datalistId);
            
            if (coverageData[county]) {
                const suggestions = coverageData[county].filter(area => 
                    area.toLowerCase().includes(estate)
                );
                
                datalist.innerHTML = suggestions
                    .map(area => `<option value="${area}">`)
                    .join('');
            }
        });
    };
    
    const showAboutResult = (message, type) => {
        const resultDiv = document.getElementById('about-coverage-result');
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
        document.addEventListener('DOMContentLoaded', () => {
            initAboutCoverageSearch();
            loadCoverageData();
        });
    } else {
        initAboutCoverageSearch();
        loadCoverageData();
    }
})();
