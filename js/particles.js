/**
 * Particle System for Phonics Fun
 * Enhanced visual effects for space-themed gameplay
 * Author: AI Assistant
 */

class ParticleSystem {
    constructor() {
        this.particles = [];
        this.maxParticles = 100;
        this.container = null;
        this.animationId = null;
        this.isActive = false;
        
        this.init();
    }

    init() {
        console.log('Initializing particle system...');
        this.createContainer();
        this.isActive = true;
        this.animate();
    }

    createContainer() {
        this.container = document.createElement('div');
        this.container.className = 'particle-container';
        this.container.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 25;
        `;
        
        const gameArea = document.querySelector('.game-area');
        if (gameArea) {
            gameArea.appendChild(this.container);
        }
    }

    createParticle(x, y, type = 'default', options = {}) {
        if (this.particles.length >= this.maxParticles) {
            // Remove oldest particle
            this.removeParticle(this.particles[0]);
        }

        const particle = {
            id: Date.now() + Math.random(),
            x: x,
            y: y,
            type: type,
            life: 1.0,
            maxLife: options.maxLife || 1.0,
            size: options.size || 4,
            color: options.color || '#ffffff',
            velocity: {
                x: (Math.random() - 0.5) * (options.speed || 2),
                y: (Math.random() - 0.5) * (options.speed || 2)
            },
            gravity: options.gravity || 0,
            element: null,
            ...options
        };

        particle.element = this.createParticleElement(particle);
        this.container.appendChild(particle.element);
        this.particles.push(particle);

        return particle;
    }

    createParticleElement(particle) {
        const element = document.createElement('div');
        element.className = `particle particle-${particle.type}`;
        element.style.cssText = `
            position: absolute;
            width: ${particle.size}px;
            height: ${particle.size}px;
            background: ${particle.color};
            border-radius: 50%;
            left: ${particle.x}px;
            top: ${particle.y}px;
            transform: translate(-50%, -50%);
            pointer-events: none;
            z-index: 30;
        `;

        // Add special effects based on type
        switch (particle.type) {
            case 'explosion':
                element.style.background = `radial-gradient(circle, ${particle.color}, rgba(255, 215, 0, 0.8), transparent)`;
                element.style.boxShadow = `
                    0 0 ${particle.size}px ${particle.color},
                    0 0 ${particle.size * 2}px rgba(255, 215, 0, 0.6),
                    0 0 ${particle.size * 3}px rgba(255, 69, 0, 0.4)
                `;
                element.style.filter = 'blur(0.5px)';
                break;
            case 'trail':
                element.style.background = `linear-gradient(45deg, ${particle.color}, transparent)`;
                element.style.borderRadius = '2px';
                element.style.boxShadow = `0 0 ${particle.size}px ${particle.color}`;
                break;
            case 'spark':
                element.style.background = `radial-gradient(circle, #ffffff, ${particle.color})`;
                element.style.boxShadow = `0 0 ${particle.size * 2}px ${particle.color}`;
                element.style.filter = 'brightness(1.5)';
                break;
            case 'debris':
                element.style.background = `linear-gradient(45deg, #8B4513, #A0522D)`;
                element.style.borderRadius = '20% 80% 60% 40%';
                element.style.boxShadow = `0 0 ${particle.size}px rgba(139, 69, 19, 0.8)`;
                break;
                element.style.background = particle.color;
                element.style.boxShadow = `0 0 ${particle.size * 2}px ${particle.color}`;
                break;
            case 'debris':
                element.style.background = particle.color;
                element.style.borderRadius = '0';
                element.style.transform = `translate(-50%, -50%) rotate(${Math.random() * 360}deg)`;
                break;
        }

        return element;
    }

    removeParticle(particle) {
        if (particle.element && particle.element.parentNode) {
            particle.element.parentNode.removeChild(particle.element);
        }
        const index = this.particles.indexOf(particle);
        if (index > -1) {
            this.particles.splice(index, 1);
        }
    }

