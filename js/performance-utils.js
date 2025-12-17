/**
 * Performance Utilities for Phonics Fun
 * Implements lazy loading, resource optimization, and performance monitoring
 * Author: Phonics Fun Development Team
 */

class PerformanceUtils {
    constructor() {
        this.imageObserver = null;
        this.performanceMetrics = {
            loadTime: 0,
            firstContentfulPaint: 0,
            largestContentfulPaint: 0
        };
        this.resourceCache = new Map();
        this.init();
    }

    init() {
        console.log('🚀 Initializing Performance Utilities...');
        this.setupLazyLoading();
        this.setupResourceHints();
        this.measurePerformance();
    }

    /**
     * Setup Intersection Observer for lazy loading images
     * Uses native loading="lazy" as fallback for unsupported browsers
     */
    setupLazyLoading() {
        if ('IntersectionObserver' in window) {
            const observerOptions = {
                root: null,
                rootMargin: '50px 0px', // Start loading 50px before entering viewport
                threshold: 0.01
            };

            this.imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const lazyImage = entry.target;
                        this.loadImage(lazyImage);
                        observer.unobserve(lazyImage);
                    }
                });
            }, observerOptions);

            console.log('✅ Lazy loading initialized with Intersection Observer');
        } else {
            console.log('⚠️ Intersection Observer not supported, using fallback');
            this.loadAllLazyImages();
        }
    }

    /**
     * Load a lazy image by replacing data-src with src
     * @param {HTMLImageElement} image - The image element to load
     */
    loadImage(image) {
        const src = image.dataset.src;
        if (!src) return;

        // Add loading state
        image.classList.add('loading');

        // Create a new image to preload
        const preloadImage = new Image();
        preloadImage.onload = () => {
            image.src = src;
            image.classList.remove('loading');
            image.classList.add('loaded');
            image.removeAttribute('data-src');
            
            // Trigger fade-in animation
            requestAnimationFrame(() => {
                image.style.opacity = '1';
            });
        };

        preloadImage.onerror = () => {
            console.error(`Failed to load image: ${src}`);
            image.classList.remove('loading');
            image.classList.add('error');
        };

        preloadImage.src = src;
    }

    /**
     * Register an image for lazy loading
     * @param {HTMLImageElement} image - The image element to observe
     */
    observeImage(image) {
        if (this.imageObserver) {
            // Set initial opacity for fade-in effect
            image.style.opacity = '0';
            image.style.transition = 'opacity 0.3s ease-in-out';
            this.imageObserver.observe(image);
        } else {
            this.loadImage(image);
        }
    }

    /**
     * Observe all images with data-src attribute
     */
    observeAllLazyImages() {
        const lazyImages = document.querySelectorAll('img[data-src]');
        lazyImages.forEach(image => this.observeImage(image));
    }

    /**
     * Fallback: Load all lazy images immediately (for browsers without Intersection Observer)
     */
    loadAllLazyImages() {
        const lazyImages = document.querySelectorAll('img[data-src]');
        lazyImages.forEach(image => this.loadImage(image));
    }

    /**
     * Setup resource hints for critical assets
     * Preloads essential resources before they're needed
     */
    setupResourceHints() {
        // Preload critical CSS
        this.preloadResource('css/styles.css', 'style');

        // Preload critical fonts (if any custom fonts are added)
        // this.preloadResource('fonts/game-font.woff2', 'font');

        // Prefetch audio files that will be needed soon
        const criticalAudio = [
            'assets/sounds/explosion.wav',
            'assets/sounds/celebration.wav'
        ];

        criticalAudio.forEach(url => {
            this.prefetchResource(url);
        });
    }

    /**
     * Preload a critical resource
     * @param {string} url - URL of the resource
     * @param {string} type - Type of resource (style, script, font)
     */
    preloadResource(url, type) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = url;
        link.as = type;
        
        if (type === 'font') {
            link.crossOrigin = 'anonymous';
        }
        
        document.head.appendChild(link);
    }

    /**
     * Prefetch a resource for later use
     * @param {string} url - URL of the resource
     */
    prefetchResource(url) {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = url;
        document.head.appendChild(link);
    }

    /**
     * Measure and log performance metrics
     */
    measurePerformance() {
        if ('PerformanceObserver' in window) {
            // Measure Largest Contentful Paint (LCP)
            try {
                const lcpObserver = new PerformanceObserver((entryList) => {
                    const entries = entryList.getEntries();
                    const lastEntry = entries[entries.length - 1];
                    this.performanceMetrics.largestContentfulPaint = lastEntry.startTime;
                    console.log(`📊 LCP: ${lastEntry.startTime.toFixed(2)}ms`);
                });
                lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
            } catch (e) {
                console.log('LCP observation not supported');
            }

            // Measure First Contentful Paint (FCP)
            try {
                const fcpObserver = new PerformanceObserver((entryList) => {
                    const entries = entryList.getEntries();
                    entries.forEach(entry => {
                        if (entry.name === 'first-contentful-paint') {
                            this.performanceMetrics.firstContentfulPaint = entry.startTime;
                            console.log(`📊 FCP: ${entry.startTime.toFixed(2)}ms`);
                        }
                    });
                });
                fcpObserver.observe({ type: 'paint', buffered: true });
            } catch (e) {
                console.log('FCP observation not supported');
            }
        }

        // Measure page load time
        window.addEventListener('load', () => {
            const loadTime = performance.now();
            this.performanceMetrics.loadTime = loadTime;
            console.log(`📊 Page Load Time: ${loadTime.toFixed(2)}ms`);
        });
    }

    /**
     * Get current performance metrics
     * @returns {Object} Performance metrics
     */
    getMetrics() {
        return this.performanceMetrics;
    }

    /**
     * Debounce function for performance-sensitive handlers
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in milliseconds
     * @returns {Function} Debounced function
     */
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func.apply(this, args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Throttle function for rate-limiting handlers
     * @param {Function} func - Function to throttle
     * @param {number} limit - Limit time in milliseconds
     * @returns {Function} Throttled function
     */
    static throttle(func, limit) {
        let inThrottle;
        return function executedFunction(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => {
                    inThrottle = false;
                }, limit);
            }
        };
    }

    /**
     * Request idle callback with fallback
     * @param {Function} callback - Callback to execute when idle
     */
    static requestIdleCallback(callback) {
        if ('requestIdleCallback' in window) {
            window.requestIdleCallback(callback);
        } else {
            setTimeout(callback, 1);
        }
    }

    /**
     * Preload images for a specific letter level
     * @param {string} letter - The letter to preload images for
     */
    preloadLetterImages(letter) {
        const letterLower = letter.toLowerCase();
        const imagePath = `Assets/images/${letter}-${letterLower}/Images/`;
        
        // Common word images for each letter
        const letterImages = {
            'G': ['girl', 'goat', 'gold', 'grape', 'grandpa'],
            'A': ['apple', 'ant', 'airplane', 'alligator', 'arrow'],
            'B': ['ball', 'bat', 'bear', 'boat', 'butterfly']
        };

        const images = letterImages[letter] || [];
        
        // Use requestIdleCallback for non-blocking preloading
        PerformanceUtils.requestIdleCallback(() => {
            images.forEach((word, index) => {
                // Stagger image loading to avoid blocking
                setTimeout(() => {
                    const img = new Image();
                    img.onload = () => {
                        console.log(`✅ Preloaded: ${letter}-${word}`);
                    };
                    img.onerror = () => {
                        console.log(`⚠️ Failed to preload: ${letter}-${word}`);
                    };
                    img.src = `${imagePath}${word}.png`;
                    this.resourceCache.set(`${letter}-${word}`, img);
                }, index * 100); // Stagger by 100ms
            });
        });

        console.log(`📦 Preloading images for letter: ${letter}`);
    }
    
    /**
     * Get cached image for a letter-word combination
     * @param {string} letter - The letter
     * @param {string} word - The word
     * @returns {HTMLImageElement|null} Cached image or null
     */
    getCachedImage(letter, word) {
        return this.resourceCache.get(`${letter}-${word}`) || null;
    }

    /**
     * Clean up observers and resources
     */
    destroy() {
        if (this.imageObserver) {
            this.imageObserver.disconnect();
            this.imageObserver = null;
        }
        this.resourceCache.clear();
    }
}

// Export for global use
window.PerformanceUtils = PerformanceUtils;
