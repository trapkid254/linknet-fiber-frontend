// admin-login.js - Clean Admin Login Implementation
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('login-form');
    const emailInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const loginBtn = document.querySelector('button[type="submit"]');
    const errorMessage = document.getElementById('login-message');
    
    if (!loginForm) return;
    
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        
        // Basic validation
        if (!email || !password) {
            showError('Please enter both email and password');
            return;
        }
        
        // Show loading state
        loginBtn.disabled = true;
        loginBtn.textContent = 'Logging in...';
        hideError();
        
        try {
            const response = await fetch('https://linknet-fiber-backend.onrender.com/api/admin/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: email,
                    password: password
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Store token and admin info
                localStorage.setItem('adminToken', data.token);
                localStorage.setItem('adminInfo', JSON.stringify(data.admin));
                
                // Redirect to dashboard
                window.location.href = 'admin/dashboard.html';
            } else {
                showError(data.error || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            showError('Network error. Please try again.');
        } finally {
            // Reset button state
            loginBtn.disabled = false;
            loginBtn.textContent = 'Login';
        }
    });
    
    function showError(message) {
        if (errorMessage) {
            errorMessage.textContent = message;
            errorMessage.style.display = 'block';
        }
    }
    
    function hideError() {
        if (errorMessage) {
            errorMessage.style.display = 'none';
        }
    }
    
    // Check if already logged in
    const token = localStorage.getItem('adminToken');
    if (token) {
        // Redirect to dashboard if already logged in
        window.location.href = 'admin/dashboard.html';
    }
});
