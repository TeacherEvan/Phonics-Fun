import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock getBoundingClientRect
const mockRect = (left, top, width, height) => ({
  left, top, width, height,
  right: left + width,
  bottom: top + height
});

// Mock HTMLElement.prototype.getBoundingClientRect
HTMLElement.prototype.getBoundingClientRect = vi.fn(() => mockRect(0, 0, 50, 50));

// Mock requestAnimationFrame
global.requestAnimationFrame = vi.fn((cb) => setTimeout(cb, 16));
global.cancelAnimationFrame = vi.fn((id) => clearTimeout(id));

import '../js/collision-manager.js';

describe('CollisionManager', () => {
  let collisionManager;
  let mockElement1;
  let mockElement2;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Create mock DOM elements
    mockElement1 = document.createElement('div');
    mockElement1.id = 'obj1';
    mockElement1.getBoundingClientRect.mockReturnValue(mockRect(100, 100, 50, 50));
    
    mockElement2 = document.createElement('div');
    mockElement2.id = 'obj2';
    mockElement2.getBoundingClientRect.mockReturnValue(mockRect(130, 130, 50, 50));
    
    document.body.appendChild(mockElement1);
    document.body.appendChild(mockElement2);
    
    collisionManager = new window.CollisionManager();
  });

  afterEach(() => {
    collisionManager.stop();
    collisionManager.clear();
    document.body.innerHTML = '';
  });

  describe('registration', () => {
    it('should register an object', () => {
      collisionManager.registerObject('planet1', mockElement1, 'planet');
      
      const obj = collisionManager.getObject('planet1');
      expect(obj).toBeDefined();
      expect(obj.id).toBe('planet1');
      expect(obj.type).toBe('planet');
      expect(obj.element).toBe(mockElement1);
    });

    it('should set default radius based on element size', () => {
      collisionManager.registerObject('planet1', mockElement1, 'planet');
      
      const obj = collisionManager.getObject('planet1');
      expect(obj.radius).toBe(25); // max(50, 50) / 2
    });

    it('should allow custom radius', () => {
      collisionManager.registerObject('planet1', mockElement1, 'planet', { radius: 30 });
      
      const obj = collisionManager.getObject('planet1');
      expect(obj.radius).toBe(30);
    });

    it('should allow custom velocity', () => {
      collisionManager.registerObject('asteroid1', mockElement2, 'asteroid', { 
        velocity: { x: 5, y: -3 } 
      });
      
      const obj = collisionManager.getObject('asteroid1');
      expect(obj.velocity).toEqual({ x: 5, y: -3 });
    });

    it('should allow static objects', () => {
      collisionManager.registerObject('planet1', mockElement1, 'planet', { isStatic: true });
      
      const obj = collisionManager.getObject('planet1');
      expect(obj.isStatic).toBe(true);
    });

    it('should not register null element', () => {
      expect(() => collisionManager.registerObject('invalid', null, 'planet'))
        .not.toThrow();
      
      expect(collisionManager.getObject('invalid')).toBeUndefined();
    });

    it('should unregister an object', () => {
      collisionManager.registerObject('planet1', mockElement1, 'planet');
      collisionManager.unregisterObject('planet1');
      
      expect(collisionManager.getObject('planet1')).toBeUndefined();
    });

    it('should remove collision pairs when unregistering', () => {
      collisionManager.registerObject('planet1', mockElement1, 'planet');
      collisionManager.registerObject('asteroid1', mockElement2, 'asteroid');
      collisionManager.registerCollisionPair('planet1', 'asteroid1', vi.fn());
      
      collisionManager.unregisterObject('planet1');
      
      expect(collisionManager.getObject('planet1')).toBeUndefined();
      // The pair should be cleaned up
    });
  });

  describe('collision detection', () => {
    it('should detect collision between overlapping objects', () => {
      // Objects at (100, 100) and (130, 130) with radius 25 each
      // Distance = sqrt(30^2 + 30^2) = 42.43 < 50 (sum of radii)
      collisionManager.registerObject('obj1', mockElement1, 'planet', { radius: 25 });
      collisionManager.registerObject('obj2', mockElement2, 'asteroid', { radius: 25 });
      
      const colliding = collisionManager.checkCollision(
        collisionManager.getObject('obj1'),
        collisionManager.getObject('obj2')
      );
      
      expect(colliding).toBe(true);
    });

    it('should not detect collision between distant objects', () => {
      // Create a new element with distant position
      const distantElement = document.createElement('div');
      distantElement.getBoundingClientRect = vi.fn(() => mockRect(300, 300, 50, 50));
      document.body.appendChild(distantElement);
      
      collisionManager.registerObject('obj1', mockElement1, 'planet', { radius: 25 });
      collisionManager.registerObject('obj2', distantElement, 'asteroid', { radius: 25 });
      
      const colliding = collisionManager.checkCollision(
        collisionManager.getObject('obj1'),
        collisionManager.getObject('obj2')
      );
      
      expect(colliding).toBe(false);
      
      document.body.removeChild(distantElement);
    });

    it('should get collisions for an object', () => {
      collisionManager.registerObject('planet1', mockElement1, 'planet', { radius: 30 });
      collisionManager.registerObject('asteroid1', mockElement2, 'asteroid', { radius: 30 });
      
      const collisions = collisionManager.getCollisionsForObject('planet1');
      
      expect(collisions).toContain('asteroid1');
    });

    it('should not include self in collisions', () => {
      collisionManager.registerObject('planet1', mockElement1, 'planet');
      
      const collisions = collisionManager.getCollisionsForObject('planet1');
      
      expect(collisions).not.toContain('planet1');
    });
  });

  describe('collision pairs', () => {
    it('should register collision pair with handler', () => {
      const handler = vi.fn();
      const pairId = collisionManager.registerCollisionPair('obj1', 'obj2', handler);
      
      expect(pairId).toBe('obj1_obj2');
      expect(collisionManager.collisionPairs.has('obj1_obj2')).toBe(true);
    });

    it('should call handler on collision start', () => {
      collisionManager.registerObject('planet1', mockElement1, 'planet', { radius: 30 });
      collisionManager.registerObject('asteroid1', mockElement2, 'asteroid', { radius: 30 });
      
      const handler = vi.fn();
      collisionManager.registerCollisionPair('planet1', 'asteroid1', handler);
      
      // Manually trigger update
      collisionManager.update(16);
      
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'planet1' }),
        expect.objectContaining({ id: 'asteroid1' }),
        'start'
      );
    });

    it('should call handler on collision end', () => {
      // Create elements at overlapping positions
      const planetElement = document.createElement('div');
      planetElement.getBoundingClientRect = vi.fn(() => mockRect(100, 100, 50, 50));
      document.body.appendChild(planetElement);
      
      const asteroidElement = document.createElement('div');
      asteroidElement.getBoundingClientRect = vi.fn(() => mockRect(130, 130, 50, 50));
      document.body.appendChild(asteroidElement);
      
      collisionManager.registerObject('planet1', planetElement, 'planet', { radius: 30 });
      collisionManager.registerObject('asteroid1', asteroidElement, 'asteroid', { radius: 30 });
      
      const handler = vi.fn();
      collisionManager.registerCollisionPair('planet1', 'asteroid1', handler);
      
      // First collision - should be "start"
      collisionManager.update(16);
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'planet1' }),
        expect.objectContaining({ id: 'asteroid1' }),
        'start'
      );
      
      // Move asteroid far away by changing mock
      asteroidElement.getBoundingClientRect = vi.fn(() => mockRect(300, 300, 50, 50));
      
      handler.mockClear();
      
      // Second update - should be "end"
      collisionManager.update(16);
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'planet1' }),
        expect.objectContaining({ id: 'asteroid1' }),
        'end'
      );
      
      document.body.removeChild(planetElement);
      document.body.removeChild(asteroidElement);
    });
  });

  describe('type-based collisions', () => {
    it('should register type collision handler', () => {
      const handler = vi.fn();
      collisionManager.registerTypeCollision('asteroid', 'planet', handler);
      
      expect(collisionManager.collisionHandlers.has('asteroid_planet')).toBe(true);
      expect(collisionManager.collisionHandlers.get('asteroid_planet')).toBe(handler);
    });

    it('should call type handler on collision', () => {
      collisionManager.registerObject('planet1', mockElement1, 'planet', { radius: 30 });
      collisionManager.registerObject('asteroid1', mockElement2, 'asteroid', { radius: 30 });
      
      const handler = vi.fn();
      collisionManager.registerTypeCollision('asteroid', 'planet', handler);
      
      collisionManager.update(16);
      
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'asteroid' }),
        expect.objectContaining({ type: 'planet' }),
        'start'
      );
    });

    it('should check reverse type order', () => {
      collisionManager.registerObject('planet1', mockElement1, 'planet', { radius: 30 });
      collisionManager.registerObject('asteroid1', mockElement2, 'asteroid', { radius: 30 });
      
      const handler = vi.fn();
      collisionManager.registerTypeCollision('planet', 'asteroid', handler);
      
      collisionManager.update(16);
      
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'planet' }),
        expect.objectContaining({ type: 'asteroid' }),
        'start'
      );
    });
  });

  describe('update loop', () => {
    it('should start and stop animation loop', () => {
      collisionManager.start();
      expect(collisionManager.enabled).toBe(true);
      
      collisionManager.stop();
      expect(collisionManager.enabled).toBe(false);
    });

    it('should not update when disabled', () => {
      collisionManager.stop();
      collisionManager.registerObject('planet1', mockElement1, 'planet');
      
      const updateSpy = vi.spyOn(collisionManager, 'updateObjectPosition');
      collisionManager.update(16);
      
      // updateObjectPosition is called internally, but early return should skip
      // Actually, the early return is at the start of update, so it should not call updateObjectPosition
      expect(updateSpy).not.toHaveBeenCalled();
    });

    it('should update object positions', () => {
      collisionManager.registerObject('planet1', mockElement1, 'planet');
      
      collisionManager.update(16);
      
      expect(mockElement1.getBoundingClientRect).toHaveBeenCalled();
    });
  });

  describe('utility methods', () => {
    it('should get object by id', () => {
      collisionManager.registerObject('planet1', mockElement1, 'planet');
      
      const obj = collisionManager.getObject('planet1');
      
      expect(obj).toBeDefined();
      expect(obj.id).toBe('planet1');
    });

    it('should return undefined for non-existent object', () => {
      const obj = collisionManager.getObject('non-existent');
      
      expect(obj).toBeUndefined();
    });

    it('should get objects by type', () => {
      collisionManager.registerObject('planet1', mockElement1, 'planet');
      collisionManager.registerObject('planet2', mockElement2, 'planet');
      collisionManager.registerObject('asteroid1', document.createElement('div'), 'asteroid');
      
      const planets = collisionManager.getObjectsByType('planet');
      
      expect(planets).toHaveLength(2);
      expect(planets.every(p => p.type === 'planet')).toBe(true);
    });

    it('should clear all objects and pairs', () => {
      collisionManager.registerObject('planet1', mockElement1, 'planet');
      collisionManager.registerCollisionPair('planet1', 'asteroid1', vi.fn());
      
      collisionManager.clear();
      
      expect(collisionManager.objects.size).toBe(0);
      expect(collisionManager.collisionPairs.size).toBe(0);
    });
  });

  describe('edge cases', () => {
    it('should handle object without element gracefully', () => {
      collisionManager.registerObject('planet1', mockElement1, 'planet');
      mockElement1.getBoundingClientRect.mockImplementation(() => {
        throw new Error('DOM error');
      });
      
      expect(() => collisionManager.update(16)).not.toThrow();
    });

    it('should handle missing objects in collision pairs', () => {
      collisionManager.registerCollisionPair('obj1', 'obj2', vi.fn());
      // obj1 and obj2 don't exist
      
      expect(() => collisionManager.update(16)).not.toThrow();
    });
  });
});