    updateParticle(particle, deltaTime) {
        // Update life
        particle.life -= deltaTime * (1 / particle.maxLife);
        
        if (particle.life <= 0) {
            this.removeParticle(particle);
            return;
        }

        // Update position
        particle.x += particle.velocity.x * deltaTime * 60;
        particle.y += particle.velocity.y * deltaTime * 60;
        
        // Apply gravity
        particle.velocity.y += particle.gravity * deltaTime * 60;

        // Update element position and opacity
        if (particle.element) {
            particle.element.style.left = `${particle.x}px`;
            particle.element.style.top = `${particle.y}px`;
            particle.element.style.opacity = particle.life;
            
            // Type-specific updates
            switch (particle.type) {
                case 'explosion':
                    const scale = 1 + (1 - particle.life) * 2;
                    particle.element.style.transform = `translate(-50%, -50%) scale(${scale})`;
                    break;
                case 'trail':
                    const length = particle.life * particle.size;
                    particle.element.style.width = `${length}px`;
                    break;
                case 'debris':
                    const rotation = (1 - particle.life) * 720;
                    particle.element.style.transform = `translate(-50%, -50%) rotate(${rotation}deg)`;
                    break;
            }
        }

        // Remove if off screen
        if (particle.x < -50 || particle.x > window.innerWidth + 50 ||
            particle.y < -50 || particle.y > window.innerHeight + 50) {
            this.removeParticle(particle);
        }
    }

    animate() {
        if (!this.isActive) return;

        const currentTime = Date.now();
        const deltaTime = (currentTime - (this.lastTime || currentTime)) / 1000;
        this.lastTime = currentTime;

        // Update all particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.updateParticle(this.particles[i], deltaTime);
        }

