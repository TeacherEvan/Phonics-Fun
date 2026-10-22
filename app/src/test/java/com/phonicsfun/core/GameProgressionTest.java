package com.phonicsfun.core;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;

import org.junit.Test;

/**
 * Unit tests for the pure progression rules.
 *
 * These rules used to live inline in GameState, which requires an Android
 * Context and therefore could not be covered by a JVM unit test at all.
 */
public class GameProgressionTest {

    @Test
    public void correctAnswersIncrementTheHitCounter() {
        GameProgression progression = new GameProgression();
        progression.setHitsTarget(5);

        assertFalse(progression.recordAnswer(true));
        assertFalse(progression.recordAnswer(true));
        assertEquals(2, progression.getCorrectHits());
        assertEquals(2, progression.getTotalAnswersCount());
    }

    @Test
    public void incorrectAnswersCountTowardsAttemptsButNotHits() {
        GameProgression progression = new GameProgression();
        progression.setHitsTarget(5);

        progression.recordAnswer(false);

        assertEquals(0, progression.getCorrectHits());
        assertEquals(1, progression.getTotalAnswersCount());
        assertEquals(0, progression.getCorrectAnswersCount());
    }

    @Test
    public void theLevelCompletesExactlyAtTheTarget() {
        GameProgression progression = new GameProgression();
        progression.setHitsTarget(3);

        assertFalse(progression.recordAnswer(true));
        assertFalse(progression.recordAnswer(true));
        assertTrue("the third correct hit completes the level", progression.recordAnswer(true));
    }

    @Test
    public void anIncorrectAnswerNeverCompletesTheLevel() {
        GameProgression progression = new GameProgression();
        progression.setHitsTarget(1);

        assertFalse(progression.recordAnswer(false));
        assertFalse(progression.recordAnswer(false));
    }

    @Test
    public void accuracyAtTheHighThresholdRaisesTheDifficulty() {
        GameProgression progression = new GameProgression();

        // 17 of 20 correct == 0.85 exactly, which is the inclusive boundary.
        for (int i = 0; i < 17; i++) {
            progression.recordAnswer(true);
        }
        for (int i = 0; i < 3; i++) {
            progression.recordAnswer(false);
        }

        assertEquals(0.85f, progression.getTotalAnswersCount() == 20
                ? (float) progression.getCorrectAnswersCount() / progression.getTotalAnswersCount()
                : 0f, 0.0001f);
        assertEquals(GameProgression.SPEED_HIGH, progression.getDifficultySpeedMultiplier(), 0.0001f);
        assertEquals(GameProgression.DISTRACTORS_HIGH, progression.getDifficultyPlanetCount());
    }

    @Test
    public void accuracyBelowTheHighThresholdKeepsTheNormalDifficulty() {
        GameProgression progression = new GameProgression();

        // 16 of 20 == 0.8, which is between the two thresholds.
        for (int i = 0; i < 16; i++) {
            progression.recordAnswer(true);
        }
        for (int i = 0; i < 4; i++) {
            progression.recordAnswer(false);
        }

        assertEquals(GameProgression.SPEED_NORMAL, progression.getDifficultySpeedMultiplier(), 0.0001f);
        assertEquals(GameProgression.DISTRACTORS_NORMAL, progression.getDifficultyPlanetCount());
    }

    @Test
    public void accuracyAtTheLowThresholdLowersTheDifficulty() {
        GameProgression progression = new GameProgression();

        // 12 of 20 == 0.6 exactly, which is the inclusive boundary.
        for (int i = 0; i < 12; i++) {
            progression.recordAnswer(true);
        }
        for (int i = 0; i < 8; i++) {
            progression.recordAnswer(false);
        }

        assertEquals(GameProgression.SPEED_LOW, progression.getDifficultySpeedMultiplier(), 0.0001f);
        assertEquals(GameProgression.DISTRACTORS_LOW, progression.getDifficultyPlanetCount());
    }

    @Test
    public void noAnswersMeansNormalDifficultyAndNoDivisionByZero() {
        GameProgression progression = new GameProgression();

        progression.updateAdaptiveDifficulty();

        assertEquals(GameProgression.SPEED_NORMAL, progression.getDifficultySpeedMultiplier(), 0.0001f);
    }

    @Test
    public void resetClearsTheDifficultyCounters() {
        GameProgression progression = new GameProgression();
        for (int i = 0; i < 10; i++) {
            progression.recordAnswer(true);
        }
        assertEquals(GameProgression.SPEED_HIGH, progression.getDifficultySpeedMultiplier(), 0.0001f);

        progression.reset();

        assertEquals(0, progression.getCorrectHits());
        assertEquals(0, progression.getTotalAnswersCount());
        assertEquals(GameProgression.SPEED_NORMAL, progression.getDifficultySpeedMultiplier(), 0.0001f);
    }

    @Test
    public void aLetterIsOnlyMarkedCompletedOnce() {
        GameProgression progression = new GameProgression();

        assertTrue(progression.markLetterCompleted("A"));
        assertFalse(progression.markLetterCompleted("A"));
        assertEquals(1, progression.getCompletedLetters().size());
    }

    @Test
    public void theNextUncompletedLetterIsFoundInAlphabeticalOrder() {
        GameProgression progression = new GameProgression();

        assertEquals("A", progression.getNextUncompletedLetter());

        progression.markLetterCompleted("A");
        assertEquals("B", progression.getNextUncompletedLetter());

        progression.markLetterCompleted("B");
        assertEquals("C", progression.getNextUncompletedLetter());
    }

    @Test
    public void everyCompletedLetterYieldsNoNextLetter() {
        GameProgression progression = new GameProgression();
        for (char letter = 'A'; letter <= 'Z'; letter++) {
            progression.markLetterCompleted(String.valueOf(letter));
        }

        assertNull(progression.getNextUncompletedLetter());
    }
}
