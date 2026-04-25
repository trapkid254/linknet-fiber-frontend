// js/image-rotator.js - Universal image rotation system
(function() {
    'use strict';
    
    // All available images from the images folder
    const allImages = [
        'images/1000311337.jpg',
        'images/1000311339.jpg',
        'images/1000311343.jpg',
        'images/1000311401.jpg',
        'images/1000311402.jpg',
        'images/1000311404.jpg',
        'images/1000311407.jpg',
        'images/1000311409.jpg',
        'images/1000311410.jpg',
        'images/1000311426.jpg',
        'images/1000311428.jpg',
        'images/1000311430.jpg',
        'images/1000311431.jpg',
        'images/1000311432.jpg',
        'images/1000311433.jpg',
        'images/roszie-glass-fiber-7430901_1920.jpg'
    ];
    
    // Exclude logo image from rotation (keep it static)
    const logoImage = 'images/cb5e0bad-d1af-441b-b7d3-1a62c423fc2f.jpg';
    const rotatableImages = allImages;
    
    // Image rotation class
    class ImageRotator {
        constructor(containerSelector, options = {}) {
            this.container = document.querySelector(containerSelector);
            this.options = {
                interval: options.interval || 5000, // 5 seconds
                fadeDuration: options.fadeDuration || 1000,
                ...options
            };
            this.currentIndex = 0;
            this.images = options.images || rotatableImages;
            this.intervalId = null;
            
            if (this.container) {
                this.init();
            }
        }
        
        init() {
            if (this.images.length === 0) return;
            
            // Create initial image
            this.createImageElement();
            
            // Start rotation
            this.startRotation();
            
            // Add hover pause functionality
            this.addHoverPause();
        }
        
        createImageElement() {
            const img = document.createElement('img');
            img.src = this.images[this.currentIndex];
            img.alt = this.options.alt || 'Rotating image';
            img.style.opacity = '0';
            img.style.transition = `opacity ${this.options.fadeDuration}ms ease-in-out`;
            
            // Clear container and add new image
            this.container.innerHTML = '';
            this.container.appendChild(img);
            
            // Fade in
            setTimeout(() => {
                img.style.opacity = '1';
            }, 50);
        }
        
        rotate() {
            this.currentIndex = (this.currentIndex + 1) % this.images.length;
            const img = this.container.querySelector('img');
            
            if (img) {
                // Fade out
                img.style.opacity = '0';
                
                // Change image and fade in
                setTimeout(() => {
                    img.src = this.images[this.currentIndex];
                    img.style.opacity = '1';
                }, this.options.fadeDuration);
            }
        }
        
        startRotation() {
            this.intervalId = setInterval(() => {
                this.rotate();
            }, this.options.interval);
        }
        
        stopRotation() {
            if (this.intervalId) {
                clearInterval(this.intervalId);
                this.intervalId = null;
            }
        }
        
        addHoverPause() {
            if (this.container) {
                this.container.addEventListener('mouseenter', () => {
                    this.stopRotation();
                });
                
                this.container.addEventListener('mouseleave', () => {
                    this.startRotation();
                });
            }
        }
        
        destroy() {
            this.stopRotation();
            if (this.container) {
                this.container.removeEventListener('mouseenter', this.stopRotation);
                this.container.removeEventListener('mouseleave', this.startRotation);
            }
        }
    }
    
    // Hero slideshow functionality (enhanced)
    class HeroSlideshow {
        constructor(containerSelector, options = {}) {
            this.container = document.querySelector(containerSelector);
            this.options = {
                interval: options.interval || 6000,
                slideDuration: options.slideDuration || 1000,
                ...options
            };
            this.slides = [];
            this.currentSlide = 0;
            this.intervalId = null;
            this.indicators = [];
            
            if (this.container) {
                this.init();
            }
        }
        
        init() {
            // Create slides from all images (excluding logo)
            this.createSlides();
            
            // Create indicators
            this.createIndicators();
            
            // Start slideshow
            this.startSlideshow();
            
            // Add keyboard navigation
            this.addKeyboardNavigation();
            
            // Add touch/swipe support
            this.addTouchSupport();
        }
        
        createSlides() {
            const slideData = [
                {
                    image: 'images/roszie-glass-fiber-7430901_1920.jpg',
                    title: 'Experience <span class="highlight">Lightning Fast</span> Fiber Internet',
                    description: 'Stream, work, and game with speeds up to 1 Gbps. Kenya\'s most reliable fiber network.',
                    cta1: { text: 'View Packages', href: '/packages/' },
                    cta2: { text: 'Check Coverage', href: '#coverage-check' }
                },
                {
                    image: 'images/1000311407.jpg',
                    title: 'Connect Your <span class="highlight">Home & Business</span>',
                    description: 'Unlimited data, 24/7 support, and free installation. Join thousands of satisfied customers.',
                    cta1: { text: 'Get Started', href: '/packages/' },
                    cta2: { text: 'Contact Sales', href: '/contact/' }
                },
                {
                    image: 'images/1000311428.jpg',
                    title: 'Enterprise <span class="highlight">Solutions</span>',
                    description: 'Dedicated bandwidth, SLA-backed reliability, and 99.9% uptime guarantee.',
                    cta1: { text: 'Business Plans', href: '/packages/' },
                    cta2: { text: 'Request Quote', href: '/request/' }
                },
                {
                    image: 'images/1000311401.jpg',
                    title: 'Next-Generation <span class="highlight">Technology</span>',
                    description: 'Cutting-edge fiber infrastructure delivering unprecedented speeds and reliability.',
                    cta1: { text: 'Learn More', href: '/about/' },
                    cta2: { text: 'Get Started', href: '/packages/' }
                },
                {
                    image: 'images/1000311430.jpg',
                    title: 'Nationwide <span class="highlight">Coverage</span>',
                    description: 'Expanding rapidly to bring high-speed internet to every corner of Kenya.',
                    cta1: { text: 'Check Coverage', href: '#coverage-check' },
                    cta2: { text: 'View Plans', href: '/packages/' }
                },
                {
                    image: 'images/1000311431.jpg',
                    title: 'Professional <span class="highlight">Support</span>',
                    description: 'Expert technical support available 24/7 to keep you connected.',
                    cta1: { text: 'Contact Us', href: '/contact/' },
                    cta2: { text: 'Get Support', href: '/contact/' }
                }
            ];
            
            // Create HTML for all slides
            const slidesHTML = slideData.map((slide, index) => `
                <div class="slide ${index === 0 ? 'active' : ''}">
                    <img src="${slide.image}" alt="${slide.title.replace(/<[^>]*>/g, '')}" ${index === 0 ? 'loading="eager"' : 'loading="lazy"'}>
                    <div class="slide-content">
                        <h${index === 0 ? '1' : '2'} class="slide-title">${slide.title}</h${index === 0 ? '1' : '2'}>
                        <p class="slide-description">${slide.description}</p>
                        <div class="slide-cta">
                            <a href="${slide.cta1.href}" class="btn btn-primary btn-large">${slide.cta1.text}</a>
                            <a href="${slide.cta2.href}" class="btn btn-outline btn-large">${slide.cta2.text}</a>
                        </div>
                    </div>
                </div>
            `).join('');
            
            this.container.innerHTML = slidesHTML;
            this.slides = this.container.querySelectorAll('.slide');
        }
        
        createIndicators() {
            const indicatorsContainer = document.createElement('div');
            indicatorsContainer.className = 'slideshow-indicators';
            
            for (let i = 0; i < this.slides.length; i++) {
                const indicator = document.createElement('button');
                indicator.className = `indicator ${i === 0 ? 'active' : ''}`;
                indicator.setAttribute('aria-label', `Go to slide ${i + 1}`);
                indicator.addEventListener('click', () => this.goToSlide(i));
                indicatorsContainer.appendChild(indicator);
                this.indicators.push(indicator);
            }
            
            this.container.appendChild(indicatorsContainer);
        }
        
        goToSlide(index) {
            // Remove active class from current slide and indicator
            this.slides[this.currentSlide].classList.remove('active');
            this.indicators[this.currentSlide].classList.remove('active');
            
            // Add active class to new slide and indicator
            this.currentSlide = index;
            this.slides[this.currentSlide].classList.add('active');
            this.indicators[this.currentSlide].classList.add('active');
        }
        
        nextSlide() {
            const nextIndex = (this.currentSlide + 1) % this.slides.length;
            this.goToSlide(nextIndex);
        }
        
        startSlideshow() {
            this.intervalId = setInterval(() => {
                this.nextSlide();
            }, this.options.interval);
        }
        
        stopSlideshow() {
            if (this.intervalId) {
                clearInterval(this.intervalId);
                this.intervalId = null;
            }
        }
        
        addKeyboardNavigation() {
            document.addEventListener('keydown', (e) => {
                if (e.key === 'ArrowLeft') {
                    const prevIndex = (this.currentSlide - 1 + this.slides.length) % this.slides.length;
                    this.goToSlide(prevIndex);
                } else if (e.key === 'ArrowRight') {
                    this.nextSlide();
                }
            });
        }
        
        addTouchSupport() {
            let touchStartX = 0;
            let touchEndX = 0;
            
            this.container.addEventListener('touchstart', (e) => {
                touchStartX = e.changedTouches[0].screenX;
            });
            
            this.container.addEventListener('touchend', (e) => {
                touchEndX = e.changedTouches[0].screenX;
                this.handleSwipe();
            });
            
            const handleSwipe = () => {
                const swipeThreshold = 50;
                const diff = touchStartX - touchEndX;
                
                if (Math.abs(diff) > swipeThreshold) {
                    if (diff > 0) {
                        this.nextSlide(); // Swipe left, go to next
                    } else {
                        const prevIndex = (this.currentSlide - 1 + this.slides.length) % this.slides.length;
                        this.goToSlide(prevIndex); // Swipe right, go to previous
                    }
                }
            };
            
            this.handleSwipe = handleSwipe;
        }
    }
    
    // Initialize all rotating images when DOM is ready
    const initImageRotators = () => {
        // Hero slideshow
        new HeroSlideshow('.slideshow-container');
        
        // Coverage section rotating image
        new ImageRotator('.coverage-image', {
            interval: 4000,
            fadeDuration: 800,
            alt: 'Coverage map illustration'
        });
        
        // About page rotating image
        new ImageRotator('.about-image', {
            interval: 5000,
            fadeDuration: 1000,
            alt: 'Linknet Fiber Team'
        });
        
        // Any other image containers that should rotate
        // Add more as needed
    };
    
    // Export classes for potential use in other scripts
    window.ImageRotator = ImageRotator;
    window.HeroSlideshow = HeroSlideshow;
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initImageRotators);
    } else {
        initImageRotators();
    }
})();
