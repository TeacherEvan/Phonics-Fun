package com.phonicsfun.core;

import android.graphics.RectF;
import java.util.ArrayList;
import java.util.List;

/**
 * CollisionManager - Handles collision detection for game objects
 * Android/Java implementation for the Phonics Fun game
 */
public class CollisionManager {
    private static final String TAG = "PhonicsCollisionManager";
    
    private List<CollisionObject> collisionObjects;
    private List<CollisionListener> collisionListeners;
    
    public CollisionManager() {
        collisionObjects = new ArrayList<>();
        collisionListeners = new ArrayList<>();
    }
    
    /**
     * Interface for collision listeners
     */
    public interface CollisionListener {
        void onCollision(CollisionObject obj1, CollisionObject obj2);
    }
    
    /**
     * Base class for collision objects
     */
    public static class CollisionObject {
        public String id;
        public String type;
        public RectF bounds;
        public boolean isActive;
        public Object userData;
        
        public CollisionObject(String id, String type, RectF bounds) {
            this.id = id;
            this.type = type;
            this.bounds = bounds;
            this.isActive = true;
            this.userData = null;
        }
        
        public CollisionObject(String id, String type, float x, float y, float width, float height) {
            this(id, type, new RectF(x, y, x + width, y + height));
        }
        
        public void updateBounds(float x, float y, float width, float height) {
            bounds.set(x, y, x + width, y + height);
        }
        
        public void updatePosition(float x, float y) {
            float width = bounds.width();
            float height = bounds.height();
            bounds.set(x, y, x + width, y + height);
        }
        
        public float getCenterX() {
            return bounds.centerX();
        }
        
        public float getCenterY() {
            return bounds.centerY();
        }
        
        public boolean intersects(CollisionObject other) {
            return bounds.intersect(other.bounds);
        }
        
        public boolean contains(float x, float y) {
            return bounds.contains(x, y);
        }
    }
    
    /**
     * Specific collision objects for the game
     */
    public static class Planet extends CollisionObject {
        public String word;
        public String letter;
        public boolean isCorrect;
        
        public Planet(String id, String letter, String word, boolean isCorrect, float x, float y, float radius) {
            super(id, "planet", x - radius, y - radius, radius * 2, radius * 2);
            this.letter = letter;
            this.word = word;
            this.isCorrect = isCorrect;
        }
    }
    
    public static class Asteroid extends CollisionObject {
        public String letter;
        public boolean isCorrect;
        
        public Asteroid(String id, String letter, boolean isCorrect, float x, float y, float radius) {
            super(id, "asteroid", x - radius, y - radius, radius * 2, radius * 2);
            this.letter = letter;
            this.isCorrect = isCorrect;
        }
    }
    
    public static class Projectile extends CollisionObject {
        public float velocityX;
        public float velocityY;
        public long creationTime;
        
        public Projectile(String id, float x, float y, float width, float height, float vx, float vy) {
            super(id, "projectile", x, y, width, height);
            this.velocityX = vx;
            this.velocityY = vy;
            this.creationTime = System.currentTimeMillis();
        }
    }
    
    /**
     * Register a collision object
     */
    public void registerObject(CollisionObject obj) {
        if (!collisionObjects.contains(obj)) {
            collisionObjects.add(obj);
        }
    }
    
    /**
     * Unregister a collision object
     */
    public void unregisterObject(CollisionObject obj) {
        collisionObjects.remove(obj);
    }
    
    /**
     * Get collision object by ID
     */
    public CollisionObject getObjectById(String id) {
        for (CollisionObject obj : collisionObjects) {
            if (obj.id.equals(id)) {
                return obj;
            }
        }
        return null;
    }
    
    /**
     * Get all collision objects of a specific type
     */
    public List<CollisionObject> getObjectsByType(String type) {
        List<CollisionObject> result = new ArrayList<>();
        for (CollisionObject obj : collisionObjects) {
            if (obj.type.equals(type) && obj.isActive) {
                result.add(obj);
            }
        }
        return result;
    }
    
