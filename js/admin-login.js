
// admin-login.js - Clean Admin Login Implementation

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('login-form');
    const emailInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const loginBtn = document.querySelector('button[type="submit"]');
    const errorMessage = document.getElementById('login-message');

    const AUTH_KEY = 'linknet_admin_auth';
    const isLocalHost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
    const API_BASE = isLocalHost
        ? `${window.location.origin}/api`
        : 'https://linknet-fiber-backend.onrender.com/api';

    if (!loginForm) return;

    // If already logged in, redirect to dashboard
    const existingAuth = localStorage.getItem(AUTH_KEY);
    if (existingAuth) {
        try {
            const data = JSON.parse(existingAuth);
            if (data.expires && data.expires > Date.now()) {
                window.location.href = '/admin/dashboard/';
                return;
            } else {
                localStorage.removeItem(AUTH_KEY);
            }
        } catch (e) {
            localStorage.removeItem(AUTH_KEY);
        }
    }

    // Password toggle functionality
    const passwordToggle = document.querySelector('.password-toggle');
    if (passwordToggle) {
        passwordToggle.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            this.querySelector('i').classList.toggle('fa-eye');
            this.querySelector('i').classList.toggle('fa-eye-slash');
        });
    }

    // Form submission
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
        loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';
        hideError();

        try {
            const response = await fetch(`${API_BASE}/admin/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email.toLowerCase(),
                    password: password
                })
            });

            let data;
            try {
                data = await response.json();
            } catch (parseError) {
                showError(`Login failed (${response.status}). Please try again.`);
                return;
            }

            if (!response.ok || !data.success) {
                showError(data.error || 'Invalid credentials. Please try again.');
                return;
            }

            const authData = {
                token: data.token,
                name: data.admin.name,
                email: data.admin.email,
                role: data.admin.role,
                id: data.admin._id || data.admin.id,
                permissions: data.admin.permissions || data.admin.allPermissions,
                expires: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
            };
            localStorage.setItem(AUTH_KEY, JSON.stringify(authData));

            showSuccess('Login successful! Redirecting to dashboard...');

            setTimeout(() => {
                window.location.href = '/admin/dashboard/';
            }, 1000);
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
            errorMessage.className = 'form-message error';
            errorMessage.style.display = 'block';
        }
    }

    function showSuccess(message) {
        if (errorMessage) {
            errorMessage.textContent = message;
            errorMessage.className = 'form-message success';
            errorMessage.style.display = 'block';
        }
    }

    function hideError() {
        if (errorMessage) {
            errorMessage.style.display = 'none';
            errorMessage.textContent = '';
        }
    }
});
