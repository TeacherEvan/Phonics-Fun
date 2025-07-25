/**
 * Event Manager for Phonics Fun
 * Centralized event system for coordinating game events, animations, and audio
 * Author: GitHub Copilot
 */

class EventManager {
    constructor() {
        this.events = new Map();
        this.eventQueue = [];
        this.isProcessingQueue = false;
    }

    /**
     * Subscribe to an event
     * @param {string} eventName - Name of the event to subscribe to
     * @param {Function} callback - Function to call when the event is triggered
     * @param {Object} options - Additional options like priority
     * @returns {string} - Subscription ID for unsubscribing
     */
    subscribe(eventName, callback, options = {}) {
        if (!this.events.has(eventName)) {
            this.events.set(eventName, []);
        }

        const subscription = {
            id: this.generateId(),
            callback,
            priority: options.priority || 0,
            once: options.once || false
        };

        const subscribers = this.events.get(eventName);
        subscribers.push(subscription);
        
        // Sort by priority (higher priority first)
        subscribers.sort((a, b) => b.priority - a.priority);

        return subscription.id;
    }

    /**
     * Subscribe to an event and automatically unsubscribe after it fires once
     * @param {string} eventName - Name of the event to subscribe to
     * @param {Function} callback - Function to call when the event is triggered
     * @param {Object} options - Additional options like priority
     * @returns {string} - Subscription ID for unsubscribing
     */
    subscribeOnce(eventName, callback, options = {}) {
        options.once = true;
        return this.subscribe(eventName, callback, options);
    }

    /**
     * Unsubscribe from an event
     * @param {string} eventName - Name of the event to unsubscribe from
     * @param {string} subscriptionId - ID of the subscription to remove
     * @returns {boolean} - Whether the unsubscription was successful
     */
    unsubscribe(eventName, subscriptionId) {
        if (!this.events.has(eventName)) {
            return false;
        }

        const subscribers = this.events.get(eventName);
        const index = subscribers.findIndex(sub => sub.id === subscriptionId);

        if (index === -1) {
            return false;
        }

        subscribers.splice(index, 1);
        return true;
    }

    /**
     * Emit an event synchronously
     * @param {string} eventName - Name of the event to emit
     * @param {*} data - Data to pass to the event handlers
     */
    emit(eventName, data = {}) {
        if (!this.events.has(eventName)) {
            return;
        }

        const subscribers = this.events.get(eventName);
        const subscribersToRemove = [];

        for (const subscription of subscribers) {
            try {
                subscription.callback(data);
                
                // Mark for removal if it's a one-time subscription
                if (subscription.once) {
                    subscribersToRemove.push(subscription.id);
                }
            } catch (error) {
                console.error(`Error in event handler for "${eventName}":`, error);
            }
        }

        // Remove one-time subscriptions
        for (const id of subscribersToRemove) {
            this.unsubscribe(eventName, id);
        }
    }

    /**
     * Add an event to the queue for sequential processing
     * @param {string} eventName - Name of the event to queue
     * @param {*} data - Data to pass to the event handlers
     */
    queueEvent(eventName, data = {}) {
        this.eventQueue.push({ eventName, data });
        
        if (!this.isProcessingQueue) {
            this.processEventQueue();
        }
    }

    /**
     * Process events in the queue sequentially
     */
    async processEventQueue() {
        if (this.eventQueue.length === 0 || this.isProcessingQueue) {
            return;
        }

        this.isProcessingQueue = true;
        
        const { eventName, data } = this.eventQueue.shift();
        
        // Add a small delay to ensure events don't process too quickly
        await new Promise(resolve => setTimeout(resolve, 10));
        
        // Emit the event
        this.emit(eventName, data);
        
        // Continue processing the queue
        this.isProcessingQueue = false;
        this.processEventQueue();
    }

    /**
     * Generate a unique ID for subscriptions
     * @returns {string} - Unique ID
     */
    generateId() {
        return Math.random().toString(36).substring(2, 15) + 
               Math.random().toString(36).substring(2, 15);
    }

    /**
     * Check if an event has subscribers
     * @param {string} eventName - Name of the event to check
     * @returns {boolean} - Whether the event has subscribers
     */
    hasSubscribers(eventName) {
        return this.events.has(eventName) && this.events.get(eventName).length > 0;
    }

    /**
     * Clear all subscriptions for an event
     * @param {string} eventName - Name of the event to clear
     */
    clear(eventName) {
        if (this.events.has(eventName)) {
            this.events.delete(eventName);
        }
    }

    /**
     * Clear all subscriptions
     */
    clearAll() {
        this.events.clear();
        this.eventQueue = [];
        this.isProcessingQueue = false;
    }
}

// Export for use in main game
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EventManager;
}

// Global instance for easy access
window.EventManager = EventManager;
