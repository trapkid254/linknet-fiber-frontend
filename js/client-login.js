// client-login.js - Client Login Implementation

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('client-login-form');
    
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const remember = document.getElementById('remember').checked;
            
            // Validate email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                showNotification('Please enter a valid email address', 'error');
                return;
            }
            
            // Validate password
            if (password.length < 6) {
                showNotification('Password must be at least 6 characters', 'error');
                return;
            }
            
            // Show loading state
            const submitBtn = loginForm.querySelector('.btn-submit');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Signing in...';
            submitBtn.disabled = true;
            
            try {
                // TODO: Replace with actual API endpoint when backend is ready
                // const response = await fetch('https://linknet-fiber-backend.onrender.com/api/client/login', {
                //     method: 'POST',
                //     headers: {
                //         'Content-Type': 'application/json',
                //     },
                //     body: JSON.stringify({ email, password, remember })
                // });
                
                // Simulate API call for now
                await new Promise(resolve => setTimeout(resolve, 1500));
                
                // Store user info if remember is checked
                if (remember) {
                    localStorage.setItem('clientEmail', email);
                } else {
                    sessionStorage.setItem('clientEmail', email);
                }
                
                showNotification('Login successful! Redirecting...', 'success');
                
                // TODO: Redirect to client dashboard when ready
                // window.location.href = 'client/dashboard.html';
                
                // For now, redirect to home
                setTimeout(() => {
                    window.location.href = '../index.html';
                }, 1500);
                
            } catch (error) {
                console.error('Login error:', error);
                showNotification('Login failed. Please try again.', 'error');
            } finally {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
        
        // Pre-fill email if remembered
        const rememberedEmail = localStorage.getItem('clientEmail') || sessionStorage.getItem('clientEmail');
        if (rememberedEmail) {
            document.getElementById('email').value = rememberedEmail;
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
