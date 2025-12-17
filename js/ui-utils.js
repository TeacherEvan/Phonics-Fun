/**
 * UI Utilities for Phonics Fun
 * Enhanced micro-interactions, loading states, and visual feedback
 * Author: Phonics Fun Development Team
 */

class UIUtils {
    constructor() {
        this.loadingStates = new Map();
        this.transitionDuration = 300;
        this.init();
    }

    init() {
        console.log('✨ Initializing UI Utilities...');
        this.injectStyles();
        this.setupRippleEffect();
    }

    /**
     * Inject additional CSS for enhanced UI components
     */
    injectStyles() {
        const styles = document.createElement('style');
        styles.id = 'ui-utils-styles';
        styles.textContent = `
            /* Loading skeleton animation */
            .skeleton-loading {
                position: relative;
                overflow: hidden;
                background: linear-gradient(90deg, #2a2a3e 25%, #3a3a4e 50%, #2a2a3e 75%);
                background-size: 200% 100%;
                animation: skeletonPulse 1.5s ease-in-out infinite;
            }

            @keyframes skeletonPulse {
                0% { background-position: 200% 0; }
                100% { background-position: -200% 0; }
            }

            /* Button ripple effect */
            .ripple-container {
                position: relative;
                overflow: hidden;
            }

            .ripple {
                position: absolute;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.4);
                transform: scale(0);
                animation: rippleAnimation 0.6s ease-out forwards;
                pointer-events: none;
            }

            @keyframes rippleAnimation {
                to {
                    transform: scale(4);
                    opacity: 0;
                }
            }

            /* Enhanced hover states */
            .interactive-element {
                transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1),
                            box-shadow 0.2s ease,
                            filter 0.2s ease;
                will-change: transform;
            }

            .interactive-element:hover {
                transform: translateY(-2px) scale(1.02);
                box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
                filter: brightness(1.1);
            }

            .interactive-element:active {
                transform: translateY(0) scale(0.98);
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
            }

            /* Smooth screen transitions */
            .screen-transition-enter {
                opacity: 0;
                transform: translateY(20px);
            }

            .screen-transition-enter-active {
                opacity: 1;
                transform: translateY(0);
                transition: opacity 0.4s ease, transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
            }

            .screen-transition-exit {
                opacity: 1;
                transform: translateY(0);
            }

            .screen-transition-exit-active {
                opacity: 0;
                transform: translateY(-20px);
                transition: opacity 0.3s ease, transform 0.3s ease;
            }

            /* Focus states for accessibility */
            .focus-visible:focus {
                outline: 3px solid #ffd700;
                outline-offset: 3px;
            }

            /* Toast notifications */
            .toast-container {
                position: fixed;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                z-index: 10000;
                display: flex;
                flex-direction: column;
                gap: 10px;
            }

            .toast {
                padding: 12px 24px;
                border-radius: 8px;
                color: white;
                font-weight: 500;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
                animation: toastSlideIn 0.3s ease;
                display: flex;
                align-items: center;
                gap: 10px;
            }

            .toast.success {
                background: linear-gradient(135deg, #00b894, #00a085);
            }

            .toast.error {
                background: linear-gradient(135deg, #ff6b6b, #ee5a5a);
            }

            .toast.info {
                background: linear-gradient(135deg, #74b9ff, #0984e3);
            }

            .toast-exit {
                animation: toastSlideOut 0.3s ease forwards;
            }

            @keyframes toastSlideIn {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            @keyframes toastSlideOut {
                from {
                    opacity: 1;
                    transform: translateY(0);
                }
                to {
                    opacity: 0;
                    transform: translateY(20px);
                }
            }

            /* Progress indicator */
            .loading-indicator {
                display: inline-flex;
                align-items: center;
                gap: 8px;
            }

            .loading-dots {
                display: flex;
                gap: 4px;
            }

            .loading-dot {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: currentColor;
                animation: loadingDot 1.4s ease-in-out infinite;
            }

            .loading-dot:nth-child(2) { animation-delay: 0.16s; }
            .loading-dot:nth-child(3) { animation-delay: 0.32s; }

            @keyframes loadingDot {
                0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
                40% { transform: scale(1); opacity: 1; }
            }

            /* Letter button pulse effect */
            .letter-button.playable::after {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                border-radius: inherit;
                box-shadow: 0 0 0 0 rgba(0, 184, 148, 0.5);
                animation: letterPulse 2s ease-out infinite;
            }

            @keyframes letterPulse {
                0% { box-shadow: 0 0 0 0 rgba(0, 184, 148, 0.5); }
                70% { box-shadow: 0 0 0 10px rgba(0, 184, 148, 0); }
                100% { box-shadow: 0 0 0 0 rgba(0, 184, 148, 0); }
            }

            /* Planet hover glow effect */
            .planet::after {
                content: '';
                position: absolute;
                top: -10px;
                left: -10px;
                right: -10px;
                bottom: -10px;
                border-radius: 50%;
                background: radial-gradient(circle, rgba(255, 255, 255, 0.2), transparent 70%);
                opacity: 0;
                transition: opacity 0.3s ease;
                pointer-events: none;
            }

            .planet:hover::after {
                opacity: 1;
            }

            /* Image lazy load fade-in */
            img.loaded {
                animation: imageFadeIn 0.3s ease;
            }

            @keyframes imageFadeIn {
                from { opacity: 0; transform: scale(0.95); }
                to { opacity: 1; transform: scale(1); }
            }

            /* Optimistic UI update */
            .optimistic-update {
                opacity: 0.7;
                pointer-events: none;
            }
        `;
        document.head.appendChild(styles);
    }