        this.animationId = requestAnimationFrame(() => this.animate());
    }

    // Effect generators
    createExplosion(x, y, intensity = 1) {
        const particleCount = Math.floor(20 * intensity);
        const colors = ['#ff6b6b', '#ff8e53', '#ff6b35', '#ffd93d', '#fff'];
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2;
            const speed = (Math.random() * 100 + 50) * intensity;
            const size = Math.random() * 6 + 2;
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            this.createParticle(x, y, 'explosion', {
                size: size,
                color: color,
                maxLife: 0.8,
                speed: speed,
                velocity: {
                    x: Math.cos(angle) * speed,
                    y: Math.sin(angle) * speed
                },
                gravity: 0.1
            });
        }

        // Add some sparks
        for (let i = 0; i < 10; i++) {
            this.createParticle(x, y, 'spark', {
                size: 2,
                color: '#ffffff',
                maxLife: 0.5,
                speed: Math.random() * 150 + 100,
                velocity: {
                    x: (Math.random() - 0.5) * 200,
                    y: (Math.random() - 0.5) * 200
                }
            });
        }
    }

    createEnhancedExplosion(x, y, intensity = 1) {
        const baseParticleCount = 15;
        const particleCount = Math.floor(baseParticleCount * intensity);
        
        // Create main explosion particles
        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2;
            const speed = (Math.random() * 3 + 2) * intensity;
            const size = Math.random() * 6 + 4;
            
            this.createParticle(x, y, 'explosion', {
                velocity: {
                    x: Math.cos(angle) * speed,
                    y: Math.sin(angle) * speed
                },
                size: size,
                color: `hsl(${Math.random() * 60 + 15}, 100%, ${Math.random() * 30 + 60}%)`,
                maxLife: Math.random() * 0.5 + 0.5,
                gravity: 0.1
            });
        }
        
        // Create sparks
        for (let i = 0; i < particleCount * 2; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = (Math.random() * 5 + 3) * intensity;
            
            this.createParticle(x, y, 'spark', {
                velocity: {
                    x: Math.cos(angle) * speed,
                    y: Math.sin(angle) * speed
                },
                size: Math.random() * 3 + 1,
                color: '#ffffff',
                maxLife: Math.random() * 0.3 + 0.2,
                gravity: 0.05
            });
        }
        
        // Create debris
        for (let i = 0; i < Math.floor(particleCount * 0.5); i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = (Math.random() * 2 + 1) * intensity;
            
            this.createParticle(x, y, 'debris', {
                velocity: {
                    x: Math.cos(angle) * speed,
                    y: Math.sin(angle) * speed
                },
                size: Math.random() * 4 + 2,
                color: '#8B4513',
                maxLife: Math.random() * 0.8 + 0.7,
                gravity: 0.2
            });
        }
        
        // Create shockwave ring
        this.createParticle(x, y, 'shockwave', {
            velocity: { x: 0, y: 0 },
            size: 10,
            color: 'rgba(255, 255, 255, 0.6)',
            maxLife: 0.4,
            gravity: 0
        });
    }

    createAsteroidTrail(x, y, velocity) {
        const trailLength = 5;
        for (let i = 0; i < trailLength; i++) {
            const offset = i * 10;
            this.createParticle(
                x - velocity.x * offset * 0.1,
                y - velocity.y * offset * 0.1,
                'trail',
                {
                    size: 8 - i,
                    color: '#ff6b6b',
                    maxLife: 0.5,
                    speed: 0,
                    velocity: { x: 0, y: 0 }
                }
            );
        }
    }

    createDebris(x, y, count = 15) {
        const colors = ['#8B4513', '#A0522D', '#CD853F', '#D2691E'];
        
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 80 + 20;
            const size = Math.random() * 4 + 1;
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            this.createParticle(x, y, 'debris', {
                size: size,
                color: color,
                maxLife: 1.5,
                velocity: {
                    x: Math.cos(angle) * speed,
                    y: Math.sin(angle) * speed
                },
                gravity: 0.05
            });
        }
    }

    createStarfield() {
        // Create ambient star particles
        const starCount = 50;
        for (let i = 0; i < starCount; i++) {
            const x = Math.random() * window.innerWidth;
            const y = Math.random() * window.innerHeight;
            const size = Math.random() * 2 + 1;
            const brightness = Math.random() * 0.8 + 0.2;
            
            this.createParticle(x, y, 'star', {
                size: size,
                color: `rgba(255, 255, 255, ${brightness})`,
                maxLife: 10,
                velocity: { x: 0, y: 0 },
                twinkle: true
            });
        }
    }

    // Public methods for game integration
    asteroidHit(x, y, isCorrect = true) {
        if (isCorrect) {
            this.createExplosion(x, y, 1.5);
            this.createDebris(x, y, 20);
        } else {
            this.createDebris(x, y, 8);
        }
    }

    asteroidTrail(x, y, velocity) {
        this.createAsteroidTrail(x, y, velocity);
    }

    planetDestroyed(x, y) {
        this.createExplosion(x, y, 2);
        this.createDebris(x, y, 25);
    }

    levelComplete() {
        // Create celebration particles
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        
        for (let i = 0; i < 100; i++) {
            setTimeout(() => {
                this.createParticle(centerX, centerY, 'explosion', {
                    size: Math.random() * 8 + 4,
                    color: ['#ffd700', '#ffed4e', '#00b894', '#74b9ff', '#fd79a8'][Math.floor(Math.random() * 5)],
                    maxLife: 2,
                    velocity: {
                        x: (Math.random() - 0.5) * 200,
                        y: (Math.random() - 0.5) * 200
                    },
                    gravity: 0.02
                });
            }, i * 50);
        }
    }

    // Cleanup
    destroy() {
        this.isActive = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        this.particles = [];
    }

    // Performance monitoring
    getParticleCount() {
        return this.particles.length;
    }

    clear() {
        this.particles.forEach(particle => this.removeParticle(particle));
        this.particles = [];
    }
}

// Export for use in main game
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ParticleSystem;
}

// Global instance for easy access
window.ParticleSystem = ParticleSystem;
