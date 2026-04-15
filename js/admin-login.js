// js/admin-login.js - Admin authentication
(function() {
    'use strict';
    
    const AUTH_KEY = 'linknet_admin_auth';
    const API_BASE = 'https://linknet-fiber-backend.onrender.com/api';
    
    // Password toggle
    const initPasswordToggle = () => {
        const toggleBtn = document.querySelector('.password-toggle');
        const passwordInput = document.getElementById('password');
        
        if (toggleBtn && passwordInput) {
            toggleBtn.addEventListener('click', () => {
                const type = passwordInput.type === 'password' ? 'text' : 'password';
                passwordInput.type = type;
                
                const icon = toggleBtn.querySelector('i');
                icon.className = type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
            });
        }
    };
    
    // Handle login
    const initLoginForm = () => {
        const form = document.getElementById('login-form');
        if (!form) return;
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            
            // Show loading
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';
            submitBtn.disabled = true;
            
            try {
                // Real API authentication
                const response = await fetch(`${API_BASE}/admin/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, password })
                });
                
                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.error || 'Login failed');
                }
                
                // Store auth token
                const authData = {
                    ...data.admin,
                    token: data.token,
                    expires: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
                };
                
                localStorage.setItem(AUTH_KEY, JSON.stringify(authData));
                
                showMessage('Login successful! Redirecting...', 'success');
                
                // Redirect to dashboard
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1000);
                
            } catch (error) {
                console.error('Login error:', error);
                showMessage(error.message || 'Login failed. Please try again.', 'error');
            } finally {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
    };
    
    const showMessage = (message, type) => {
        const msgDiv = document.getElementById('login-message');
        if (msgDiv) {
            msgDiv.className = `form-message ${type}`;
            msgDiv.textContent = message;
        }
    };
    
    // Check if already authenticated
    const checkAuth = () => {
        const authData = localStorage.getItem(AUTH_KEY);
        if (authData) {
            try {
                const data = JSON.parse(authData);
                if (data.expires > Date.now()) {
                    // Valid session, redirect to dashboard
                    window.location.href = 'dashboard.html';
                } else {
                    // Expired session
                    localStorage.removeItem(AUTH_KEY);
                }
            } catch (e) {
                localStorage.removeItem(AUTH_KEY);
            }
        }
    };
    
    // Initialize
    const init = () => {
        checkAuth();
        initPasswordToggle();
        initLoginForm();
    };
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();