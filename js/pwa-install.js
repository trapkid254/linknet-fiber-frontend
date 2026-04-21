// js/pwa-install.js - PWA Install functionality
(function() {
    'use strict';
    
    let deferredPrompt = null;
    let installButton = null;
    let isInstallable = false;
    
    // Check if app is already installed
    const isAppInstalled = () => {
        return window.matchMedia('(display-mode: standalone)').matches || 
               window.navigator.standalone === true ||
               document.referrer.includes('android-app://');
    };
    
    // Show install prompt
    const showInstallPrompt = async () => {
        if (!deferredPrompt) {
            console.log('Install prompt not available');
            if (typeof showToast === 'function') {
                showToast('Please wait for the install prompt to appear...', 'info', 3000);
            }
            return;
        }
        
        console.log('Showing PWA install prompt...');
        
        // Show loading state on button
        if (installButton) {
            installButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Opening Install Dialog...</span>';
            installButton.disabled = true;
        }
        
        // Show the install prompt
        deferredPrompt.prompt();
        
        // Wait for user to respond
        const { outcome } = await deferredPrompt.userChoice;
        
        // Reset button state
        if (installButton) {
            installButton.innerHTML = `
                <i class="fas fa-download"></i>
                <span>Install App</span>
            `;
            installButton.disabled = false;
        }
        
        if (outcome === 'accepted') {
            console.log('User accepted the install prompt');
            
            // Show detailed success message
            if (typeof showToast === 'function') {
                showToast('🎉 Installing Linknet Fiber App! Check your device home screen/app drawer.', 'success', 8000);
            }
            
            // Create installation progress indicator
            showInstallationProgress();
            
            // Track installation
            trackInstallation('accepted');
        } else {
            console.log('User dismissed the install prompt');
            trackInstallation('dismissed');
            
            // Show info message about dismissal
            if (typeof showToast === 'function') {
                showToast('Install cancelled. You can install anytime from this button.', 'info', 4000);
            }
            
            // Show button again if dismissed
            if (installButton) {
                installButton.style.display = 'flex';
            }
        }
        
        // Clear the deferred prompt
        deferredPrompt = null;
        isInstallable = false;
    };
    
    // Show installation progress indicator
    const showInstallationProgress = () => {
        const progressDiv = document.createElement('div');
        progressDiv.id = 'pwa-install-progress';
        progressDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 30px;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            z-index: 10000;
            text-align: center;
            min-width: 300px;
        `;
        progressDiv.innerHTML = `
            <div style="font-size: 18px; margin-bottom: 15px;">
                <i class="fas fa-download" style="color: #28a745; font-size: 24px; margin-bottom: 10px; display: block;"></i>
                <strong>Installing Linknet Fiber App</strong>
            </div>
            <div style="color: #666; margin-bottom: 15px;">
                The app is being added to your device<br>
                Check your home screen or app drawer
            </div>
            <div style="display: flex; align-items: center; gap: 10px; color: #28a745;">
                <i class="fas fa-check-circle"></i>
                <span>Installation Complete!</span>
            </div>
        `;
        
        document.body.appendChild(progressDiv);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            if (progressDiv.parentNode) {
                progressDiv.parentNode.removeChild(progressDiv);
            }
        }, 3000);
    };
    
    // Track installation analytics
    const trackInstallation = (action) => {
        // Simple analytics tracking
        const installData = {
            action: action,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            platform: navigator.platform
        };
        
        // Store in localStorage for basic analytics
        const installations = JSON.parse(localStorage.getItem('pwa_installations') || '[]');
        installations.push(installData);
        localStorage.setItem('pwa_installations', JSON.stringify(installations));
        
        console.log('PWA Installation tracked:', installData);
    };
    
    // Create install button
    const createInstallButton = () => {
        // Check if button already exists
        if (document.getElementById('pwa-install-btn')) {
            return;
        }
        
        const button = document.createElement('button');
        button.id = 'pwa-install-btn';
        button.className = 'pwa-install-btn';
        button.innerHTML = `
            <i class="fas fa-download"></i>
            <span>Install App</span>
        `;
        button.setAttribute('aria-label', 'Install Linknet Fiber App');
        button.setAttribute('title', 'Install Linknet Fiber App for offline access');
        
        // Add click handler - open download page instead of PWA install
        button.addEventListener('click', downloadApp);
        
        // Create download button
        const downloadBtn = document.createElement('button');
        downloadBtn.id = 'pwa-download-btn';
        downloadBtn.className = 'pwa-download-btn';
        downloadBtn.innerHTML = `
            <i class="fas fa-file-download"></i>
            <span>Download APK</span>
        `;
        downloadBtn.setAttribute('aria-label', 'Download Linknet Fiber APK');
        downloadBtn.setAttribute('title', 'Download Linknet Fiber APK for Android');
        downloadBtn.addEventListener('click', downloadApp);
        
        // Container for both buttons
        const container = document.createElement('div');
        container.className = 'pwa-buttons-container';
        container.appendChild(button);
        container.appendChild(downloadBtn);
        
        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .pwa-buttons-container {
                display: flex;
                align-items: center;
                gap: var(--spacing-2);
                flex-wrap: wrap;
            }
            
            .pwa-install-btn {
                display: flex;
                align-items: center;
                gap: var(--spacing-2);
                padding: var(--spacing-3) var(--spacing-4);
                background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
                color: white;
                border: none;
                border-radius: var(--radius-md);
                font-weight: var(--font-weight-medium);
                font-size: var(--font-size-sm);
                cursor: pointer;
                transition: all var(--transition-base);
                box-shadow: 0 2px 8px rgba(40, 167, 69, 0.3);
                position: relative;
                overflow: hidden;
            }
            
            .pwa-install-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(40, 167, 69, 0.4);
                background: linear-gradient(135deg, #218838 0%, #1ea085 100%);
            }
            
            .pwa-install-btn:active {
                transform: translateY(0);
            }
            
            .pwa-install-btn i {
                font-size: 14px;
            }
            
            .pwa-download-btn {
                display: flex;
                align-items: center;
                gap: var(--spacing-2);
                padding: var(--spacing-3) var(--spacing-4);
                background: linear-gradient(135deg, #28a745 0%, #1ea085 100%);
                color: white;
                border: none;
                border-radius: var(--radius-md);
                font-weight: var(--font-weight-medium);
                font-size: var(--font-size-sm);
                cursor: pointer;
                transition: all var(--transition-base);
                box-shadow: 0 2px 8px rgba(40, 167, 69, 0.3);
                position: relative;
                overflow: hidden;
            }
            
            .pwa-download-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(40, 167, 69, 0.4);
                background: linear-gradient(135deg, #218838 0%, #1ea085 100%);
            }
            
            .pwa-download-btn:active {
                transform: translateY(0);
            }
            
            .pwa-download-btn i {
                font-size: 14px;
            }
            
            .pwa-install-btn::before {
                content: '';
                position: absolute;
                top: 50%;
                left: 50%;
                width: 0;
                height: 0;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.2);
                transform: translate(-50%, -50%);
                transition: width 0.3s, height 0.3s;
            }
            
            .pwa-install-btn:hover::before {
                width: 100%;
                height: 100%;
            }
            
            .pwa-install-btn .install-badge {
                position: absolute;
                top: -8px;
                right: -8px;
                background: var(--color-gold);
                color: var(--color-primary);
                font-size: 10px;
                padding: 2px 6px;
                border-radius: 10px;
                font-weight: bold;
                animation: pulse 2s infinite;
            }
            
            @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.1); }
                100% { transform: scale(1); }
            }
            
            @media (max-width: 768px) {
                .pwa-install-btn span {
                    display: none;
                }
                
                .pwa-install-btn {
                    padding: var(--spacing-3);
                    min-width: auto;
                }
                
                .pwa-install-btn i {
                    font-size: 16px;
                }
            }
        `;
        
        document.head.appendChild(style);
        return button;
    };
    
    // Add install button to navbar
    const addInstallButton = () => {
        const navActions = document.querySelector('.nav-actions');
        if (!navActions) return;
        
        const buttonContainer = createInstallButton();
        
        // Add badge for first-time users
        const firstVisit = !localStorage.getItem('pwa_install_shown');
        if (firstVisit) {
            const badge = document.createElement('span');
            badge.className = 'install-badge';
            badge.textContent = 'NEW';
            buttonContainer.querySelector('.pwa-install-btn').appendChild(badge);
            localStorage.setItem('pwa_install_shown', 'true');
        }
        
        // Insert before the request installation button
        const requestBtn = navActions.querySelector('.btn-primary');
        if (requestBtn) {
            navActions.insertBefore(buttonContainer, requestBtn);
        } else {
            navActions.appendChild(buttonContainer);
        }
        
        // Show container with animation
    
    document.head.appendChild(style);
    return button;
};


// Download app function
const downloadApp = () => {
    console.log('Opening APK download page...');
    
    // Show loading state
    const downloadBtn = document.getElementById('pwa-download-btn');
    if (downloadBtn) {
        downloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Opening...</span>';
        downloadBtn.disabled = true;
    }
    
    // Open dedicated download page in new tab
    const downloadPageUrl = window.location.origin + '/download-apk.html';
    window.open(downloadPageUrl, '_blank', 'noopener,noreferrer');
    
    // Reset button after delay
    setTimeout(() => {
        if (downloadBtn) {
            downloadBtn.innerHTML = '<i class="fas fa-file-download"></i> <span>Download APK</span>';
            downloadBtn.disabled = false;
        }
        
        if (typeof showToast === 'function') {
            showToast('Download page opened! Check new tab for APK download.', 'success', 5000);
        }
    }, 1500);
};
    
    // Listen for beforeinstallprompt event
    const listenForInstallPrompt = () => {
        window.addEventListener('beforeinstallprompt', (e) => {
            console.log('PWA install prompt available');
            
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            
            // Stash the event so it can be triggered later
            deferredPrompt = e;
            isInstallable = true;
            
            // Show install button if not already installed
            if (!isAppInstalled()) {
                addInstallButton();
            }
        });
    };
    
    // Listen for app installed event
    const listenForAppInstalled = () => {
        window.addEventListener('appinstalled', (e) => {
            console.log('PWA was installed');
            
            // Hide install button
            if (installButton) {
                installButton.style.display = 'none';
            }
            
            // Show success message
            if (typeof showToast === 'function') {
                showToast('Thank you for installing Linknet Fiber App!', 'success', 5000);
            }
            
            // Track successful installation
            trackInstallation('installed');
            
            // Clear deferred prompt
            deferredPrompt = null;
            isInstallable = false;
        });
    };
    
    // Check installation status on page load
    const checkInstallationStatus = () => {
        if (isAppInstalled()) {
            console.log('App is already installed');
            // Hide install button if it exists
            const existingBtn = document.getElementById('pwa-install-btn');
            if (existingBtn) {
                existingBtn.style.display = 'none';
            }
        } else {
            console.log('App is not installed');
            listenForInstallPrompt();
            listenForAppInstalled();
        }
    };
    
    // Add CSS animation
    const addAnimations = () => {
        const animationStyle = document.createElement('style');
        animationStyle.textContent = `
            @keyframes slideInRight {
                from {
                    opacity: 0;
                    transform: translateX(20px);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }
        `;
        document.head.appendChild(animationStyle);
    };
    
    // Initialize PWA install functionality
    const init = () => {
        console.log('Initializing PWA install functionality...');
        
        addAnimations();
        checkInstallationStatus();
        
        // Add delay to ensure DOM is fully loaded
        setTimeout(() => {
            console.log('Delayed PWA button initialization...');
            if (!document.getElementById('pwa-install-btn')) {
                addInstallButton();
                console.log('Install button added after delay');
            }
        }, 500);
        
        // Add fallback button for localhost testing and always show for debugging
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.log('Running on localhost - adding fallback install button');
            
            // Immediate attempt
            if (!document.getElementById('pwa-install-btn')) {
                addInstallButton();
                console.log('Immediate install button added for localhost');
            }
            
            // Fallback after delay
            setTimeout(() => {
                if (!document.getElementById('pwa-install-btn')) {
                    addInstallButton();
                    console.log('Fallback install button added for localhost testing');
                }
            }, 1000);
        }
        
        // Always show install button for debugging on live site
        if (window.location.hostname.includes('github.io') || window.location.hostname.includes('trapkid254')) {
            console.log('Running on GitHub Pages - adding install button for debugging');
            setTimeout(() => {
                if (!document.getElementById('pwa-install-btn') && !isAppInstalled()) {
                    addInstallButton();
                    console.log('Install button added for GitHub Pages debugging');
                }
            }, 3000);
        }
        
        // Periodically check if install button should be shown
        setInterval(() => {
            if (isInstallable && !isAppInstalled() && !document.getElementById('pwa-install-btn')) {
                addInstallButton();
            }
        }, 5000);
    };
    
    // Export functions for external use
    window.PWAInstall = {
        showInstallPrompt,
        isAppInstalled,
        trackInstallation,
        addInstallButton
    };
    
    // Add keyboard shortcut for testing (Ctrl+Shift+I)
    window.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.key === 'I') {
            e.preventDefault();
            console.log('Manual install button trigger activated');
            if (!document.getElementById('pwa-install-btn')) {
                addInstallButton();
                console.log('Install button added manually');
            } else {
                console.log('Install button already exists');
            }
        }
    });
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
