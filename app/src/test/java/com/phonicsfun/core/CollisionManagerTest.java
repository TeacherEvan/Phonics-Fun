package com.phonicsfun.core;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;

import android.graphics.RectF;

import org.junit.Test;

/**
 * Unit tests for the Android collision manager.
 *
 * The cleanup path in particular: it used Collection.removeIf, a Java 8
 * default method that Android only provides from API 24 while this module
 * declares minSdk 21.
 */
public class CollisionManagerTest {

    @Test
    public void cleanupInactiveObjectsRemovesOnlyTheInactiveOnes() {
        CollisionManager manager = new CollisionManager();

        CollisionManager.CollisionObject active = new CollisionManager.CollisionObject(
                "planet-1", "planet", new RectF(0, 0, 10, 10));
        CollisionManager.CollisionObject inactive = new CollisionManager.CollisionObject(
                "planet-2", "planet", new RectF(20, 20, 30, 30));
        inactive.isActive = false;

        manager.registerObject(active);
        manager.registerObject(inactive);
        assertEquals(2, manager.getAllActiveObjects().size() + 1);

        manager.cleanupInactiveObjects();

        assertNotNull(manager.getObjectById("planet-1"));
        assertNull(manager.getObjectById("planet-2"));
    }

    @Test
    public void cleanupInactiveObjectsOnAnEmptyManagerDoesNothing() {
        CollisionManager manager = new CollisionManager();

        manager.cleanupInactiveObjects();

        assertEquals(0, manager.getAllActiveObjects().size());
    }

    @Test
    public void getObjectCountByTypeOnlyCountsActiveObjects() {
        CollisionManager manager = new CollisionManager();

        CollisionManager.CollisionObject planet = new CollisionManager.CollisionObject(
                "planet-1", "planet", new RectF(0, 0, 10, 10));
        CollisionManager.CollisionObject hidden = new CollisionManager.CollisionObject(
                "planet-2", "planet", new RectF(0, 0, 10, 10));
        hidden.isActive = false;

        manager.registerObject(planet);
        manager.registerObject(hidden);

        assertEquals(1, manager.getObjectCount("planet"));
    }
}