    /**
     * Setup ripple effect for interactive elements
     */
    setupRippleEffect() {
        document.addEventListener('click', (e) => {
            const button = e.target.closest('.primary-button, .secondary-button, .letter-button');
            if (!button) return;

            // Add ripple container class if not present
            if (!button.classList.contains('ripple-container')) {
                button.classList.add('ripple-container');
            }

            this.createRipple(e, button);
        });
    }

    /**
     * Create ripple effect at click position
     * @param {MouseEvent} event - Click event
     * @param {HTMLElement} element - Target element
     */
    createRipple(event, element) {
        const rect = element.getBoundingClientRect();
        const ripple = document.createElement('span');
        ripple.className = 'ripple';

        const size = Math.max(rect.width, rect.height);
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = (event.clientX - rect.left - size / 2) + 'px';
        ripple.style.top = (event.clientY - rect.top - size / 2) + 'px';

        element.appendChild(ripple);

        ripple.addEventListener('animationend', () => {
            ripple.remove();
        });
    }

    /**
     * Show loading skeleton for an element
     * @param {HTMLElement} element - Element to show skeleton for
     * @param {Object} options - Skeleton options
     */
    showSkeleton(element, options = {}) {
        const width = options.width || '100%';
        const height = options.height || '100%';
        const borderRadius = options.borderRadius || '8px';

        const skeleton = document.createElement('div');
        skeleton.className = 'skeleton-loading';
        skeleton.style.cssText = `
            width: ${width};
            height: ${height};
            border-radius: ${borderRadius};
            position: absolute;
            top: 0;
            left: 0;
            z-index: 1;
        `;

        element.style.position = 'relative';
        element.appendChild(skeleton);
        this.loadingStates.set(element, skeleton);

        return skeleton;
    }

    /**
     * Hide loading skeleton
     * @param {HTMLElement} element - Element with skeleton
     */
    hideSkeleton(element) {
        const skeleton = this.loadingStates.get(element);
        if (skeleton) {
            skeleton.style.opacity = '0';
            skeleton.style.transition = 'opacity 0.3s ease';
            setTimeout(() => {
                if (skeleton.parentNode) {
                    skeleton.remove();
                }
                this.loadingStates.delete(element);
            }, 300);
        }
    }
    
    /**
     * Show loading state for image with progressive enhancement
     * @param {string} src - Image source URL
     * @param {HTMLElement} container - Container element
     * @returns {Promise<HTMLImageElement>} Promise resolving to loaded image
     */
    loadImageProgressive(src, container) {
        return new Promise((resolve, reject) => {
            // Show skeleton while loading
            const skeleton = this.showSkeleton(container, {
                width: '100%',
                height: '100%',
                borderRadius: '8px'
            });
            
            const img = new Image();
            
            img.onload = () => {
                this.hideSkeleton(container);
                img.classList.add('loaded');
                resolve(img);
            };
            
            img.onerror = () => {
                this.hideSkeleton(container);
                reject(new Error(`Failed to load image: ${src}`));
            };
            
            img.src = src;
        });
    }

