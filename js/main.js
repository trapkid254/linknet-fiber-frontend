// js/main.js - Main JavaScript functionality
(function() {
    'use strict';
    
    // Mobile Navigation Toggle
    const initMobileNav = () => {
        const toggleBtn = document.querySelector('.mobile-toggle');
        const navMenu = document.querySelector('.nav-menu');
        
        if (!toggleBtn || !navMenu) return;
        
        toggleBtn.addEventListener('click', () => {
            const isExpanded = toggleBtn.getAttribute('aria-expanded') === 'true';
            toggleBtn.setAttribute('aria-expanded', !isExpanded);
            navMenu.classList.toggle('active');
            
            // Animate hamburger
            toggleBtn.classList.toggle('active');
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!navMenu.contains(e.target) && !toggleBtn.contains(e.target) && navMenu.classList.contains('active')) {
                navMenu.classList.remove('active');
                toggleBtn.setAttribute('aria-expanded', 'false');
                toggleBtn.classList.remove('active');
            }
        });
        
        // Close menu when link is clicked
        navMenu.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                toggleBtn.setAttribute('aria-expanded', 'false');
                toggleBtn.classList.remove('active');
            });
        });
    };
    
    // Hero Slideshow
    const initSlideshow = () => {
        const slides = document.querySelectorAll('.slide');
        const dots = document.querySelectorAll('.dot');
        const prevBtn = document.querySelector('.slide-nav.prev');
        const nextBtn = document.querySelector('.slide-nav.next');
        
        if (!slides.length) return;
        
        let currentSlide = 0;
        let slideInterval;
        
        const showSlide = (index) => {
            slides.forEach((slide, i) => {
                slide.classList.toggle('active', i === index);
            });
            
            dots.forEach((dot, i) => {
                dot.classList.toggle('active', i === index);
                dot.setAttribute('aria-selected', i === index);
            });
            
            currentSlide = index;
        };
        
        const nextSlide = () => {
            const next = (currentSlide + 1) % slides.length;
            showSlide(next);
        };
        
        const prevSlide = () => {
            const prev = (currentSlide - 1 + slides.length) % slides.length;
            showSlide(prev);
        };
        
        const startSlideshow = () => {
            slideInterval = setInterval(nextSlide, 5000);
        };
        
        const stopSlideshow = () => {
            clearInterval(slideInterval);
        };
        
        // Event listeners
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                prevSlide();
                stopSlideshow();
                startSlideshow();
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                nextSlide();
                stopSlideshow();
                startSlideshow();
            });
        }
        
        dots.forEach((dot, i) => {
            dot.addEventListener('click', () => {
                showSlide(i);
                stopSlideshow();
                startSlideshow();
            });
        });
        
        // Pause on hover
        const slideshowContainer = document.querySelector('.slideshow-container');
        if (slideshowContainer) {
            slideshowContainer.addEventListener('mouseenter', stopSlideshow);
            slideshowContainer.addEventListener('mouseleave', startSlideshow);
        }
        
        // Start slideshow
        startSlideshow();
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') {
                prevSlide();
                stopSlideshow();
                startSlideshow();
            } else if (e.key === 'ArrowRight') {
                nextSlide();
                stopSlideshow();
                startSlideshow();
            }
        });
    };
    
    // Load Featured Packages
    const loadFeaturedPackages = async () => {
        const container = document.getElementById('featured-packages-container');
        if (!container) return;
        
        try {
            const response = await fetch('https://linknet-fiber-backend.onrender.com/api/packages');
            
            if (!response.ok) {
                throw new Error('Failed to fetch packages');
            }
            
            const packages = await response.json();
            
            // Display only first 3 packages as featured
            const featuredPackages = packages.slice(0, 3);
            
            container.innerHTML = featuredPackages.map(pkg => `
                <div class="package-card ${pkg.featured ? 'featured' : ''}">
                    ${pkg.featured ? '<div class="package-badge">Popular</div>' : ''}
                    <div class="package-header">
                        <h3 class="package-name">${pkg.name}</h3>
                        <div class="package-speed">${pkg.speed} <small>Mbps</small></div>
                    </div>
                    <div class="package-pricing">
                        <span class="price">KES ${pkg.price.toLocaleString()}</span>
                        <span class="period">/month</span>
                    </div>
                    <ul class="package-features">
                        ${pkg.features.map(feature => `
                            <li><i class="fas fa-check-circle"></i> ${feature}</li>
                        `).join('')}
                    </ul>
                    <div class="package-actions">
                        <a href="request.html?package=${pkg.id}" class="btn btn-primary btn-block">Request Installation</a>
                    </div>
                </div>
            `).join('');
            
        } catch (error) {
            console.error('Error loading packages:', error);
            container.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Unable to load packages. Please try again later.</p>
                </div>
            `;
        }
    };
    
    // Smooth Scrolling
    const initSmoothScroll = () => {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                const href = this.getAttribute('href');
                if (href === '#') return;
                
                const target = document.querySelector(href);
                if (target) {
                    e.preventDefault();
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    };
    
    // Toast Notification System
    window.showToast = (message, type = 'info', duration = 3000) => {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.setAttribute('role', 'alert');
        toast.innerHTML = `
            <span>${message}</span>
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    };
    
    // Initialize everything
    const init = () => {
        initMobileNav();
        initSlideshow();
        initSmoothScroll();
        loadFeaturedPackages();
    };
    
    // Run initialization when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();