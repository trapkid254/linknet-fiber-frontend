// client-auth.js - Client Authentication Check

function checkClientAuth() {
    const token = localStorage.getItem('clientToken') || sessionStorage.getItem('clientToken');
    if (!token) {
        window.location.href = '/client/login/';
        return false;
    }
    return true;
}

// Run authentication check when script loads
checkClientAuth();
