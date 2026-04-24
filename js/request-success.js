// request-success.js - Display installation request success data

document.addEventListener('DOMContentLoaded', () => {
    console.log('Request success page loaded');
    const successData = JSON.parse(localStorage.getItem('requestSuccessData'));
    console.log('Success data from localStorage:', successData);
    
    if (successData) {
        // Populate the success page with data
        document.getElementById('ref-number').textContent = successData.requestId;
        document.getElementById('fullname').textContent = successData.fullname;
        document.getElementById('email').textContent = successData.email;
        document.getElementById('phone').textContent = successData.phone;
        document.getElementById('county').textContent = successData.county;
        document.getElementById('estate').textContent = successData.estate;
        document.getElementById('street').textContent = successData.street;
        document.getElementById('building').textContent = successData.building;
        document.getElementById('house-number').textContent = successData.houseNumber;
        document.getElementById('package-name').textContent = successData.packageName;
        document.getElementById('billing-cycle').textContent = successData.billingCycle.charAt(0).toUpperCase() + successData.billingCycle.slice(1);
        document.getElementById('preferred-date').textContent = new Date(successData.preferredDate).toLocaleDateString();
        document.getElementById('preferred-time').textContent = successData.preferredTime.charAt(0).toUpperCase() + successData.preferredTime.slice(1);
        
        // Clear localStorage after displaying data
        localStorage.removeItem('requestSuccessData');
        
        // Clear when user navigates away via buttons
        document.querySelectorAll('.success-actions .btn').forEach(btn => {
            btn.addEventListener('click', () => {
                localStorage.removeItem('requestSuccessData');
            });
        });
    } else {
        // Show error message instead of redirecting
        console.error('No success data found in localStorage');
        const container = document.querySelector('.success-container');
        if (container) {
            container.innerHTML = `
                <div class="success-icon-wrapper" style="background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);">
                    <i class="fas fa-exclamation"></i>
                </div>
                <h1 class="success-title" style="background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">No Request Data Found</h1>
                <p class="success-subtitle">The request data could not be found. Please submit a new request.</p>
                <div class="success-actions">
                    <a href="request.html" class="btn btn-primary">Submit New Request</a>
                    <a href="index.html" class="btn btn-gold">Back to Home</a>
                </div>
            `;
        }
    }
});
