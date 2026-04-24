// request-success.js - Display installation request success data

document.addEventListener('DOMContentLoaded', () => {
    const successData = JSON.parse(sessionStorage.getItem('requestSuccessData'));
    
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
        
        // Clear sessionStorage
        sessionStorage.removeItem('requestSuccessData');
    } else {
        // Redirect to request page if no data
        window.location.href = 'request.html';
    }
});
