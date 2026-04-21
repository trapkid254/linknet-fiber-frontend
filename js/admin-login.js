// admin-login.js - Admin Login Implementation
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('login-form');
    const emailInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const loginBtn = document.querySelector('button[type="submit"]');
    const errorMessage = document.getElementById('login-message');

    const AUTH_KEY = 'linknet_admin_auth';
    const API_BASE = 'https://linknet-fiber-backend.onrender.com/api';

    if (!loginForm) return;

    // If already logged in, redirect to dashboard
    const existingAuth = localStorage.getItem(AUTH_KEY);
    if (existingAuth) {
        try {
            const data = JSON.parse(existingAuth);
            if (data.expires && data.expires > Date.now()) {
                window.location.href = 'dashboard.html';
                return;
            } else {
                localStorage.removeItem(AUTH_KEY);
            }
        } catch (e) {
            localStorage.removeItem(AUTH_KEY);
        }
    }

    // Password toggle
    const passwordToggle = document.querySelector('.password-toggle');
    if (passwordToggle) {
        passwordToggle.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            this.querySelector('i').classList.toggle('fa-eye');
            this.querySelector('i').classList.toggle('fa-eye-slash');
        });
    }

    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        if (!email || !password) {
            showError('Please enter both email and password');
            return;
        }

        // Show loading state
        loginBtn.disabled = true;
        loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';
        hideError();

        try {
            const response = await fetch(`${API_BASE}/admin/login`, {
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
                // Store auth data in the format the dashboard expects
                const authData = {
                    token: data.token,
                    name: data.admin.name,
                    email: data.admin.email,
                    role: data.admin.role,
                    id: data.admin.id,
                    expires: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
                };
                localStorage.setItem(AUTH_KEY, JSON.stringify(authData));

                // Redirect to dashboard (login.html is inside /admin/ folder)
                window.location.href = 'dashboard.html';
            } else {
                showError(data.error || 'Invalid credentials. Please try again.');
            }
        } catch (error) {
            console.error('Login error:', error);
            showError('Network error. Please check your connection and try again.');
        } finally {
            loginBtn.disabled = false;
            loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In';
        }
    });

    function showError(message) {
        if (errorMessage) {
            errorMessage.textContent = message;
            errorMessage.style.display = 'block';
            errorMessage.style.color = '#e53e3e';
            errorMessage.style.padding = '10px';
            errorMessage.style.marginTop = '10px';
            errorMessage.style.borderRadius = '6px';
            errorMessage.style.background = '#fff5f5';
            errorMessage.style.border = '1px solid #fed7d7';
        }
    }

    function hideError() {
        if (errorMessage) {
            errorMessage.style.display = 'none';
            errorMessage.textContent = '';
        }
    }
});
