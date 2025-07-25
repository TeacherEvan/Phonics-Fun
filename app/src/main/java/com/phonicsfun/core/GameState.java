package com.phonicsfun.core;

import android.content.Context;
import android.util.Log;
import java.util.ArrayList;
import java.util.List;

/**
 * Phonics Fun - Game State Management
 * Educational game for learning phonics - Android/Java Implementation
 * Converted from JavaScript to Java for Android platform priority
 */
public class GameState {
    private static final String TAG = "PhonicsGameState";
    
    public enum Screen {
        WELCOME, LEVEL_SELECT, GAMEPLAY, SETTINGS
    }
    
    public enum GameStatus {
        INACTIVE, ACTIVE, PAUSED, COMPLETED
    }
    
    private Screen currentScreen;
    private GameStatus gameStatus;
    private int correctHits;
    private int totalHits;
    private boolean planetsCreated;
    private List<String> allowedLetters;
    private List<WordMessage> wordMessages;
    private int currentWordIndex;
    private boolean isMuted;
    private float musicVolume;
    private float effectsVolume;
    private String currentLetter;
    
    // Game components
    private AudioManager audioManager;
    private EventManager eventManager;
    private CollisionManager collisionManager;
    private Context context;
    
    public GameState(Context context) {
        this.context = context;
        this.currentScreen = Screen.WELCOME;
        this.gameStatus = GameStatus.INACTIVE;
        this.correctHits = 0;
        this.totalHits = 5;
        this.planetsCreated = false;
        this.currentWordIndex = 0;
        this.isMuted = false;
        this.musicVolume = 0.5f;
        this.effectsVolume = 0.7f;
        this.currentLetter = "G";
        
        initializeData();
        initializeComponents();
    }
    
    private void initializeData() {
        // Initialize allowed letters
        allowedLetters = new ArrayList<>();
        allowedLetters.add("G");
        allowedLetters.add("A");
        allowedLetters.add("B");
        
        // Initialize word messages
        wordMessages = new ArrayList<>();
        wordMessages.add(new WordMessage("G", "grape", "voice_grape"));
        wordMessages.add(new WordMessage("G", "goat", "voice_goat"));
        wordMessages.add(new WordMessage("G", "gold", "voice_gold"));
        wordMessages.add(new WordMessage("G", "girl", "voice_girl"));
        wordMessages.add(new WordMessage("G", "grandpa", "voice_grandpa"));
        wordMessages.add(new WordMessage("A", "apple", "voice_apple"));
        wordMessages.add(new WordMessage("A", "ant", "voice_ant"));
        wordMessages.add(new WordMessage("B", "ball", "voice_ball"));
        wordMessages.add(new WordMessage("B", "bat", "voice_bat"));
    }
    
    private void initializeComponents() {
        Log.d(TAG, "Initializing Phonics Fun game components...");
        this.audioManager = new AudioManager(context);
        this.eventManager = new EventManager();
        this.collisionManager = new CollisionManager();
    }
    
    public void startGame(String letter) {
        Log.d(TAG, "Starting game with letter: " + letter);
        this.currentLetter = letter;
        this.correctHits = 0;
        this.currentWordIndex = 0;
        this.gameStatus = GameStatus.ACTIVE;
        this.currentScreen = Screen.GAMEPLAY;
        
        // Load assets for the selected letter
        audioManager.loadLetterAssets(letter);
        
        // Create planets for the letter
        createPlanetsForLetter(letter);
    }
    
    private void createPlanetsForLetter(String letter) {
        // Filter word messages for the current letter
        List<WordMessage> letterWords = new ArrayList<>();
        for (WordMessage word : wordMessages) {
            if (word.getLetter().equals(letter)) {
                letterWords.add(word);
            }
        }
        
        // Create planets based on the words
        planetsCreated = true;
        Log.d(TAG, "Created planets for letter " + letter + " with " + letterWords.size() + " words");
    }
    
