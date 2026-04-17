// js/coverage-search.js - Coverage search functionality
(function() {
    'use strict';
    
    const coverageData = {
        nairobi: ['Westlands', 'Kilimani', 'Karen', 'Lavington', 'Kileleshwa', 'Parklands', 'Upper Hill', 'CBD'],
        mombasa: ['Nyali', 'Bamburi', 'Diani', 'Mtwapa', 'Old Town', 'Kizingo'],
        kisumu: ['Milimani', 'Kibuye', 'Mamboleo', 'Kanyakwar', 'Nyalenda'],
        nakuru: ['Milimani', 'Section 58', 'Lanet', 'Njoro', 'London'],
        kericho: ['Kapsoya', 'Kipkelion', 'Ainamoi', 'Soin', 'Belgut'],
        kiambu: ['Juja', 'Kenyatta road', 'Juja Farm', 'Ruiru', 'Thika', 'Githurai'],
    };
    
    const initCoverageSearch = () => {
        const form = document.getElementById('coverage-form');
        if (!form) return;
        
        const countySelect = document.getElementById('county');
        const estateInput = document.getElementById('estate');
        const resultDiv = document.getElementById('coverage-result');
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const county = countySelect.value;
            const estate = estateInput.value.trim();
            
            if (!county || !estate) {
                showResult('Please select a county and enter your estate/area.', 'error');
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
            
            if (isAvailable) {
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
                    <button class="btn btn-primary btn-sm" onclick="showToast('Thanks! We\\'ll notify you.', 'success')" style="margin-top: 10px;">Notify Me</button>
                `, 'error');
            }
        });
        
        // Auto-suggest estates based on county
        countySelect.addEventListener('change', () => {
            const county = countySelect.value.toLowerCase();
            const datalistId = 'estate-suggestions';
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