    /**
     * Add a collision listener
     */
    public void addCollisionListener(CollisionListener listener) {
        if (!collisionListeners.contains(listener)) {
            collisionListeners.add(listener);
        }
    }
    
    /**
     * Remove a collision listener
     */
    public void removeCollisionListener(CollisionListener listener) {
        collisionListeners.remove(listener);
    }
    
    /**
     * Check for collisions between all active objects
     */
    public void checkCollisions() {
        List<CollisionObject> activeObjects = new ArrayList<>();
        
        // Filter active objects
        for (CollisionObject obj : collisionObjects) {
            if (obj.isActive) {
                activeObjects.add(obj);
            }
        }
        
        // Check all pairs for collisions
        for (int i = 0; i < activeObjects.size(); i++) {
            for (int j = i + 1; j < activeObjects.size(); j++) {
                CollisionObject obj1 = activeObjects.get(i);
                CollisionObject obj2 = activeObjects.get(j);
                
                if (RectF.intersects(obj1.bounds, obj2.bounds)) {
                    notifyCollision(obj1, obj2);
                }
            }
        }
    }
    
    /**
     * Check collision between specific objects
     */
    public boolean checkCollision(CollisionObject obj1, CollisionObject obj2) {
        if (obj1.isActive && obj2.isActive) {
            boolean collides = RectF.intersects(obj1.bounds, obj2.bounds);
            if (collides) {
                notifyCollision(obj1, obj2);
            }
            return collides;
        }
        return false;
    }
    
    /**
     * Check if a point collides with any object of a specific type
     */
    public CollisionObject checkPointCollision(float x, float y, String type) {
        for (CollisionObject obj : collisionObjects) {
            if (obj.isActive && obj.type.equals(type) && obj.contains(x, y)) {
                return obj;
            }
        }
        return null;
    }
    
    /**
     * Get the closest object to a point
     */
    public CollisionObject getClosestObject(float x, float y, String type) {
        CollisionObject closest = null;
        float closestDistance = Float.MAX_VALUE;
        
        for (CollisionObject obj : collisionObjects) {
            if (obj.isActive && obj.type.equals(type)) {
                float distance = getDistance(x, y, obj.getCenterX(), obj.getCenterY());
                if (distance < closestDistance) {
                    closestDistance = distance;
                    closest = obj;
                }
            }
        }
        
        return closest;
    }
    
    /**
     * Calculate distance between two points
     */
    private float getDistance(float x1, float y1, float x2, float y2) {
        float dx = x2 - x1;
        float dy = y2 - y1;
        return (float) Math.sqrt(dx * dx + dy * dy);
    }
    
    /**
     * Notify collision listeners
     */
    private void notifyCollision(CollisionObject obj1, CollisionObject obj2) {
        for (CollisionListener listener : collisionListeners) {
            try {
                listener.onCollision(obj1, obj2);
            } catch (Exception e) {
                android.util.Log.e(TAG, "Error notifying collision listener: " + e.getMessage());
            }
        }
    }
    
    /**
     * Remove all inactive objects
     */
    public void cleanupInactiveObjects() {
        collisionObjects.removeIf(obj -> !obj.isActive);
    }
    
    /**
     * Clear all collision objects
     */
    public void clearAllObjects() {
        collisionObjects.clear();
    }
    
    /**
     * Get all active objects
     */
    public List<CollisionObject> getAllActiveObjects() {
        List<CollisionObject> result = new ArrayList<>();
        for (CollisionObject obj : collisionObjects) {
            if (obj.isActive) {
                result.add(obj);
            }
        }
        return result;
    }
    
    /**
     * Get object count by type
     */
    public int getObjectCount(String type) {
        int count = 0;
        for (CollisionObject obj : collisionObjects) {
            if (obj.isActive && obj.type.equals(type)) {
                count++;
            }
        }
        return count;
    }
}
