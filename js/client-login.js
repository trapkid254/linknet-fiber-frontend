// client-login.js - Client Login Implementation

const API_BASE_URL = 'http://localhost:5000/api/clients';

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
                const response = await fetch(`${API_BASE_URL}/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email, password })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    // Store token and user info
                    if (remember) {
                        localStorage.setItem('clientToken', data.token);
                        localStorage.setItem('clientEmail', data.client.email);
                        localStorage.setItem('clientData', JSON.stringify(data.client));
                    } else {
                        sessionStorage.setItem('clientToken', data.token);
                        sessionStorage.setItem('clientEmail', data.client.email);
                        sessionStorage.setItem('clientData', JSON.stringify(data.client));
                    }
                    
                    showNotification('Login successful! Redirecting...', 'success');
                    
                    // Redirect to client dashboard
                    setTimeout(() => {
                        window.location.href = 'dashboard.html';
                    }, 1500);
                } else {
                    showNotification(data.error || 'Login failed', 'error');
                }
                
            } catch (error) {
                console.error('Login error:', error);
                showNotification('Login failed. Please check your connection.', 'error');
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
