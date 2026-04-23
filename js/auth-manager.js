// js/auth-manager.js - Unified Authentication Management
class AuthManager {
    constructor() {
        this.ADMIN_KEY = 'linknet_admin_auth';
        this.CLIENT_KEY = 'linknet_client_auth';
        this.API_BASE = '/api';
    }

    // Admin Authentication
    setAdminAuth(token, adminData) {
        const authData = {
            token,
            admin: adminData,
            expires: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
            type: 'admin'
        };
        localStorage.setItem(this.ADMIN_KEY, JSON.stringify(authData));
    }

    getAdminAuth() {
        const authData = localStorage.getItem(this.ADMIN_KEY);
        if (!authData) return null;

        try {
            const parsed = JSON.parse(authData);
            if (parsed.expires && parsed.expires < Date.now()) {
                this.clearAdminAuth();
                return null;
            }
            return parsed;
        } catch (e) {
            this.clearAdminAuth();
            return null;
        }
    }

    clearAdminAuth() {
        localStorage.removeItem(this.ADMIN_KEY);
    }

    // Client Authentication
    setClientAuth(token, customerData) {
        const authData = {
            token,
            customer: customerData,
            expires: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
            type: 'client'
        };
        localStorage.setItem(this.CLIENT_KEY, JSON.stringify(authData));
    }

    getClientAuth() {
        const authData = localStorage.getItem(this.CLIENT_KEY);
        if (!authData) return null;

        try {
            const parsed = JSON.parse(authData);
            if (parsed.expires && parsed.expires < Date.now()) {
                this.clearClientAuth();
                return null;
            }
            return parsed;
        } catch (e) {
            this.clearClientAuth();
            return null;
        }
    }

    clearClientAuth() {
        localStorage.removeItem(this.CLIENT_KEY);
    }

    // Universal Token Management
    getAuthHeaders(type) {
        const authData = type === 'admin' ? this.getAdminAuth() : this.getClientAuth();
        if (!authData || !authData.token) {
            return {};
        }
        return {
            'Authorization': `Bearer ${authData.token}`,
            'Content-Type': 'application/json'
        };
    }

    // Check if user is authenticated
    isAuthenticated(type) {
        return type === 'admin' ? this.getAdminAuth() : this.getClientAuth();
    }

    // Logout
    logout(type) {
        if (type === 'admin') {
            this.clearAdminAuth();
            window.location.href = 'admin/login.html';
        } else {
            this.clearClientAuth();
            window.location.href = 'client/login.html';
        }
    }

    // API Request Helper
    async apiRequest(endpoint, options = {}, type = 'admin') {
        const url = `${this.API_BASE}${endpoint}`;
        const headers = this.getAuthHeaders(type);
        
        const config = {
            headers,
            ...options
        };

        try {
            const response = await fetch(url, config);
            
            // Handle token expiration
            if (response.status === 401) {
                this.logout(type);
                return null;
            }

            return response;
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }
}

// Global instance
window.authManager = new AuthManager();
