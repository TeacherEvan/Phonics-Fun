package com.phonicsfun.core;

import static org.junit.Assert.assertEquals;
import org.junit.Test;

/**
 * Unit tests for AudioManager.
 * Uses plain JUnit 4 and pure-JVM assertions.
 */
public class AudioManagerTest {

    @Test
    public void testNormalizeTemplateId() {
        // Test hyphen to underscore conversion
        assertEquals("british_female", normalizeTemplateId("british-female"));
        assertEquals("american_male", normalizeTemplateId("american-male"));
        assertEquals("british_male", normalizeTemplateId("british-male"));
        assertEquals("american_female", normalizeTemplateId("american-female"));

        // Test already normalized (no change)
        assertEquals("british_female", normalizeTemplateId("british_female"));
        assertEquals("american_male", normalizeTemplateId("american_male"));

        // Test case insensitivity
        assertEquals("british_female", normalizeTemplateId("BRITISH-FEMALE"));
        assertEquals("american_male", normalizeTemplateId("American-Male"));

        // Test null/empty returns DEFAULT_VOICE_TEMPLATE
        assertEquals("british_female", normalizeTemplateId(null));
        assertEquals("british_female", normalizeTemplateId(""));
        assertEquals("british_female", normalizeTemplateId("   "));
    }

    // We need to use reflection to test private method
    private String normalizeTemplateId(String templateId) {
        try {
            java.lang.reflect.Method method = AudioManager.class.getDeclaredMethod("normalizeTemplateId", String.class);
            method.setAccessible(true);
            // We need an instance, but the method doesn't use instance state except DEFAULT_VOICE_TEMPLATE
            // Create a mock context or use null context - but AudioManager requires Context in constructor
            // Since the method only uses DEFAULT_VOICE_TEMPLATE constant, we can invoke it on null
            return (String) method.invoke(null, templateId);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
