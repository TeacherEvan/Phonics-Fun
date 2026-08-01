import { describe, it, expect, vi, beforeEach } from 'vitest';

import '../../js/event-manager.js';

describe('EventManager', () => {
  let eventManager;

  beforeEach(() => {
    eventManager = new window.EventManager();
  });

  describe('subscription', () => {
    it('should subscribe to an event', () => {
      const callback = vi.fn();
      const id = eventManager.subscribe('test-event', callback);
      
      expect(id).toBeDefined();
      expect(typeof id).toBe('string');
    });

    it('should store callback with default priority', () => {
      const callback = vi.fn();
      eventManager.subscribe('test-event', callback);
      
      // Emit the event
      eventManager.emit('test-event', { data: 'test' });
      
      expect(callback).toHaveBeenCalledWith({ data: 'test' });
    });

    it('should support priority ordering', () => {
      const lowPriority = vi.fn();
      const highPriority = vi.fn();
      
      eventManager.subscribe('test-event', lowPriority, { priority: 0 });
      eventManager.subscribe('test-event', highPriority, { priority: 10 });
      
      eventManager.emit('test-event');
      
      // High priority should be called first
      expect(highPriority).toHaveBeenCalledBefore(lowPriority);
    });

    it('should support once option', () => {
      const callback = vi.fn();
      eventManager.subscribe('test-event', callback, { once: true });
      
      eventManager.emit('test-event');
      eventManager.emit('test-event');
      
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should unsubscribe by id', () => {
      const callback = vi.fn();
      const id = eventManager.subscribe('test-event', callback);
      
      eventManager.unsubscribe('test-event', id);
      eventManager.emit('test-event');
      
      expect(callback).not.toHaveBeenCalled();
    });

    it('should return false when unsubscribing non-existent id', () => {
      const result = eventManager.unsubscribe('test-event', 'invalid-id');
      expect(result).toBe(false);
    });

    it('should return false for non-existent event', () => {
      const result = eventManager.unsubscribe('non-existent', 'some-id');
      expect(result).toBe(false);
    });
  });

  describe('emit', () => {
    it('should call all subscribers', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      
      eventManager.subscribe('test-event', callback1);
      eventManager.subscribe('test-event', callback2);
      
      eventManager.emit('test-event', { test: 'data' });
      
      expect(callback1).toHaveBeenCalledWith({ test: 'data' });
      expect(callback2).toHaveBeenCalledWith({ test: 'data' });
    });

    it('should not throw when event has no subscribers', () => {
      expect(() => eventManager.emit('non-existent')).not.toThrow();
    });

    it('should pass data to subscribers', () => {
      const callback = vi.fn();
      eventManager.subscribe('test-event', callback);
      
      eventManager.emit('test-event', { key: 'value', number: 42 });
      
      expect(callback).toHaveBeenCalledWith({ key: 'value', number: 42 });
    });

    it('should handle errors in callbacks gracefully', () => {
      const errorCallback = vi.fn(() => {
        throw new Error('Callback error');
      });
      const normalCallback = vi.fn();
      
      eventManager.subscribe('test-event', errorCallback);
      eventManager.subscribe('test-event', normalCallback);
      
      expect(() => eventManager.emit('test-event')).not.toThrow();
      expect(normalCallback).toHaveBeenCalled();
    });
  });

  describe('queueEvent', () => {
    it('should queue events for sequential processing', async () => {
      const results = [];
      const callback = vi.fn((data) => results.push(data));
      
      eventManager.subscribe('queued-event', callback);
      eventManager.queueEvent('queued-event', { step: 1 });
      eventManager.queueEvent('queued-event', { step: 2 });
      eventManager.queueEvent('queued-event', { step: 3 });
      
      // Wait for queue processing
      await new Promise(resolve => setTimeout(resolve, 50));
      
      expect(results).toHaveLength(3);
      expect(results).toEqual([{ step: 1 }, { step: 2 }, { step: 3 }]);
    });
  });

  describe('utility methods', () => {
    it('should generate unique ids', () => {
      const id1 = eventManager.generateId();
      const id2 = eventManager.generateId();
      
      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe('string');
      expect(id1.length).toBeGreaterThan(10);
    });

    it('should check for subscribers', () => {
      expect(eventManager.hasSubscribers('test-event')).toBe(false);
      
      eventManager.subscribe('test-event', vi.fn());
      
      expect(eventManager.hasSubscribers('test-event')).toBe(true);
    });

    it('should clear specific event', () => {
      eventManager.subscribe('test-event', vi.fn());
      eventManager.clear('test-event');
      
      expect(eventManager.hasSubscribers('test-event')).toBe(false);
    });

    it('should clear all events', () => {
      eventManager.subscribe('event1', vi.fn());
      eventManager.subscribe('event2', vi.fn());
      
      eventManager.clearAll();
      
      expect(eventManager.hasSubscribers('event1')).toBe(false);
      expect(eventManager.hasSubscribers('event2')).toBe(false);
    });
  });

  describe('subscribeOnce', () => {
    it('should unsubscribe after first call', () => {
      const callback = vi.fn();
      eventManager.subscribeOnce('test-event', callback);
      
      eventManager.emit('test-event');
      eventManager.emit('test-event');
      
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should support priority with once', () => {
      const callback = vi.fn();
      eventManager.subscribeOnce('test-event', callback, { priority: 5 });
      
      eventManager.emit('test-event');
      
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });
});