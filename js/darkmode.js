// js/darkmode.js - Dark/Light Mode Toggle
(function() {
    'use strict';
    
    const STORAGE_KEY = 'linknet-theme';
    const DARK_THEME = 'dark';
    const LIGHT_THEME = 'light';
    
    // Get system preference
    const getSystemPreference = () => {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? DARK_THEME : LIGHT_THEME;
    };
    
    // Get saved theme or system preference
    const getTheme = () => {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved || getSystemPreference();
    };
    
    // Apply theme to document
    const applyTheme = (theme) => {
        document.documentElement.setAttribute('data-theme', theme);
        
        // Update toggle button icon
        const toggleBtn = document.querySelector('.theme-toggle');
        if (toggleBtn) {
            const icon = toggleBtn.querySelector('i');
            if (icon) {
                icon.className = theme === DARK_THEME ? 'fas fa-sun' : 'fas fa-moon';
            }
        }
        
        // Save to localStorage
        localStorage.setItem(STORAGE_KEY, theme);
    };
    
    // Toggle theme
    const toggleTheme = () => {
        const currentTheme = document.documentElement.getAttribute('data-theme') || LIGHT_THEME;
        const newTheme = currentTheme === LIGHT_THEME ? DARK_THEME : LIGHT_THEME;
        applyTheme(newTheme);
    };
    
    // Initialize theme
    const initTheme = () => {
        const theme = getTheme();
        applyTheme(theme);
        
        // Add event listener to toggle button
        const toggleBtn = document.querySelector('.theme-toggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', toggleTheme);
        }
        
        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem(STORAGE_KEY)) {
                applyTheme(e.matches ? DARK_THEME : LIGHT_THEME);
            }
        });
    };
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTheme);
    } else {
        initTheme();
    }
})();