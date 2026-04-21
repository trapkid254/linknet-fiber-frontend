// js/about-coverage.js - Coverage search functionality for about.html page
(function() {
    'use strict';
    
    const coverageData = {
        nairobi: ['Westlands', 'Kilimani', 'Karen', 'Lavington', 'Kileleshwa', 'Parklands', 'Upper Hill', 'CBD', 'Runda', 'Muthaiga'],
        mombasa: ['Nyali', 'Bamburi', 'Diani', 'Mtwapa', 'Old Town', 'Kizingo', 'Shanzu', 'Likoni'],
        kisumu: ['Milimani', 'Kibuye', 'Mamboleo', 'Kanyakwar', 'Nyalenda', 'Kondele'],
        nakuru: ['Milimani', 'Section 58', 'Lanet', 'Njoro', 'London', 'Kiamunyi'],
        kericho: ['Kapsoya', 'Kipkelion', 'Ainamoi', 'Soin', 'Belgut', 'Elgon View', 'Langas', 'Pioneer', 'Kapsabet Road'],
        kiambu: ['Juja', 'Kenyatta road', 'Juja Farm', 'Ruiru', 'Thika', 'Githurai', 'Gachororo', 'JKUAT'],
    };
    
    const initAboutCoverageSearch = () => {
        const form = document.getElementById('about-coverage-form');
        if (!form) return;
        
        const countySelect = document.getElementById('about-county');
        const estateInput = document.getElementById('about-estate');
        const resultDiv = document.getElementById('about-coverage-result');
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const county = countySelect.value;
            const estate = estateInput.value.trim();
            
            if (!county || !estate) {
                showAboutResult('Please select a county and enter your estate/area.', 'error');
                return;
            }
            
            // Check coverage
            const countyLower = county.toLowerCase();
            const estateLower = estate.toLowerCase();
            
            let isAvailable = false;
            
            if (coverageData[countyLower]) {
                isAvailable = coverageData[countyLower].some(area => 
                    area.toLowerCase().includes(estateLower) || estateLower.includes(area.toLowerCase())
                );
            }
            
            // Also check if estate contains any part of available areas (manual input flexibility)
            if (!isAvailable && coverageData[countyLower]) {
                const estateWords = estateLower.split(/\s+/);
                isAvailable = estateWords.some(word => 
                    coverageData[countyLower].some(area => 
                        area.toLowerCase().includes(word) || word.includes(area.toLowerCase())
                    )
                );
            }
            
            if (isAvailable) {
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
                    <button class="btn btn-primary btn-sm" onclick="showToast('Thanks! We\\'ll notify you.', 'success')" style="margin-top: 10px;">Notify Me</button>
                `, 'error');
            }
        });
        
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
        
        // Allow manual county input - check if typed county matches any available county
        countySelect.addEventListener('input', () => {
            const inputCounty = countySelect.value.toLowerCase().trim();
            const availableCounties = Object.keys(coverageData);
            
            if (inputCounty) {
                const matchingCounty = availableCounties.find(county => 
                    county.toLowerCase() === inputCounty
                );
                
                if (matchingCounty) {
                    countySelect.setCustomValidity('');
                } else {
                    countySelect.setCustomValidity('Please select a valid county from the list');
                }
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
        document.addEventListener('DOMContentLoaded', initAboutCoverageSearch);
    } else {
        initAboutCoverageSearch();
    }
})();
