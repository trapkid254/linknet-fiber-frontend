
// js/pwa-install.js - Linknet Fiber PWA Install Manager v2
// Handles: Chrome/Edge/Samsung (beforeinstallprompt), iOS Safari (manual guide),
//          Firefox (manual guide), already-installed detection, race conditions

(function () {
  'use strict';

  // ── State ─────────────────────────────────────────────────────────────────
  // Use window-level so it survives across modules/scripts
  if (!window._lwPWA) {
    window._lwPWA = {
      deferredPrompt: null,     // The BeforeInstallPromptEvent
      promptCaptured: false,    // Whether we've captured the prompt
      initialized: false        // Whether wireButtons has run
    };
  }

  const state = window._lwPWA;

  // ── Detect environment ────────────────────────────────────────────────────
  const isInstalled = () =>
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: window-controls-overlay)').matches ||
    window.navigator.standalone === true ||
    document.referrer.startsWith('android-app://');

  const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const isAndroid = () => /Android/.test(navigator.userAgent);
  const isSamsung = () => /SamsungBrowser/.test(navigator.userAgent);
  const isChrome = () => /Chrome/.test(navigator.userAgent) && !/Chromium|Edge/.test(navigator.userAgent);
  const isEdge = () => /Edg\//.test(navigator.userAgent);
  const isFirefox = () => /Firefox/.test(navigator.userAgent);
  const isSafari = () => /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

  // Browsers that support beforeinstallprompt
  const supportsInstallPrompt = () => 'BeforeInstallPromptEvent' in window || isChrome() || isEdge() || isSamsung() || isAndroid();

  // ── Button visibility ─────────────────────────────────────────────────────
  const setInstallVisible = (visible) => {
    const btns = [
      document.getElementById('install-app-btn'),
      document.getElementById('mobile-install-btn')
    ];
    btns.forEach(btn => {
      if (!btn) return;
      if (visible) {
        btn.style.display = btn.id === 'install-app-btn' ? 'inline-flex' : 'flex';
        btn.removeAttribute('hidden');
      } else {
        btn.style.display = 'none';
      }
    });
  };

  // ── iOS: always show button so user can manually add to home screen ───────
  const showIOSButton = () => {
    if (isInstalled()) return; // Don't show if already installed
    setInstallVisible(true);

    // Update button text/label for iOS context
    const btns = [
      document.getElementById('install-app-btn'),
      document.getElementById('mobile-install-btn')
    ];
    btns.forEach(btn => {
      if (!btn) return;
      const icon = btn.querySelector('i');
      if (icon) icon.className = 'fas fa-plus-square';
      const textNode = Array.from(btn.childNodes).find(n => n.nodeType === Node.TEXT_NODE);
      if (textNode) textNode.textContent = ' Add to Home Screen';
      else btn.insertAdjacentText('beforeend', ' Add to Home Screen');
    });
  };

  // ── Trigger install ───────────────────────────────────────────────────────
  const triggerInstall = async () => {
    // Already installed
    if (isInstalled()) {
      showToast('Linknet Fiber is already installed on your device!', 'info');
      return;
    }

    // Native prompt available (Chrome, Edge, Samsung, Android WebView)
    if (state.deferredPrompt) {
      try {
        const promptEvent = state.deferredPrompt;

        // Show the native install dialog
        promptEvent.prompt();

        // Wait for the user's choice
        const { outcome } = await promptEvent.userChoice;

        if (outcome === 'accepted') {
          state.deferredPrompt = null;
          state.promptCaptured = false;
          setInstallVisible(false);
          showToast('🎉 Linknet Fiber App is being installed!', 'success');
        } else {
          // User dismissed — keep button visible for later
          showToast('Installation dismissed. You can install anytime from the navbar.', 'info');
        }
      } catch (err) {
        console.warn('[PWA] Install prompt error:', err);
        showManualGuide();
      }
      return;
    }

    // iOS Safari — show manual guide
    if (isIOS()) {
      showIOSGuide();
      return;
    }

    // Firefox / other — show generic guide
    showManualGuide();
  };

  // ── iOS guide modal ───────────────────────────────────────────────────────
  const showIOSGuide = () => {
    showModal({
      icon: '📱',
      title: 'Add to Home Screen',
      body: `
        <p style="margin:0 0 16px;color:#4a5568;line-height:1.7;font-size:0.9rem">
          To install Linknet Fiber on your iPhone or iPad:
        </p>
        <ol style="margin:0 0 16px;padding-left:20px;color:#4a5568;font-size:0.9rem;line-height:2">
          <li>Tap the <strong>Share button</strong> <span style="font-size:1rem">⬆️</span> at the bottom of Safari</li>
          <li>Scroll down and tap <strong>"Add to Home Screen"</strong> <span style="font-size:1rem">➕</span></li>
          <li>Tap <strong>"Add"</strong> in the top-right corner</li>
        </ol>
        <p style="margin:0;color:#718096;font-size:0.8rem">
          The app icon will appear on your home screen like a native app.
        </p>
      `
    });
  };

  // ── Generic manual guide ──────────────────────────────────────────────────
  const showManualGuide = () => {
    let steps = '';
    if (isFirefox()) {
      steps = `<li>Click the <strong>three-dot menu</strong> (⋮) in the top-right</li><li>Select <strong>"Install"</strong> or <strong>"Add to Home Screen"</strong></li>`;
    } else if (isEdge()) {
      steps = `<li>Click the <strong>three-dot menu</strong> (···) in the top-right</li><li>Select <strong>"Apps"</strong> → <strong>"Install this site as an app"</strong></li>`;
    } else {
      steps = `<li>Click the <strong>install icon</strong> (⊕) in the browser address bar</li><li>Or open the browser menu (⋮) and select <strong>"Install App"</strong></li>`;
    }

    showModal({
      icon: '📥',
      title: 'Install Linknet Fiber',
      body: `
        <p style="margin:0 0 12px;color:#4a5568;font-size:0.9rem">Follow these steps to install:</p>
        <ol style="margin:0 0 16px;padding-left:20px;color:#4a5568;font-size:0.9rem;line-height:2">${steps}</ol>
        <p style="margin:0;color:#718096;font-size:0.8rem">Once installed, you'll get an app icon and offline access.</p>
      `
    });
  };

  // ── Modal helper ──────────────────────────────────────────────────────────
  const showModal = ({ icon, title, body }) => {
    // Remove any existing modal
    const existing = document.getElementById('pwa-install-modal');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'pwa-install-modal';
    overlay.style.cssText = `
      position:fixed; inset:0; background:rgba(0,0,0,0.65); z-index:999999;
      display:flex; align-items:center; justify-content:center; padding:20px;
      animation: fadeIn 0.2s ease;
    `;

    overlay.innerHTML = `
      <style>
        @keyframes fadeIn { from{opacity:0;transform:scale(0.95)} to{opacity:1;transform:scale(1)} }
        #pwa-install-modal .modal-card {
          background:#fff; border-radius:20px; padding:32px 28px;
          max-width:400px; width:100%; box-shadow:0 24px 60px rgba(0,0,0,0.25);
          text-align:center; animation:fadeIn 0.25s ease;
          font-family: 'Inter', system-ui, sans-serif;
        }
        [data-theme="dark"] #pwa-install-modal .modal-card {
          background:#1a202c; color:#e2e8f0;
        }
        [data-theme="dark"] #pwa-install-modal p,
        [data-theme="dark"] #pwa-install-modal li { color:#a0aec0 !important; }
        #pwa-install-modal .modal-btn {
          background: linear-gradient(135deg, #1E4D8C, #2563EB);
          color:#fff; border:none; border-radius:10px; padding:12px 28px;
          font-size:0.95rem; font-weight:700; cursor:pointer; width:100%;
          margin-top:4px; letter-spacing:0.02em; transition:opacity 0.2s;
        }
        #pwa-install-modal .modal-btn:hover { opacity:0.9; }
        #pwa-install-modal .modal-close-x {
          position:absolute; top:14px; right:18px; font-size:1.4rem;
          cursor:pointer; color:#a0aec0; line-height:1; border:none; background:none;
        }
      </style>
      <div class="modal-card" style="position:relative">
        <button class="modal-close-x" aria-label="Close">&times;</button>
        <div style="font-size:2.8rem;margin-bottom:14px">${icon}</div>
        <h3 style="margin:0 0 14px;color:#1E4D8C;font-size:1.15rem;font-weight:700">${title}</h3>
        ${body}
        <button class="modal-btn" style="margin-top:18px">Got it!</button>
      </div>
    `;

    document.body.appendChild(overlay);

    // Close handlers
    const close = () => overlay.remove();
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    overlay.querySelector('.modal-close-x').addEventListener('click', close);
    overlay.querySelector('.modal-btn').addEventListener('click', close);
  };

  // ── Toast notification ────────────────────────────────────────────────────
  const showToast = (message, type = 'info') => {
    // Use global showToast if available from main.js
    if (typeof window.showToast === 'function') {
      window.showToast(message, type, 5000);
      return;
    }
    const existing = document.getElementById('pwa-toast');
    if (existing) existing.remove();

    const colors = { success: '#38a169', error: '#e53e3e', info: '#3182ce', warning: '#d69e2e' };
    const toast = document.createElement('div');
    toast.id = 'pwa-toast';
    toast.style.cssText = `
      position:fixed; bottom:28px; right:24px; z-index:99998;
      padding:14px 20px; border-radius:12px; color:#fff; font-weight:600;
      font-size:0.88rem; line-height:1.4; box-shadow:0 6px 20px rgba(0,0,0,0.2);
      background:${colors[type] || colors.info}; transition:opacity 0.4s;
      max-width:340px; word-wrap:break-word;
      font-family:'Inter',system-ui,sans-serif;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 400); }, 5000);
  };

  // ── Wire up buttons ───────────────────────────────────────────────────────
  const wireButtons = () => {
    if (state.initialized) return;
    state.initialized = true;

    const desktopBtn = document.getElementById('install-app-btn');
    const mobileBtn = document.getElementById('mobile-install-btn');

    if (desktopBtn) desktopBtn.addEventListener('click', triggerInstall);
    if (mobileBtn) mobileBtn.addEventListener('click', triggerInstall);

    // Already installed — hide buttons
    if (isInstalled()) {
      setInstallVisible(false);
      return;
    }

    // iOS Safari — always show the button (no prompt event available)
    if (isIOS()) {
      showIOSButton();
      return;
    }

    // If the prompt was already captured before DOM was ready, show buttons now
    if (state.promptCaptured && state.deferredPrompt) {
      setInstallVisible(true);
    }
  };

  // ── Global beforeinstallprompt listener ───────────────────────────────────
  // This MUST be registered as early as possible to catch the event.
  // It is registered on window immediately (not inside DOMContentLoaded)
  // so it fires even if the browser dispatches it early.
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); // Stop browser from showing its own mini-infobar
    state.deferredPrompt = e;
    state.promptCaptured = true;
    console.log('[PWA] beforeinstallprompt captured');

    // Show install buttons if DOM is ready and not installed
    if (!isInstalled()) {
      setInstallVisible(true);
    }
  });

  // ── App installed callback ────────────────────────────────────────────────
  window.addEventListener('appinstalled', () => {
    state.deferredPrompt = null;
    state.promptCaptured = false;
    setInstallVisible(false);
    showToast('🎉 Linknet Fiber App installed successfully!', 'success');
    console.log('[PWA] App installed!');
  });

  // ── Register Service Worker ───────────────────────────────────────────────
  const registerSW = () => {
    if (!('serviceWorker' in navigator)) {
      console.log('[PWA] Service Worker not supported');
      return;
    }

    // Determine correct SW path based on current page location
    const swPath = window.location.pathname.includes('/admin/')
      ? '../sw.js'
      : './sw.js';

    const swScope = window.location.pathname.includes('/admin/')
      ? '../'
      : './';

    navigator.serviceWorker.register(swPath, { scope: swScope })
      .then((registration) => {
        console.log('[PWA] Service Worker registered. Scope:', registration.scope);

        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New version available
              showUpdateBanner();
            }
          });
        });
      })
      .catch((err) => {
        console.warn('[PWA] Service Worker registration failed:', err.message);
      });
  };

  // ── Update banner when new SW version is available ────────────────────────
  const showUpdateBanner = () => {
    const existing = document.getElementById('pwa-update-banner');
    if (existing) return;

    const banner = document.createElement('div');
    banner.id = 'pwa-update-banner';
    banner.style.cssText = `
      position:fixed; top:0; left:0; right:0; z-index:99999;
      background:#1E4D8C; color:#fff; padding:12px 20px;
      display:flex; align-items:center; justify-content:center; gap:16px;
      font-family:'Inter',system-ui,sans-serif; font-size:0.88rem; font-weight:600;
      box-shadow:0 2px 8px rgba(0,0,0,0.2);
    `;
    banner.innerHTML = `
      <span>🔄 A new version of Linknet Fiber is available!</span>
      <button onclick="window.location.reload()" style="
        background:#C6A43F; color:#fff; border:none; border-radius:6px;
        padding:6px 16px; font-size:0.85rem; font-weight:700; cursor:pointer;
      ">Update Now</button>
      <button onclick="this.parentElement.remove()" style="
        background:transparent; color:rgba(255,255,255,0.7); border:none;
        font-size:1.2rem; cursor:pointer; line-height:1; padding:0 4px;
      ">&times;</button>
    `;
    document.body.prepend(banner);
  };

  // ── Init ──────────────────────────────────────────────────────────────────
  // Register SW immediately (doesn't need DOM)
  registerSW();

  // Wire buttons once DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wireButtons);
  } else {
    wireButtons();
  }


// js/pwa-install.js - PWA Install functionality
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
