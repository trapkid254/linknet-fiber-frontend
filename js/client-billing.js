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
        const billing = await fetchClientBilling();
        
        if (billing) {
            // Update current bill
            const currentBill = document.getElementById('current-bill');
            if (currentBill) {
                currentBill.textContent = `KES ${billing.currentBill?.toLocaleString() || '0'}`;
            }

            // Update next billing date
            const nextBilling = document.getElementById('next-billing-date');
            if (nextBilling) {
                if (billing.nextBillingDate) {
                    nextBilling.textContent = `Due: ${new Date(billing.nextBillingDate).toLocaleDateString()}`;
                } else {
                    nextBilling.textContent = 'No billing date set';
                }
            }

            // Update outstanding balance
            const outstandingBalance = document.getElementById('outstanding-balance');
            if (outstandingBalance) {
                outstandingBalance.textContent = `KES ${billing.outstandingBalance?.toLocaleString() || '0'}`;
            }

            // Update payment status
            const paymentStatusText = document.getElementById('payment-status-text');
            if (paymentStatusText) {
                if (billing.outstandingBalance > 0) {
                    paymentStatusText.textContent = 'Payment overdue';
                } else {
                    paymentStatusText.textContent = 'No outstanding balance';
                }
            }

            // Update account status
            const accountStatus = document.getElementById('account-status');
            const accountStatusSub = document.getElementById('account-status-sub');
            if (accountStatus) {
                if (billing.outstandingBalance > 0) {
                    accountStatus.textContent = 'Overdue';
                    accountStatus.className = 'stat-value status-overdue';
                    if (accountStatusSub) accountStatusSub.textContent = 'Please clear outstanding balance';
                } else {
                    accountStatus.textContent = 'Active';
                    accountStatus.className = 'stat-value status-active';
                    if (accountStatusSub) accountStatusSub.textContent = 'Account in good standing';
                }
            }

            // Update payment history
            const paymentHistory = document.getElementById('payment-history');
            if (paymentHistory) {
                if (billing.paymentHistory && billing.paymentHistory.length > 0) {
                    paymentHistory.innerHTML = billing.paymentHistory.map(payment => `
                        <div class="invoice-item">
                            <div class="invoice-info">
                                <div class="invoice-number">${payment.invoiceNumber || 'N/A'}</div>
                                <div class="invoice-date">${payment.date ? new Date(payment.date).toLocaleDateString() : 'N/A'}</div>
                            </div>
                            <div class="invoice-amount">KES ${payment.amount?.toLocaleString() || '0'}</div>
                            <div class="invoice-status ${payment.status === 'paid' ? 'status-paid' : 'status-pending'}">${payment.status || 'Unknown'}</div>
                        </div>
                    `).join('');
                } else {
                    paymentHistory.innerHTML = `
                        <div style="text-align: center; padding: 40px; color: #64748B;">
                            <i class="fas fa-receipt" style="font-size: 48px; margin-bottom: 12px; opacity: 0.5;"></i>
                            <p>No payment history available</p>
                        </div>
                    `;
                }
            }
        } else {
            // Show error state
            document.getElementById('current-bill').textContent = 'Error loading';
            document.getElementById('next-billing-date').textContent = 'Please try again';
            document.getElementById('outstanding-balance').textContent = 'Error loading';
            document.getElementById('payment-status-text').textContent = 'Please try again';
            document.getElementById('account-status').textContent = 'Error';
            document.getElementById('account-status-sub').textContent = 'Please try again';
        }
    } catch (error) {
        console.error('Error loading billing data:', error);
        // Show error state
        document.getElementById('current-bill').textContent = 'Error loading';
        document.getElementById('next-billing-date').textContent = 'Please try again';
        document.getElementById('outstanding-balance').textContent = 'Error loading';
        document.getElementById('payment-status-text').textContent = 'Please try again';
        document.getElementById('account-status').textContent = 'Error';
        document.getElementById('account-status-sub').textContent = 'Please try again';
    }
}
