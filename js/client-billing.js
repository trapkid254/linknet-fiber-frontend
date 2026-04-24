// client-billing.js - Client Billing Page Logic

document.addEventListener('DOMContentLoaded', () => {
    setupPaymentModal();
    loadBillingData();
});

function setupPaymentModal() {
    const modal = document.getElementById('mpesa-payment-modal');
    const closeBtn = document.getElementById('close-mpesa-modal');
    const payBtn = document.getElementById('pay-btn');
    const form = document.getElementById('mpesa-payment-form');

    if (payBtn) {
        payBtn.addEventListener('click', openPaymentModal);
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.classList.remove('active');
        });
    }

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });

    if (form) {
        form.addEventListener('submit', handlePaymentSubmit);
    }
}

async function openPaymentModal() {
    const modal = document.getElementById('mpesa-payment-modal');
    const clientProfile = await fetchClientProfile();
    
    // Auto-fill phone number from client profile
    if (clientProfile) {
        const phoneInput = document.getElementById('mpesa-phone');
        if (phoneInput) {
            phoneInput.value = clientProfile.mpesaNumber || clientProfile.phone || '';
        }
    }
    
    // Set default amount from current bill
    const currentBill = document.getElementById('current-bill');
    if (currentBill) {
        const amountInput = document.getElementById('mpesa-amount');
        if (amountInput) {
            // Extract amount from "KES 4,500" format
            const amountText = currentBill.textContent.replace('KES ', '').replace(/,/g, '');
            amountInput.value = amountText;
        }
    }
    
    modal.classList.add('active');
}

async function handlePaymentSubmit(e) {
    e.preventDefault();
    
    const token = getClientToken();
    if (!token) {
        alert('Please login to make a payment');
        return;
    }

    const amount = document.getElementById('mpesa-amount').value;
    const phone = document.getElementById('mpesa-phone').value;
    const reference = document.getElementById('mpesa-reference').value;

    // Validate phone number format
    const phoneRegex = /^07[0-9]{8}$/;
    if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
        alert('Please enter a valid Kenyan phone number (e.g., 0712 345 678)');
        return;
    }

    // Validate amount
    if (amount < 1) {
        alert('Please enter a valid amount');
        return;
    }

    // Show loading state
    const form = document.getElementById('mpesa-payment-form');
    const submitBtn = document.getElementById('initiate-payment-btn');
    const paymentStatus = document.getElementById('payment-status');
    
    form.style.display = 'none';
    paymentStatus.style.display = 'block';

    try {
        // Call backend to initiate M-Pesa payment
        const response = await fetch(`${API_BASE_URL}/payments/mpesa/stkpush`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                amount: parseInt(amount),
                phoneNumber: phone,
                accountReference: reference,
                transactionDesc: 'Linknet Fiber Payment'
            })
        });

        const data = await response.json();
        
        if (data.success) {
            // Show success message
            paymentStatus.innerHTML = `
                <div style="text-align: center; padding: 20px;">
                    <i class="fas fa-check-circle" style="font-size: 48px; color: #10B981;"></i>
                    <p style="margin: 16px 0 8px; font-weight: 600; color: #1E293B;">Payment Initiated</p>
                    <p style="margin: 0; color: #64748B;">Check your phone for the M-Pesa prompt. Enter your PIN to complete the payment.</p>
                    <p style="margin: 16px 0 0; font-size: 12px; color: #64748B;">Merchant Request: ${data.merchantRequestID || 'Processing...'}</p>
                    <button class="btn btn-primary btn-block" style="margin-top: 16px;" onclick="closePaymentModal()">
                        Close
                    </button>
                </div>
            `;
        } else {
            // Show error message
            paymentStatus.innerHTML = `
                <div style="text-align: center; padding: 20px;">
                    <i class="fas fa-exclamation-circle" style="font-size: 48px; color: #EF4444;"></i>
                    <p style="margin: 16px 0 8px; font-weight: 600; color: #1E293B;">Payment Failed</p>
                    <p style="margin: 0; color: #64748B;">${data.error || 'Failed to initiate payment. Please try again.'}</p>
                    <button class="btn btn-primary btn-block" style="margin-top: 16px;" onclick="resetPaymentForm()">
                        Try Again
                    </button>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error initiating payment:', error);
        paymentStatus.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <i class="fas fa-exclamation-circle" style="font-size: 48px; color: #EF4444;"></i>
                <p style="margin: 16px 0 8px; font-weight: 600; color: #1E293B;">Payment Failed</p>
                <p style="margin: 0; color: #64748B;">Failed to initiate payment. Please try again.</p>
                <button class="btn btn-primary btn-block" style="margin-top: 16px;" onclick="resetPaymentForm()">
                    Try Again
                </button>
            </div>
        `;
    }
}

function closePaymentModal() {
    const modal = document.getElementById('mpesa-payment-modal');
    modal.classList.remove('active');
    resetPaymentForm();
}

function resetPaymentForm() {
    const form = document.getElementById('mpesa-payment-form');
    const paymentStatus = document.getElementById('payment-status');
    
    form.style.display = 'block';
    paymentStatus.style.display = 'none';
    form.reset();
}

async function loadBillingData() {
    try {
        const clientProfile = await fetchClientProfile();
        
        if (clientProfile && clientProfile.package) {
            // Update current bill with package price
            const currentBill = document.getElementById('current-bill');
            if (currentBill) {
                currentBill.textContent = `KES ${clientProfile.package.price.toLocaleString()}`;
            }
        }
    } catch (error) {
        console.error('Error loading billing data:', error);
    }
}
