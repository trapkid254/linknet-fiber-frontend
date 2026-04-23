// js/client-auth.js - Client Authentication Handler
(function() {
    'use strict';
    
    const API_BASE = 'https://linknet-fiber-backend.onrender.com/api';
    const CLIENT_TOKEN_KEY = 'clientToken';
    
    console.log('🔧 CLIENT AUTH API_BASE SET TO:', API_BASE);
    
    // Client login
    const clientLogin = async (email, password) => {
        try {
            const response = await fetch(`${API_BASE}/customers/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Login failed');
            }
            
            const data = await response.json();
            if (data.success && data.token) {
                localStorage.setItem(CLIENT_TOKEN_KEY, data.token);
                localStorage.setItem('customerData', JSON.stringify(data.customer));
                return { success: true, customer: data.customer };
            }
            
            throw new Error('Invalid response from server');
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: error.message };
        }
    };
    
    // Client registration
    const clientRegister = async (userData) => {
        try {
            const response = await fetch(`${API_BASE}/customers/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Registration failed');
            }
            
            const data = await response.json();
            if (data.success) {
                return { success: true, message: 'Registration successful!' };
            }
            
            throw new Error('Invalid response from server');
        } catch (error) {
            console.error('Registration error:', error);
            return { success: false, error: error.message };
        }
    };
    
    // Verify client token
    const verifyClientToken = async () => {
        try {
            const token = localStorage.getItem(CLIENT_TOKEN_KEY);
            if (!token) return false;
            
            const response = await fetch(`${API_BASE}/customers/verify-token`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                localStorage.removeItem(CLIENT_TOKEN_KEY);
                localStorage.removeItem('customerData');
                return false;
            }
            
            const data = await response.json();
            return data.success;
        } catch (error) {
            console.error('Token verification error:', error);
            localStorage.removeItem(CLIENT_TOKEN_KEY);
            localStorage.removeItem('customerData');
            return false;
        }
    };
    
    // Get current customer data
    const getCurrentCustomer = () => {
        const customerData = localStorage.getItem('customerData');
        return customerData ? JSON.parse(customerData) : null;
    };
    
    // Client logout
    const clientLogout = () => {
        localStorage.removeItem(CLIENT_TOKEN_KEY);
        localStorage.removeItem('customerData');
        window.location.href = 'login.html';
    };
    
    // Check if client is authenticated
    const isClientAuthenticated = () => {
        const token = localStorage.getItem(CLIENT_TOKEN_KEY);
        return !!token;
    };
    
    // Get auth headers
    const getClientAuthHeaders = () => {
        const token = localStorage.getItem(CLIENT_TOKEN_KEY);
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
    };
    
    // Expose functions globally
    window.clientAuth = {
        login: clientLogin,
        register: clientRegister,
        verifyToken: verifyClientToken,
        getCurrentCustomer,
        logout: clientLogout,
        isAuthenticated: isClientAuthenticated,
        getAuthHeaders: getClientAuthHeaders
    };
    
})();
