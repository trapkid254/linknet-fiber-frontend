// client-api.js - Client API Integration

const API_BASE_URL = 'http://localhost:5000/api';

// Get client token
function getClientToken() {
    return localStorage.getItem('clientToken') || sessionStorage.getItem('clientToken');
}

// Get client data
function getClientData() {
    const data = localStorage.getItem('clientData') || sessionStorage.getItem('clientData');
    return data ? JSON.parse(data) : null;
}

// Fetch packages from backend
async function fetchPackages() {
    try {
        const response = await fetch(`${API_BASE_URL}/packages`);
        const data = await response.json();
        return data.data || [];
    } catch (error) {
        console.error('Error fetching packages:', error);
        return [];
    }
}

// Fetch client profile
async function fetchClientProfile() {
    const token = getClientToken();
    if (!token) return null;

    try {
        const response = await fetch(`${API_BASE_URL}/clients/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();
        return data.success ? data.client : null;
    } catch (error) {
        console.error('Error fetching client profile:', error);
        return null;
    }
}

// Update client profile
async function updateClientProfile(profileData) {
    const token = getClientToken();
    if (!token) return null;

    try {
        const response = await fetch(`${API_BASE_URL}/clients/profile`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(profileData)
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error updating client profile:', error);
        return { success: false, error: 'Failed to update profile' };
    }
}

// Logout client
function logoutClient() {
    localStorage.removeItem('clientToken');
    localStorage.removeItem('clientEmail');
    localStorage.removeItem('clientData');
    sessionStorage.removeItem('clientToken');
    sessionStorage.removeItem('clientEmail');
    sessionStorage.removeItem('clientData');
    window.location.href = 'login.html';
}