    public void registerHit(boolean isCorrect) {
        if (gameStatus != GameStatus.ACTIVE) return;
        
        if (isCorrect) {
            correctHits++;
            Log.d(TAG, "Correct hit! Total: " + correctHits + "/" + totalHits);
            
            if (correctHits >= totalHits) {
                completeGame();
            }
        }
        
        // Play appropriate sound
        audioManager.playEffect(isCorrect ? "celebration" : "explosion");
    }
    
    private void completeGame() {
        Log.d(TAG, "Game completed successfully!");
        gameStatus = GameStatus.COMPLETED;
        audioManager.playEffect("celebration");
        
        // Return to level select after a delay
        eventManager.scheduleEvent(() -> {
            setCurrentScreen(Screen.LEVEL_SELECT);
            resetGame();
        }, 3000);
    }
    
    public void resetGame() {
        correctHits = 0;
        currentWordIndex = 0;
        gameStatus = GameStatus.INACTIVE;
        planetsCreated = false;
    }
    
    public void pauseGame() {
        if (gameStatus == GameStatus.ACTIVE) {
            gameStatus = GameStatus.PAUSED;
            audioManager.pauseMusic();
        }
    }
    
    public void resumeGame() {
        if (gameStatus == GameStatus.PAUSED) {
            gameStatus = GameStatus.ACTIVE;
            audioManager.resumeMusic();
        }
    }
    
    // Getters and setters
    public Screen getCurrentScreen() { return currentScreen; }
    public void setCurrentScreen(Screen screen) { this.currentScreen = screen; }
    
    public GameStatus getGameStatus() { return gameStatus; }
    public void setGameStatus(GameStatus status) { this.gameStatus = status; }
    
    public int getCorrectHits() { return correctHits; }
    public int getTotalHits() { return totalHits; }
    public float getProgress() { return (float) correctHits / totalHits; }
    
    public boolean isPlanetsCreated() { return planetsCreated; }
    public List<String> getAllowedLetters() { return allowedLetters; }
    public String getCurrentLetter() { return currentLetter; }
    
    public boolean isMuted() { return isMuted; }
    public void setMuted(boolean muted) { 
        this.isMuted = muted;
        audioManager.setMuted(muted);
    }
    
    public float getMusicVolume() { return musicVolume; }
    public void setMusicVolume(float volume) { 
        this.musicVolume = volume;
        audioManager.setMusicVolume(volume);
    }
    
    public float getEffectsVolume() { return effectsVolume; }
    public void setEffectsVolume(float volume) { 
        this.effectsVolume = volume;
        audioManager.setEffectsVolume(volume);
    }
    
    public AudioManager getAudioManager() { return audioManager; }
    public EventManager getEventManager() { return eventManager; }
    public CollisionManager getCollisionManager() { return collisionManager; }
    
    public List<WordMessage> getWordMessagesForLetter(String letter) {
        List<WordMessage> letterWords = new ArrayList<>();
        for (WordMessage word : wordMessages) {
            if (word.getLetter().equals(letter)) {
                letterWords.add(word);
            }
        }
        return letterWords;
    }
    
    public WordMessage getCurrentWordMessage() {
        List<WordMessage> letterWords = getWordMessagesForLetter(currentLetter);
        if (currentWordIndex < letterWords.size()) {
            return letterWords.get(currentWordIndex);
        }
        return null;
    }
    
    public void nextWord() {
        currentWordIndex++;
    }
    
    /**
     * Inner class to represent word messages
     */
    public static class WordMessage {
        private String letter;
        private String word;
        private String soundKey;
        
        public WordMessage(String letter, String word, String soundKey) {
            this.letter = letter;
            this.word = word;
            this.soundKey = soundKey;
        }
        
        public String getLetter() { return letter; }
        public String getWord() { return word; }
        public String getSoundKey() { return soundKey; }
    }
}
