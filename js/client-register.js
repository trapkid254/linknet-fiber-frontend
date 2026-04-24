// client-register.js - Client Registration Implementation

document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('client-register-form');
    
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const firstname = document.getElementById('firstname').value;
            const lastname = document.getElementById('lastname').value;
            const email = document.getElementById('email').value;
            const phone = document.getElementById('phone').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            const terms = document.getElementById('terms').checked;
            
            // Validate names
            if (firstname.length < 2 || lastname.length < 2) {
                showNotification('Names must be at least 2 characters', 'error');
                return;
            }
            
            // Validate email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                showNotification('Please enter a valid email address', 'error');
                return;
            }
            
            // Validate phone (Kenyan format)
            const phoneRegex = /^(?:\+254|0)[17]\d{8}$/;
            if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
                showNotification('Please enter a valid Kenyan phone number (e.g., 0712 345 678)', 'error');
                return;
            }
            
            // Validate password
            if (password.length < 6) {
                showNotification('Password must be at least 6 characters', 'error');
                return;
            }
            
            // Validate password match
            if (password !== confirmPassword) {
                showNotification('Passwords do not match', 'error');
                return;
            }
            
            // Validate terms
            if (!terms) {
                showNotification('You must agree to the Terms of Service', 'error');
                return;
            }
            
            // Show loading state
            const submitBtn = registerForm.querySelector('.btn-submit');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Creating Account...';
            submitBtn.disabled = true;
            
            try {
                // TODO: Replace with actual API endpoint when backend is ready
                // const response = await fetch('https://linknet-fiber-backend.onrender.com/api/client/register', {
                //     method: 'POST',
                //     headers: {
                //         'Content-Type': 'application/json',
                //     },
                //     body: JSON.stringify({
                //         firstname,
                //         lastname,
                //         email,
                //         phone,
                //         password
                //     })
                // });
                
                // Simulate API call for now
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                showNotification('Account created successfully! Redirecting to login...', 'success');
                
                // Store email for login page
                sessionStorage.setItem('clientEmail', email);
                
                // Redirect to login page
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
                
            } catch (error) {
                console.error('Registration error:', error);
                showNotification('Registration failed. Please try again.', 'error');
            } finally {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
        
        // Pre-fill email if coming from login page
        const emailFromSession = sessionStorage.getItem('clientEmail');
        if (emailFromSession) {
            document.getElementById('email').value = emailFromSession;
        }
    }
});

function showNotification(message, type) {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 24px;
        border-radius: 12px;
        background: ${type === 'success' ? '#10B981' : '#EF4444'};
        color: white;
        font-weight: 600;
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.2);
    `;
    notification.textContent = message;
    
    // Add animation keyframes
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideIn 0.3s ease-out reverse';
        setTimeout(() => {
            notification.remove();
            style.remove();
        }, 300);
    }, 3000);
}
