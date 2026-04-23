// js/offline-manager.js - PWA Offline Features
class OfflineManager {
    constructor() {
        this.dbName = 'linknetOfflineDB';
        this.dbVersion = 1;
        this.db = null;
        this.isOnline = navigator.onLine;
        this.syncQueue = [];
        this.cachedData = new Map();
        
        this.init();
    }

    async init() {
        // Initialize IndexedDB
        await this.initDB();
        
        // Set up online/offline event listeners
        this.setupEventListeners();
        
        // Check current status
        this.updateOnlineStatus();
        
        // Start background sync
        this.startBackgroundSync();
    }

    async initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Create object stores
                if (!db.objectStoreNames.contains('requests')) {
                    db.createObjectStore('requests', { keyPath: 'id', autoIncrement: true });
                }
                
                if (!db.objectStoreNames.contains('customers')) {
                    db.createObjectStore('customers', { keyPath: 'id' });
                }
                
                if (!db.objectStoreNames.contains('packages')) {
                    db.createObjectStore('packages', { keyPath: 'id' });
                }
                
                if (!db.objectStoreNames.contains('cache')) {
                    db.createObjectStore('cache', { keyPath: 'key' });
                }
            };
        });
    }

    setupEventListeners() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.updateOnlineStatus();
            this.syncPendingRequests();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.updateOnlineStatus();
        });

        // Service worker messages
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', (event) => {
                if (event.data && event.data.type === 'CACHE_UPDATED') {
                    this.handleCacheUpdate(event.data);
                }
            });
        }
    }

    updateOnlineStatus() {
        const statusElement = document.getElementById('online-status');
        const offlineBanner = document.getElementById('offline-banner');
        
        if (statusElement) {
            statusElement.textContent = this.isOnline ? 'Online' : 'Offline';
            statusElement.className = this.isOnline ? 'online' : 'offline';
        }
        
        if (offlineBanner) {
            offlineBanner.style.display = this.isOnline ? 'none' : 'block';
        }
        
        // Update body class
        document.body.classList.toggle('offline', !this.isOnline);
        
        // Show notification
        this.showStatusNotification(this.isOnline ? 'Back online!' : 'You\'re offline. Some features may be limited.');
    }

    showStatusNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'status-notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: ${this.isOnline ? '#28a745' : '#ffc107'};
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            z-index: 10000;
            animation: slideDown 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideUp 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    // Cache management
    async cacheData(key, data) {
        if (!this.db) return;
        
        try {
            const transaction = this.db.transaction(['cache'], 'readwrite');
            const store = transaction.objectStore('cache');
            await store.put({ key, data, timestamp: Date.now() });
            this.cachedData.set(key, data);
        } catch (error) {
            console.error('Error caching data:', error);
        }
    }

    async getCachedData(key) {
        if (!this.db) return null;
        
        // Check memory cache first
        if (this.cachedData.has(key)) {
            return this.cachedData.get(key);
        }
        
        try {
            const transaction = this.db.transaction(['cache'], 'readonly');
            const store = transaction.objectStore('cache');
            const result = await store.get(key);
            
            if (result && !this.isCacheExpired(result.timestamp)) {
                this.cachedData.set(key, result.data);
                return result.data;
            }
        } catch (error) {
            console.error('Error getting cached data:', error);
        }
        
        return null;
    }

    isCacheExpired(timestamp) {
        const maxAge = 5 * 60 * 1000; // 5 minutes
        return Date.now() - timestamp > maxAge;
    }

    // Request queuing for offline mode
    async queueRequest(method, url, data = null) {
        const request = {
            id: Date.now().toString(),
            method,
            url,
            data,
            timestamp: Date.now(),
            retries: 0
        };
        
        try {
            const transaction = this.db.transaction(['requests'], 'readwrite');
            const store = transaction.objectStore('requests');
            await store.add(request);
            this.syncQueue.push(request);
        } catch (error) {
            console.error('Error queuing request:', error);
        }
    }

    async syncPendingRequests() {
        if (!this.isOnline || this.syncQueue.length === 0) return;
        
        const requests = [...this.syncQueue];
        this.syncQueue = [];
        
        for (const request of requests) {
            try {
                await this.processQueuedRequest(request);
                await this.removeQueuedRequest(request.id);
            } catch (error) {
                console.error('Error processing queued request:', error);
                request.retries++;
                if (request.retries < 3) {
                    this.syncQueue.push(request);
                }
            }
        }
    }

    async processQueuedRequest(request) {
        const options = {
            method: request.method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('clientToken') || localStorage.getItem('adminToken')}`
            }
        };
        
        if (request.data) {
            options.body = JSON.stringify(request.data);
        }
        
        const response = await fetch(request.url, options);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return response.json();
    }

    async removeQueuedRequest(id) {
        if (!this.db) return;
        
        try {
            const transaction = this.db.transaction(['requests'], 'readwrite');
            const store = transaction.objectStore('requests');
            await store.delete(id);
        } catch (error) {
            console.error('Error removing queued request:', error);
        }
    }

    // Background sync
    startBackgroundSync() {
        if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
            navigator.serviceWorker.ready.then((registration) => {
                return registration.sync.register('background-sync');
            }).catch((error) => {
                console.log('Background sync registration failed:', error);
            });
        }
    }

    // Enhanced fetch with offline support
    async fetchWithOffline(url, options = {}) {
        try {
            // Try online request first
            if (this.isOnline) {
                const response = await fetch(url, options);
                if (response.ok) {
                    const data = await response.json();
                    // Cache successful GET requests
                    if (options.method === 'GET' || !options.method) {
                        await this.cacheData(url, data);
                    }
                    return { success: true, data, online: true };
                }
            }
        } catch (error) {
            console.log('Online request failed, trying cache:', error);
        }
        
        // Fallback to cache
        if (options.method === 'GET' || !options.method) {
            const cachedData = await this.getCachedData(url);
            if (cachedData) {
                return { success: true, data: cachedData, online: false, cached: true };
            }
        }
        
        // Queue the request for later sync
        if (options.method !== 'GET') {
            await this.queueRequest(options.method || 'GET', url, options.body ? JSON.parse(options.body) : null);
            return { success: false, error: 'Request queued for sync when online', queued: true };
        }
        
        return { success: false, error: 'No internet connection and no cached data available' };
    }

    // Handle cache updates from service worker
    handleCacheUpdate(data) {
        if (data.key && data.data) {
            this.cachedData.set(data.key, data.data);
        }
    }

    // Get offline statistics
    async getOfflineStats() {
        if (!this.db) return null;
        
        try {
            const transaction = this.db.transaction(['requests'], 'readonly');
            const store = transaction.objectStore('requests');
            const requests = await store.getAll();
            
            return {
                pendingRequests: requests.length,
                isOnline: this.isOnline,
                cachedItems: this.cachedData.size
            };
        } catch (error) {
            console.error('Error getting offline stats:', error);
            return null;
        }
    }

    // Clear cache
    async clearCache() {
        if (!this.db) return;
        
        try {
            const transaction = this.db.transaction(['cache'], 'readwrite');
            const store = transaction.objectStore('cache');
            await store.clear();
            this.cachedData.clear();
        } catch (error) {
            console.error('Error clearing cache:', error);
        }
    }
}

// API wrapper with offline support
class OfflineAPI {
    constructor() {
        this.offlineManager = window.offlineManager;
    }

    async get(endpoint) {
        const result = await this.offlineManager.fetchWithOffline(`/api${endpoint}`);
        return result;
    }

    async post(endpoint, data) {
        const result = await this.offlineManager.fetchWithOffline(`/api${endpoint}`, {
            method: 'POST',
            body: JSON.stringify(data)
        });
        return result;
    }

    async put(endpoint, data) {
        const result = await this.offlineManager.fetchWithOffline(`/api${endpoint}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
        return result;
    }

    async delete(endpoint) {
        const result = await this.offlineManager.fetchWithOffline(`/api${endpoint}`, {
            method: 'DELETE'
        });
        return result;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.offlineManager = new OfflineManager();
    window.offlineAPI = new OfflineAPI();
});

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from { transform: translate(-50%, -100%); opacity: 0; }
        to { transform: translate(-50%, 0); opacity: 1; }
    }
    
    @keyframes slideUp {
        from { transform: translate(-50%, 0); opacity: 1; }
        to { transform: translate(-50%, -100%); opacity: 0; }
    }
    
    .offline-banner {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: #ffc107;
        color: #333;
        padding: 8px;
        text-align: center;
        font-weight: 500;
        z-index: 9999;
        display: none;
    }
    
    .online-status {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 0.875rem;
        font-weight: 500;
    }
    
    .online-status.online {
        background: #d4edda;
        color: #155724;
    }
    
    .online-status.offline {
        background: #f8d7da;
        color: #721c24;
    }
    
    .online-status::before {
        content: '';
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: currentColor;
    }
    
    body.offline {
        filter: grayscale(0.5);
    }
    
    body.offline .btn {
        opacity: 0.7;
        cursor: not-allowed;
    }
    
    body.offline .online-only {
        display: none !important;
    }
`;
document.head.appendChild(style);
