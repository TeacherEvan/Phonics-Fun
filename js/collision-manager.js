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
        // Type-level handlers are tracked separately so the all-pairs scan can
        // be skipped entirely when no type handler is registered.
        this.typeCollisionHandlers = new Map();
        // Pairs that are currently overlapping, for type-level handlers that
        // have no explicit pair registration.
        this.activeTypePairs = new Set();
        this.enabled = true;

        // Bind the update method for animation frame
        this.update = this.update.bind(this);
        this.animate = this.animate.bind(this);

        // Start the collision detection loop
        this.lastTime = 0;
        this.start();
    }

    /**
     * Start the collision detection loop
     */
    start() {
        this.enabled = true;
        // Guard against a second animation chain when start() is called while
        // the loop is already running.
        if (this.animationId) return;
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

        this.animationId = requestAnimationFrame(this.animate);
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
            console.error(
                `Cannot register object ${id}: element is null or undefined`,
            );
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
            data: options.data || {},
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
            object.radius =
                object.radius || Math.max(rect.width, rect.height) / 2;
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

        // Remove any collision pairs involving this object. The pair record
        // already carries both ids, so there is no need to split the key:
        // the ids are built from user-visible names, and splitting on '_'
        // broke the moment an id contained an underscore.
        this.collisionPairs.forEach((pair, key) => {
            if (pair.id1 === id || pair.id2 === id) {
                this.collisionPairs.delete(key);
            }
        });

        // Drop any latched type-pair state that referenced this object.
        for (const key of Array.from(this.activeTypePairs)) {
            if (key.startsWith(`${id}|`) || key.includes(`|${id}`)) {
                this.activeTypePairs.delete(key);
            }
        }
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
        this.typeCollisionHandlers.set(typeKey, handler);
    }

    /**
     * Check if two objects are colliding
     *
     * Uses a squared distance comparison: a square root per pair is wasted
     * work in the inner loop of an all-pairs scan.
     *
     * @param {Object} obj1 - First object
     * @param {Object} obj2 - Second object
     * @returns {boolean} - Whether the objects are colliding
     */
    checkCollision(obj1, obj2) {
        const dx = obj2.x - obj1.x;
        const dy = obj2.y - obj1.y;
        const minDistance = obj1.radius + obj2.radius;

        // Collision occurs when distance is less than sum of radii
        return dx * dx + dy * dy < minDistance * minDistance;
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
    update(_deltaTime) {
        if (!this.enabled || this.objects.size === 0) return;

        // Performance optimization: if no asteroids are currently active,
        // skip position updates and collision checks to avoid layout thrashing.
        let hasAsteroid = false;
        this.objects.forEach((obj) => {
            if (obj.type === 'asteroid') {
                hasAsteroid = true;
            }
        });
        if (!hasAsteroid) return;

        // Update positions of all objects
        this.objects.forEach((obj) => {
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
                const reverseTypeHandler =
                    this.collisionHandlers.get(reverseTypeKey);
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
                const reverseTypeHandler =
                    this.collisionHandlers.get(reverseTypeKey);
                if (reverseTypeHandler && reverseTypeKey !== typeKey) {
                    reverseTypeHandler(obj2, obj1, 'end');
                }
            }
        });

        // Check for type-based collisions not covered by a registered pair.
        //
        // This is an all-pairs scan, so it is only run when a type handler is
        // actually registered, and it visits each unordered pair once (upper
        // triangle) instead of twice. Each pair is latched so the handler
        // fires on the rising edge only — previously it fired on EVERY frame
        // the two objects overlapped, which could score one word twice.
        if (this.typeCollisionHandlers.size > 0) {
            const objects = Array.from(this.objects.values());

            for (let i = 0; i < objects.length; i++) {
                for (let j = i + 1; j < objects.length; j++) {
                    const obj1 = objects[i];
                    const obj2 = objects[j];

                    // Skip pairs that already have an explicit registration.
                    if (
                        this.collisionPairs.has(`${obj1.id}_${obj2.id}`) ||
                        this.collisionPairs.has(`${obj2.id}_${obj1.id}`)
                    ) {
                        continue;
                    }

                    const typeKey1 = `${obj1.type}_${obj2.type}`;
                    const typeKey2 = `${obj2.type}_${obj1.type}`;
                    const handler1 = this.typeCollisionHandlers.get(typeKey1);
                    const handler2 = this.typeCollisionHandlers.get(typeKey2);
                    if (!handler1 && !handler2) continue;

                    const pairKey = `${obj1.id}|${obj2.id}`;
                    const isColliding = this.checkCollision(obj1, obj2);
                    const wasColliding = this.activeTypePairs.has(pairKey);

                    if (isColliding === wasColliding) continue;

                    if (isColliding) {
                        this.activeTypePairs.add(pairKey);
                        if (handler1) handler1(obj1, obj2, 'start');
                        if (handler2 && typeKey1 !== typeKey2) {
                            handler2(obj2, obj1, 'start');
                        }
                    } else {
                        this.activeTypePairs.delete(pairKey);
                        if (handler1) handler1(obj1, obj2, 'end');
                        if (handler2 && typeKey1 !== typeKey2) {
                            handler2(obj2, obj1, 'end');
                        }
                    }
                }
            }
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
        this.objects.forEach((obj) => {
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
        this.activeTypePairs.clear();
    }
}

// Export for use in main game (ES6 modules temporarily disabled)
// export default CollisionManager;
export default CollisionManager;

// Also attach to window for backward compatibility with tests
if (typeof window !== 'undefined') {
    window.CollisionManager = CollisionManager;
}
