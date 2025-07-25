/**
 * Collision Manager for Phonics Fun
 * Handles collision detection and physics for game objects
 * Author: GitHub Copilot
 */

class CollisionManager {
    constructor() {
        this.objects = new Map();
        this.collisionPairs = new Map();
        this.collisionHandlers = new Map();
        this.enabled = true;
        
        // Bind the update method for animation frame
        this.update = this.update.bind(this);
        
        // Start the collision detection loop
        this.lastTime = 0;
        this.start();
    }

    /**
     * Start the collision detection loop
     */
    start() {
        this.enabled = true;
        this.animate(0);
    }

    /**
     * Stop the collision detection loop
     */
    stop() {
        this.enabled = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    /**
     * Animation loop for collision detection
     * @param {number} timestamp - Current animation timestamp
     */
    animate(timestamp) {
        if (!this.enabled) return;
        
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;
        
        this.update(deltaTime);
        
        this.animationId = requestAnimationFrame(this.animate.bind(this));
    }

    /**
     * Register a game object for collision detection
     * @param {string} id - Unique identifier for the object
     * @param {HTMLElement} element - DOM element for the object
     * @param {string} type - Type of the object (e.g., 'planet', 'asteroid')
     * @param {Object} options - Additional options like radius, velocity, etc.
     */
    registerObject(id, element, type, options = {}) {
        if (!element) {
            console.error(`Cannot register object ${id}: element is null or undefined`);
            return;
        }
        
        const rect = element.getBoundingClientRect();
        
        this.objects.set(id, {
            id,
            element,
            type,
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
            width: rect.width,
            height: rect.height,
            radius: options.radius || Math.max(rect.width, rect.height) / 2,
            velocity: options.velocity || { x: 0, y: 0 },
            mass: options.mass || 1,
            isStatic: options.isStatic || false,
            data: options.data || {}
        });
        
        // Update position when element is updated
        this.updateObjectPosition(id);
    }

    /**
     * Update an object's position based on its DOM element
     * @param {string} id - ID of the object to update
     */
    updateObjectPosition(id) {
        const object = this.objects.get(id);
        if (!object || !object.element) return;
        
        try {
            const rect = object.element.getBoundingClientRect();
            object.x = rect.left + rect.width / 2;
            object.y = rect.top + rect.height / 2;
            object.width = rect.width;
            object.height = rect.height;
            object.radius = object.radius || Math.max(rect.width, rect.height) / 2;
        } catch (error) {
            console.error(`Error updating position for object ${id}:`, error);
        }
    }

    /**
     * Unregister an object from collision detection
     * @param {string} id - ID of the object to unregister
     */
    unregisterObject(id) {
        this.objects.delete(id);
        
        // Remove any collision pairs involving this object
        this.collisionPairs.forEach((_, key) => {
            const [id1, id2] = key.split('_');
            if (id1 === id || id2 === id) {
                this.collisionPairs.delete(key);
            }
        });
    }

    /**
     * Register a collision pair to check for collisions
     * @param {string} id1 - ID of the first object
     * @param {string} id2 - ID of the second object
     * @param {Function} handler - Function to call when a collision occurs
     * @returns {string} - ID of the collision pair
     */
    registerCollisionPair(id1, id2, handler) {
        const pairId = `${id1}_${id2}`;
        this.collisionPairs.set(pairId, { id1, id2, colliding: false });
        
        if (handler) {
            this.collisionHandlers.set(pairId, handler);
        }
        
        return pairId;
    }

    /**
     * Register a collision handler for a type pair
     * @param {string} type1 - Type of the first object
     * @param {string} type2 - Type of the second object
     * @param {Function} handler - Function to call when a collision occurs
     */
    registerTypeCollision(type1, type2, handler) {
        const typeKey = `${type1}_${type2}`;
        this.collisionHandlers.set(typeKey, handler);
    }

    /**
     * Check if two objects are colliding
     * @param {Object} obj1 - First object
     * @param {Object} obj2 - Second object
     * @returns {boolean} - Whether the objects are colliding
     */
    checkCollision(obj1, obj2) {
        // Distance between centers
        const dx = obj2.x - obj1.x;
        const dy = obj2.y - obj1.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Sum of radii
        const minDistance = obj1.radius + obj2.radius;
        
        // Collision occurs when distance is less than sum of radii
        return distance < minDistance;
    }

    /**
     * Get all collisions for a specific object
     * @param {string} id - ID of the object to check
     * @returns {Array} - Array of colliding object IDs
     */
    getCollisionsForObject(id) {
        const collidingObjects = [];
        const obj1 = this.objects.get(id);
        
        if (!obj1) return collidingObjects;
        
        this.objects.forEach((obj2, id2) => {
            if (id !== id2 && this.checkCollision(obj1, obj2)) {
                collidingObjects.push(id2);
            }
        });
        
        return collidingObjects;
    }

    /**
     * Update all registered objects and check for collisions
     * @param {number} deltaTime - Time since last update in milliseconds
     */
    update(deltaTime) {
        if (!this.enabled || this.objects.size === 0) return;
        
        // Update positions of all objects
        this.objects.forEach(obj => {
            this.updateObjectPosition(obj.id);
        });
        
        // Check registered collision pairs
        this.collisionPairs.forEach((pair, pairId) => {
            const obj1 = this.objects.get(pair.id1);
            const obj2 = this.objects.get(pair.id2);
            
            if (!obj1 || !obj2) {
                // One of the objects no longer exists, remove the pair
                this.collisionPairs.delete(pairId);
                return;
            }
            
            const isColliding = this.checkCollision(obj1, obj2);
            
            // Collision started
            if (isColliding && !pair.colliding) {
                pair.colliding = true;
                
                // Call registered handler for this specific pair
                const handler = this.collisionHandlers.get(pairId);
                if (handler) {
                    handler(obj1, obj2, 'start');
                }
                
                // Call type-based handler
                const typeKey = `${obj1.type}_${obj2.type}`;
                const typeHandler = this.collisionHandlers.get(typeKey);
                if (typeHandler) {
                    typeHandler(obj1, obj2, 'start');
                }
                
                // Also check for reverse type order
                const reverseTypeKey = `${obj2.type}_${obj1.type}`;
                const reverseTypeHandler = this.collisionHandlers.get(reverseTypeKey);
                if (reverseTypeHandler && reverseTypeKey !== typeKey) {
                    reverseTypeHandler(obj2, obj1, 'start');
                }
            }
            // Collision ended
            else if (!isColliding && pair.colliding) {
                pair.colliding = false;
                
                // Call registered handler for this specific pair
                const handler = this.collisionHandlers.get(pairId);
                if (handler) {
                    handler(obj1, obj2, 'end');
                }
                
                // Call type-based handler
                const typeKey = `${obj1.type}_${obj2.type}`;
                const typeHandler = this.collisionHandlers.get(typeKey);
                if (typeHandler) {
                    typeHandler(obj1, obj2, 'end');
                }
                
                // Also check for reverse type order
                const reverseTypeKey = `${obj2.type}_${obj1.type}`;
                const reverseTypeHandler = this.collisionHandlers.get(reverseTypeKey);
                if (reverseTypeHandler && reverseTypeKey !== typeKey) {
                    reverseTypeHandler(obj2, obj1, 'end');
                }
            }
        });
        
        // Check for type-based collisions not in registered pairs
        if (this.collisionHandlers.size > 0) {
            const checkedPairs = new Set();
            
            this.objects.forEach((obj1, id1) => {
                this.objects.forEach((obj2, id2) => {
                    if (id1 === id2) return; // Skip self
                    
                    // Create a unique key for this pair (order doesn't matter for checking)
                    const pairKey = id1 < id2 ? `${id1}_${id2}` : `${id2}_${id1}`;
                    
                    // Skip if we've already checked this pair or it's a registered pair
                    if (checkedPairs.has(pairKey) || this.collisionPairs.has(`${id1}_${id2}`) || this.collisionPairs.has(`${id2}_${id1}`)) {
                        return;
                    }
                    
                    checkedPairs.add(pairKey);
                    
                    // Check for type-based handlers
                    const typeKey1 = `${obj1.type}_${obj2.type}`;
                    const typeKey2 = `${obj2.type}_${obj1.type}`;
                    
                    if (this.collisionHandlers.has(typeKey1) || this.collisionHandlers.has(typeKey2)) {
                        const isColliding = this.checkCollision(obj1, obj2);
                        
                        if (isColliding) {
                            // Call appropriate type handlers
                            const handler1 = this.collisionHandlers.get(typeKey1);
                            if (handler1) {
                                handler1(obj1, obj2, 'start');
                            }
                            
                            const handler2 = this.collisionHandlers.get(typeKey2);
                            if (handler2 && typeKey1 !== typeKey2) {
                                handler2(obj2, obj1, 'start');
                            }
                        }
                    }
                });
            });
        }
    }

    /**
     * Get an object by its ID
     * @param {string} id - ID of the object to get
     * @returns {Object|undefined} - The object or undefined if not found
     */
    getObject(id) {
        return this.objects.get(id);
    }

    /**
     * Get all objects of a specific type
     * @param {string} type - Type of objects to get
     * @returns {Array} - Array of objects of the specified type
     */
    getObjectsByType(type) {
        const result = [];
        this.objects.forEach(obj => {
            if (obj.type === type) {
                result.push(obj);
            }
        });
        return result;
    }

    /**
     * Clear all registered objects and collision pairs
     */
    clear() {
        this.objects.clear();
        this.collisionPairs.clear();
    }
}

// Export for use in main game
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CollisionManager;
}

// Global instance for easy access
window.CollisionManager = CollisionManager;
