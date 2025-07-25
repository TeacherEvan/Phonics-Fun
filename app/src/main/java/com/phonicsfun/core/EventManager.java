package com.phonicsfun.core;

import android.os.Handler;
import android.os.Looper;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;

/**
 * EventManager - Handles event scheduling and game event coordination
 * Android/Java implementation for the Phonics Fun game
 */
public class EventManager {
    private static final String TAG = "PhonicsEventManager";
    
    private Handler mainHandler;
    private ConcurrentHashMap<String, List<EventListener>> eventListeners;
    private List<ScheduledEvent> scheduledEvents;
    
    public EventManager() {
        mainHandler = new Handler(Looper.getMainLooper());
        eventListeners = new ConcurrentHashMap<>();
        scheduledEvents = new ArrayList<>();
    }
    
    /**
     * Interface for event listeners
     */
    public interface EventListener {
        void onEvent(String eventType, Object data);
    }
    
    /**
     * Interface for scheduled events
     */
    public interface ScheduledCallback {
        void execute();
    }
    
    /**
     * Internal class for scheduled events
     */
    private static class ScheduledEvent {
        public Runnable runnable;
        public long delayMs;
        public boolean isRepeating;
        public boolean isCancelled;
        
        public ScheduledEvent(Runnable runnable, long delayMs, boolean isRepeating) {
            this.runnable = runnable;
            this.delayMs = delayMs;
            this.isRepeating = isRepeating;
            this.isCancelled = false;
        }
    }
    
    /**
     * Subscribe to an event type
     */
    public void subscribe(String eventType, EventListener listener) {
        eventListeners.computeIfAbsent(eventType, k -> new ArrayList<>()).add(listener);
    }
    
    /**
     * Unsubscribe from an event type
     */
    public void unsubscribe(String eventType, EventListener listener) {
        List<EventListener> listeners = eventListeners.get(eventType);
        if (listeners != null) {
            listeners.remove(listener);
            if (listeners.isEmpty()) {
                eventListeners.remove(eventType);
            }
        }
    }
    
    /**
     * Fire an event to all subscribers
     */
    public void fireEvent(String eventType, Object data) {
        List<EventListener> listeners = eventListeners.get(eventType);
        if (listeners != null) {
            for (EventListener listener : listeners) {
                try {
                    listener.onEvent(eventType, data);
                } catch (Exception e) {
                    android.util.Log.e(TAG, "Error firing event " + eventType + ": " + e.getMessage());
                }
            }
        }
    }
    
    /**
     * Schedule a one-time event
     */
    public void scheduleEvent(ScheduledCallback callback, long delayMs) {
        Runnable runnable = new Runnable() {
            @Override
            public void run() {
                try {
                    callback.execute();
                } catch (Exception e) {
                    android.util.Log.e(TAG, "Error executing scheduled event: " + e.getMessage());
                }
            }
        };
        
        ScheduledEvent event = new ScheduledEvent(runnable, delayMs, false);
        scheduledEvents.add(event);
        mainHandler.postDelayed(runnable, delayMs);
    }
    
    /**
     * Schedule a repeating event
     */
    public ScheduledEvent scheduleRepeatingEvent(ScheduledCallback callback, long delayMs, long intervalMs) {
        ScheduledEvent event = new ScheduledEvent(null, delayMs, true);
        scheduledEvents.add(event);
        
        Runnable runnable = new Runnable() {
            @Override
            public void run() {
                if (event.isCancelled) return;
                
                try {
                    callback.execute();
                } catch (Exception e) {
                    android.util.Log.e(TAG, "Error executing repeating event: " + e.getMessage());
                }
                
                if (!event.isCancelled) {
                    mainHandler.postDelayed(this, intervalMs);
                }
            }
        };
        
        event.runnable = runnable;
        mainHandler.postDelayed(runnable, delayMs);
        return event;
    }
    
    /**
     * Cancel a scheduled event
     */
    public void cancelEvent(ScheduledEvent event) {
        if (event != null) {
            event.isCancelled = true;
            if (event.runnable != null) {
                mainHandler.removeCallbacks(event.runnable);
            }
            scheduledEvents.remove(event);
        }
    }
    
    /**
     * Cancel all scheduled events
     */
    public void cancelAllEvents() {
        for (ScheduledEvent event : scheduledEvents) {
            event.isCancelled = true;
            if (event.runnable != null) {
                mainHandler.removeCallbacks(event.runnable);
            }
        }
        scheduledEvents.clear();
    }
    
    /**
     * Common game events
     */
    public static class GameEvents {
        public static final String GAME_STARTED = "game_started";
        public static final String GAME_PAUSED = "game_paused";
        public static final String GAME_RESUMED = "game_resumed";
        public static final String GAME_COMPLETED = "game_completed";
        public static final String LETTER_SELECTED = "letter_selected";
        public static final String PLANET_HIT = "planet_hit";
        public static final String ASTEROID_HIT = "asteroid_hit";
        public static final String WORD_COMPLETED = "word_completed";
        public static final String SETTINGS_CHANGED = "settings_changed";
        public static final String SCREEN_CHANGED = "screen_changed";
    }
    
    /**
     * Cleanup all resources
     */
    public void cleanup() {
        cancelAllEvents();
        eventListeners.clear();
        mainHandler.removeCallbacksAndMessages(null);
    }
}
