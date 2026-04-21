// js/pwa-install-fixed.js - Fixed PWA install functionality
(function() {
    'use strict';
    
    let deferredPrompt = null;
    let isInstallable = false;
    let installButton = null;
    let downloadButton = null;
    
    // Check if app is already installed
    const isAppInstalled = () => {
        return localStorage.getItem('pwa_installed') === 'true';
    };
    
    // Track installation analytics
    const trackInstallation = (outcome) => {
        const analytics = {
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            outcome: outcome
        };
        
        // Store in localStorage for debugging
        const installations = JSON.parse(localStorage.getItem('pwa_installations') || '[]');
        installations.push(analytics);
        localStorage.setItem('pwa_installations', JSON.stringify(installations));
        
        console.log('Installation tracked:', analytics);
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
            
            // Mark as installed
            localStorage.setItem('pwa_installed', 'true');
            
            // Track installation
            trackInstallation('accepted');
        } else {
            console.log('User dismissed the install prompt');
            trackInstallation('dismissed');
            
            // Show info message about dismissal
            if (typeof showToast === 'function') {
                showToast('Install cancelled. You can install anytime from this button.', 'info', 4000);
            }
        }
        
        // Clear the deferred prompt
        deferredPrompt = null;
        isInstallable = false;
    };
    
    // Download app function
    const downloadApp = () => {
        console.log('Opening APK download page...');
        
        // Show loading state
        if (downloadButton) {
            downloadButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Opening...</span>';
            downloadButton.disabled = true;
        }
        
        // Open dedicated download page in new tab
        const downloadPageUrl = window.location.origin + '/download-apk.html';
        window.open(downloadPageUrl, '_blank', 'noopener,noreferrer');
        
        // Reset button after delay
        setTimeout(() => {
            if (downloadButton) {
                downloadButton.innerHTML = '<i class="fas fa-file-download"></i> <span>Download APK</span>';
                downloadButton.disabled = false;
            }
            
            if (typeof showToast === 'function') {
                showToast('Download page opened! Check new tab for APK download.', 'success', 5000);
            }
        }, 1500);
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
            
            .pwa-install-btn, .pwa-download-btn {
                background: linear-gradient(135deg, #1E4D8C, #2c5aa0);
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 8px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 600;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                gap: 8px;
                text-decoration: none;
                min-height: 40px;
                white-space: nowrap;
            }
            
            .pwa-install-btn:hover, .pwa-download-btn:hover {
                background: linear-gradient(135deg, #2c5aa0, #1E4D8C);
                transform: translateY(-2px);
                box-shadow: 0 4px 15px rgba(30, 58, 138, 0.3);
            }
            
            .pwa-install-btn:active, .pwa-download-btn:active {
                transform: translateY(0);
                box-shadow: 0 2px 8px rgba(30, 58, 138, 0.3);
            }
            
            .pwa-install-btn .fas, .pwa-download-btn .fas {
                font-size: 16px;
            }
            
            .pwa-install-btn span, .pwa-download-btn span {
                font-weight: 600;
            }
            
            @media (max-width: 768px) {
                .pwa-install-btn, .pwa-download-btn {
                    padding: 6px 12px;
                    font-size: 12px;
                    min-height: 36px;
                }
                
                .pwa-install-btn span, .pwa-download-btn span {
                    display: none;
                }
                
                .pwa-install-btn .fas, .pwa-download-btn .fas {
                    font-size: 14px;
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
        
        // Insert before the request installation button
        const requestBtn = navActions.querySelector('.btn-primary');
        if (requestBtn) {
            navActions.insertBefore(buttonContainer, requestBtn);
        } else {
            navActions.appendChild(buttonContainer);
        }
        
        // Show container with animation
        buttonContainer.style.display = 'flex';
        buttonContainer.style.animation = 'slideInRight 0.5s ease-out';
        
        // Store reference to buttons
        installButton = buttonContainer.querySelector('#pwa-install-btn');
        downloadButton = buttonContainer.querySelector('#pwa-download-btn');
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
                showToast('🎉 Linknet Fiber App installed successfully!', 'success', 5000);
            }
        });
    };
    
    // Check installation status
    const checkInstallationStatus = () => {
        // Determine if the app is already installed
        if (isAppInstalled()) {
            console.log('PWA is already installed');
            return;
        }
        
        // Listen for install prompt
        listenForInstallPrompt();
        
        // Listen for app installation
        listenForAppInstalled();
    };
    
    // Add animations
    const addAnimations = () => {
        const animationStyle = document.createElement('style');
        animationStyle.textContent = `
            @keyframes slideInRight {
                from {
                    opacity: 0;
                    transform: translateX(100px);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }
        `;
        document.head.appendChild(animationStyle);
    };
    
    // Initialize PWA functionality
    const init = () => {
        console.log('Initializing PWA install functionality...');
        
        addAnimations();
        checkInstallationStatus();
        
        // Add fallback button for localhost testing
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.log('Running on localhost - adding fallback install button');
            setTimeout(() => {
                if (!document.getElementById('pwa-install-btn')) {
                    addInstallButton();
                    console.log('Install button added for localhost testing');
                }
            }, 500);
        }
        
        // Always show install button for debugging
        if (window.location.hostname.includes('github.io') || window.location.hostname.includes('trapkid254')) {
            console.log('Running on GitHub Pages - adding install button for debugging');
            setTimeout(() => {
                if (!document.getElementById('pwa-install-btn')) {
                    addInstallButton();
                    console.log('Install button added for GitHub Pages debugging');
                }
            }, 1000);
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
