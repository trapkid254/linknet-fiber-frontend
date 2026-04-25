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
  });

  // ── Register Service Worker ───────────────────────────────────────────────
  const registerSW = () => {
    if (! ('serviceWorker' in navigator)) {
      console.log('[PWA] Service Worker not supported');
      return;
    }

    // Use absolute path from domain root to ensure correct path regardless of current page
    const swPath = window.location.origin + '/sw.js';
    const swScope = '/';

    console.log('[PWA] Registering SW with path:', swPath, 'scope:', swScope);

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
})();