    /**
     * Show toast notification
     * @param {string} message - Message to display
     * @param {string} type - Type of toast (success, error, info)
     * @param {number} duration - Duration in milliseconds
     */
    showToast(message, type = 'info', duration = 3000) {
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        // Add icon based on type
        const icons = {
            success: '✓',
            error: '✗',
            info: 'ℹ'
        };

        toast.innerHTML = `
            <span class="toast-icon">${icons[type] || icons.info}</span>
            <span class="toast-message">${message}</span>
        `;

        container.appendChild(toast);

        // Auto remove after duration
        setTimeout(() => {
            toast.classList.add('toast-exit');
            setTimeout(() => toast.remove(), 300);
        }, duration);

        return toast;
    }

    /**
     * Create loading indicator
     * @param {string} text - Loading text
     * @returns {HTMLElement} Loading indicator element
     */
    createLoadingIndicator(text = 'Loading') {
        const indicator = document.createElement('div');
        indicator.className = 'loading-indicator';
        indicator.innerHTML = `
            <span>${text}</span>
            <div class="loading-dots">
                <div class="loading-dot"></div>
                <div class="loading-dot"></div>
                <div class="loading-dot"></div>
            </div>
        `;
        return indicator;
    }

    /**
     * Apply smooth screen transition
     * @param {HTMLElement} fromScreen - Screen to transition from
     * @param {HTMLElement} toScreen - Screen to transition to
     * @param {Function} callback - Callback after transition
     */
    transitionScreens(fromScreen, toScreen, callback) {
        // Exit animation for current screen
        fromScreen.classList.add('screen-transition-exit');
        fromScreen.classList.add('screen-transition-exit-active');

        setTimeout(() => {
            fromScreen.classList.remove('active', 'screen-transition-exit', 'screen-transition-exit-active');

            // Enter animation for new screen
            toScreen.classList.add('screen-transition-enter');
            toScreen.classList.add('active');

            requestAnimationFrame(() => {
                toScreen.classList.add('screen-transition-enter-active');
                toScreen.classList.remove('screen-transition-enter');
            });

            setTimeout(() => {
                toScreen.classList.remove('screen-transition-enter-active');
                if (callback) callback();
            }, this.transitionDuration);
        }, this.transitionDuration);
    }

    /**
     * Add interactive hover class to elements
     * @param {string} selector - CSS selector for elements
     */
    makeInteractive(selector) {
        document.querySelectorAll(selector).forEach(element => {
            element.classList.add('interactive-element');
        });
    }

    /**
     * Show optimistic update state
     * @param {HTMLElement} element - Element to update
     */
    showOptimisticUpdate(element) {
        element.classList.add('optimistic-update');
    }

    /**
     * Hide optimistic update state
     * @param {HTMLElement} element - Element to update
     */
    hideOptimisticUpdate(element) {
        element.classList.remove('optimistic-update');
    }

    /**
     * Animate element entrance
     * @param {HTMLElement} element - Element to animate
     * @param {string} animation - Animation type (fadeIn, slideUp, scaleIn)
     */
    animateEntrance(element, animation = 'fadeIn') {
        const animations = {
            fadeIn: 'opacity 0.3s ease',
            slideUp: 'opacity 0.3s ease, transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            scaleIn: 'opacity 0.3s ease, transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
        };

        const initialStyles = {
            fadeIn: { opacity: '0' },
            slideUp: { opacity: '0', transform: 'translateY(20px)' },
            scaleIn: { opacity: '0', transform: 'scale(0.8)' }
        };

        const finalStyles = {
            fadeIn: { opacity: '1' },
            slideUp: { opacity: '1', transform: 'translateY(0)' },
            scaleIn: { opacity: '1', transform: 'scale(1)' }
        };

        Object.assign(element.style, initialStyles[animation]);
        element.style.transition = animations[animation];

        requestAnimationFrame(() => {
            Object.assign(element.style, finalStyles[animation]);
        });
    }

    /**
     * Clean up UI utilities
     */
    destroy() {
        const styles = document.getElementById('ui-utils-styles');
        if (styles) styles.remove();

        const toastContainer = document.querySelector('.toast-container');
        if (toastContainer) toastContainer.remove();

        this.loadingStates.clear();
    }
}

// Export for global use
window.UIUtils = UIUtils;
