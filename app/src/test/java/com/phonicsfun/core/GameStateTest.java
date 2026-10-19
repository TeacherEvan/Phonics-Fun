package com.phonicsfun.core;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.assertFalse;
import org.junit.Test;
import android.graphics.RectF;

/**
 * Unit tests for core Phonics Fun Android invariants.
 * Uses plain JUnit 4 and pure-JVM assertions.
 */
public class GameStateTest {

    @Test
    public void testCollisionObjectIntersects_doesNotMutateBounds() {
        RectF r1 = new RectF();
        r1.left = 0f;
        r1.top = 0f;
        r1.right = 10f;
        r1.bottom = 10f;

        RectF r2 = new RectF();
        r2.left = 5f;
        r2.top = 5f;
        r2.right = 15f;
        r2.bottom = 15f;

        CollisionManager.CollisionObject obj1 = new CollisionManager.CollisionObject("obj1", "asteroid", r1);
        CollisionManager.CollisionObject obj2 = new CollisionManager.CollisionObject("obj2", "planet", r2);

        boolean collides = obj1.intersects(obj2);
        assertTrue("Overlapping objects should intersect", collides);

        // Verify that obj1.bounds was NOT mutated in-place to the intersection sliver [5, 5, 10, 10]
        assertEquals("Width must remain 10", 10.0f, obj1.bounds.right - obj1.bounds.left, 0.001f);
        assertEquals("Height must remain 10", 10.0f, obj1.bounds.bottom - obj1.bounds.top, 0.001f);
        assertEquals("Left must remain 0", 0.0f, obj1.bounds.left, 0.001f);
        assertEquals("Top must remain 0", 0.0f, obj1.bounds.top, 0.001f);
        assertEquals("Right must remain 10", 10.0f, obj1.bounds.right, 0.001f);
        assertEquals("Bottom must remain 10", 10.0f, obj1.bounds.bottom, 0.001f);
    }

    @Test
    public void testCollisionObjectIntersects_nullSafe() {
        RectF r1 = new RectF(0, 0, 10, 10);
        CollisionManager.CollisionObject obj1 = new CollisionManager.CollisionObject("obj1", "asteroid", r1);
        assertFalse("Null other object should return false without throwing", obj1.intersects(null));
    }
}
