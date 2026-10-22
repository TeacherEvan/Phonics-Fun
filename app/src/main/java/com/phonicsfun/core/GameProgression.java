package com.phonicsfun.core;

import java.util.ArrayList;
import java.util.List;

/**
 * GameProgression - pure progression state for the Phonics Fun game.
 *
 * Holds the hit counters, the adaptive difficulty and the completion
 * pointer. Deliberately free of any Android dependency: the logic used to
 * live inline in {@link GameState}, which needs a {@code Context} and
 * therefore could not be unit tested on the JVM at all. Keeping it here
 * makes the scoring and difficulty rules directly testable.
 */
public class GameProgression {

    /** Accuracy at or above which the difficulty is raised. */
    public static final float ACCURACY_HIGH = 0.85f;
    /** Accuracy at or below which the difficulty is lowered. */
    public static final float ACCURACY_LOW = 0.60f;

    public static final float SPEED_NORMAL = 1.0f;
    public static final float SPEED_HIGH = 1.25f;
    public static final float SPEED_LOW = 0.8f;

    public static final int DISTRACTORS_NORMAL = 3;
    public static final int DISTRACTORS_HIGH = 4;
    public static final int DISTRACTORS_LOW = 2;

    private int correctHits;
    private int hitsTarget = 5;
    private int correctAnswersCount;
    private int totalAnswersCount;

    private float difficultySpeedMultiplier = SPEED_NORMAL;
    private int difficultyPlanetCount = DISTRACTORS_NORMAL;

    private final List<String> completedLetters = new ArrayList<>();

    /**
     * Reset the per-letter state. Cumulative teacher statistics are held
     * elsewhere and are not affected.
     */
    public void reset() {
        correctHits = 0;
        correctAnswersCount = 0;
        totalAnswersCount = 0;
        difficultySpeedMultiplier = SPEED_NORMAL;
        difficultyPlanetCount = DISTRACTORS_NORMAL;
    }

    /**
     * Record an answer.
     *
     * @param isCorrect whether the answer was correct
     * @return true when this answer completed the level
     */
    public boolean recordAnswer(boolean isCorrect) {
        totalAnswersCount++;
        if (isCorrect) {
            correctAnswersCount++;
            correctHits++;
        }
        updateAdaptiveDifficulty();
        return isCorrect && correctHits >= hitsTarget;
    }

    /**
     * Recompute the adaptive difficulty from the current accuracy.
     *
     * The thresholds are inclusive: exactly 0.85 raises the difficulty and
     * exactly 0.60 lowers it.
     */
    public void updateAdaptiveDifficulty() {
        if (totalAnswersCount == 0) {
            difficultySpeedMultiplier = SPEED_NORMAL;
            difficultyPlanetCount = DISTRACTORS_NORMAL;
            return;
        }

        float accuracy = (float) correctAnswersCount / totalAnswersCount;
        if (accuracy >= ACCURACY_HIGH) {
            difficultySpeedMultiplier = SPEED_HIGH;
            difficultyPlanetCount = DISTRACTORS_HIGH;
        } else if (accuracy <= ACCURACY_LOW) {
            difficultySpeedMultiplier = SPEED_LOW;
            difficultyPlanetCount = DISTRACTORS_LOW;
        } else {
            difficultySpeedMultiplier = SPEED_NORMAL;
            difficultyPlanetCount = DISTRACTORS_NORMAL;
        }
    }

    /**
     * Mark a letter as completed, at most once.
     *
     * @param letter the completed letter
     * @return true when this call newly completed the letter
     */
    public boolean markLetterCompleted(String letter) {
        if (letter == null || completedLetters.contains(letter)) {
            return false;
        }
        completedLetters.add(letter);
        return true;
    }

    public int getCorrectHits() {
        return correctHits;
    }

    public int getHitsTarget() {
        return hitsTarget;
    }

    public void setHitsTarget(int hitsTarget) {
        this.hitsTarget = hitsTarget;
    }

    public int getCorrectAnswersCount() {
        return correctAnswersCount;
    }

    public int getTotalAnswersCount() {
        return totalAnswersCount;
    }

    public float getDifficultySpeedMultiplier() {
        return difficultySpeedMultiplier;
    }

    public int getDifficultyPlanetCount() {
        return difficultyPlanetCount;
    }

    public List<String> getCompletedLetters() {
        return completedLetters;
    }

    /**
     * The first letter of the alphabet that has not been completed yet.
     *
     * @return the next letter, or null when every letter is complete
     */
    public String getNextUncompletedLetter() {
        for (char letter = 'A'; letter <= 'Z'; letter++) {
            String name = String.valueOf(letter);
            if (!completedLetters.contains(name)) {
                return name;
            }
        }
        return null;
    }
}
