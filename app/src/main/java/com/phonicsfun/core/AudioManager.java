package com.phonicsfun.core;

import android.content.Context;
import android.media.AudioAttributes;
import android.media.MediaPlayer;
import android.media.SoundPool;
import android.util.Log;
import java.util.HashMap;
import java.util.Map;

/**
 * AudioManager - Handles all audio playback for the Phonics Fun game
 * Supports background music, sound effects, and voice audio
 * Android/Java implementation with SoundPool for low-latency effects
 */
public class AudioManager {
    private static final String TAG = "PhonicsAudioManager";
    private static final String DEFAULT_VOICE_TEMPLATE = "british_female";
    
    private Context context;
    private SoundPool soundPool;
    private MediaPlayer backgroundMusicPlayer;
    private Map<String, Integer> soundMap;
    private Map<String, Integer> voiceMap;
    
    private boolean isMuted = false;
    private float musicVolume = 0.5f;
    private float effectsVolume = 0.7f;
    private float voiceVolume = 0.8f;
    private String currentVoiceTemplate = DEFAULT_VOICE_TEMPLATE;
    
    // Audio priorities
    private boolean highPriorityEnabled = true;
    private boolean mediumPriorityEnabled = true;
    private boolean lowPriorityEnabled = true;
    
    public AudioManager(Context context) {
        this.context = context.getApplicationContext();
        initializeSoundPool();
        initializeAudioMaps();
        loadDefaultSounds();
    }
    
    private void initializeSoundPool() {
        AudioAttributes audioAttributes = new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_GAME)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .build();
                
        soundPool = new SoundPool.Builder()
                .setMaxStreams(10)
                .setAudioAttributes(audioAttributes)
                .build();
    }
    
    private void initializeAudioMaps() {
        soundMap = new HashMap<>();
        voiceMap = new HashMap<>();
    }
    
    private void loadDefaultSounds() {
        Log.d(TAG, "Loading default sound effects...");
        
        // Load sound effects
        try {
            soundMap.put("celebration", soundPool.load(context, getResId("celebration", "raw"), 1));
            soundMap.put("explosion", soundPool.load(context, getResId("explosion", "raw"), 1));
            soundMap.put("phoneme_g", soundPool.load(context, getResId("phoneme_g", "raw"), 1));
            
            Log.d(TAG, "Default sounds loaded successfully");
        } catch (Exception e) {
            Log.e(TAG, "Error loading default sounds: " + e.getMessage());
        }
        
        // Initialize background music
        initializeBackgroundMusic();
    }
    
    private void initializeBackgroundMusic() {
        try {
            backgroundMusicPlayer = MediaPlayer.create(context, getResId("background_music", "raw"));
            if (backgroundMusicPlayer != null) {
                backgroundMusicPlayer.setLooping(true);
                backgroundMusicPlayer.setVolume(musicVolume, musicVolume);
                Log.d(TAG, "Background music initialized");
            }
        } catch (Exception e) {
            Log.e(TAG, "Error initializing background music: " + e.getMessage());
        }
    }
    
    public void loadLetterAssets(String letter) {
        Log.d(TAG, "Loading audio assets for letter: " + letter);
        
        // Load voice assets for the letter (only animate characters)
        String[] words = getAnimateWordsForLetter(letter);
        for (String word : words) {
            String voiceKey = "voice_" + word;
            try {
                loadVoiceVariant(voiceKey, "american_male");
                loadVoiceVariant(voiceKey, "american_female");
                loadVoiceVariant(voiceKey, "british_male");
                loadVoiceVariant(voiceKey, "british_female");
                
                Log.d(TAG, "Loaded voice assets for word: " + word);
            } catch (Exception e) {
                Log.w(TAG, "Could not load voice asset for word: " + word + " - " + e.getMessage());
            }
        }
    }

    private void loadVoiceVariant(String voiceKey, String template) {
        int resId = getVoiceResId(voiceKey, template);
        if (resId != 0) {
            voiceMap.put(voiceKey + "_" + template, soundPool.load(context, resId, 1));
        } else {
            Log.w(TAG, "Missing voice resource for " + voiceKey + " / " + template);
        }
    }

    private int getVoiceResId(String voiceKey, String template) {
        int resId = getResId(voiceKey + "_" + template, "raw");
        if (resId != 0) return resId;

        resId = getResId(template + "_" + voiceKey, "raw");
        if (resId != 0) return resId;

        return getResId(voiceKey, "raw");
    }
    
    private String[] getWordsForLetter(String letter) {
        switch (letter.toUpperCase()) {
            case "G":
                return new String[]{"grape", "goat", "gold", "girl", "grandpa"};
            case "A":
                return new String[]{"apple", "ant"};
            case "B":
                return new String[]{"ball", "bat"};
            default:
                return new String[]{};
        }
    }
    
    private String[] getAnimateWordsForLetter(String letter) {
        // Load every in-game word so pronunciation is available for gameplay and previews
        switch (letter.toUpperCase()) {
            case "G":
                return new String[]{"grape", "goat", "gold", "girl", "grandpa"};
            case "A":
                return new String[]{"apple", "ant"};
            case "B":
                return new String[]{"ball", "bat"};
            default:
                return new String[]{};
        }
    }
    
    public void playEffect(String soundKey) {
        if (isMuted || !mediumPriorityEnabled) return;
        
        Integer soundId = soundMap.get(soundKey);
        if (soundId != null) {
            soundPool.play(soundId, effectsVolume, effectsVolume, 1, 0, 1.0f);
            Log.d(TAG, "Playing effect: " + soundKey);
        } else {
            Log.w(TAG, "Sound effect not found: " + soundKey);
        }
    }
    
    public void playVoice(String voiceKey, String voiceTemplate) {
        if (isMuted || !highPriorityEnabled) return;
        
        String normalizedVoiceKey = voiceKey.startsWith("voice_") ? voiceKey : "voice_" + voiceKey;
        String normalizedTemplate = (voiceTemplate == null || voiceTemplate.trim().isEmpty())
                ? currentVoiceTemplate
                : normalizeTemplateId(voiceTemplate);
        String fullVoiceKey = normalizedVoiceKey + "_" + normalizedTemplate;
        Integer soundId = voiceMap.get(fullVoiceKey);
        
        if (soundId != null) {
            soundPool.play(soundId, voiceVolume, voiceVolume, 1, 0, 1.0f);
            Log.d(TAG, "Playing voice: " + fullVoiceKey);
        } else {
            Log.w(TAG, "Voice not found: " + fullVoiceKey);
        }
    }

    public void playVoice(String voiceKey) {
        playVoice(voiceKey, currentVoiceTemplate);
    }

    public void setVoiceTemplate(String voiceTemplate) {
        if (voiceTemplate == null || voiceTemplate.trim().isEmpty()) return;
        this.currentVoiceTemplate = normalizeTemplateId(voiceTemplate);
        Log.d(TAG, "Voice template set to: " + currentVoiceTemplate);
    }

    public String getVoiceTemplate() {
        return currentVoiceTemplate;
    }

    public void setVolume(float volume) {
        setMusicVolume(volume);
        setEffectsVolume(volume);
        setVoiceVolume(volume);
    }

    public void stopBackgroundMusic() {
        stopMusic();
    }

    public void release() {
        cleanup();
    }
    
    public void playBackgroundMusic() {
        if (isMuted || !lowPriorityEnabled || backgroundMusicPlayer == null) return;
        
        try {
            if (!backgroundMusicPlayer.isPlaying()) {
                backgroundMusicPlayer.start();
                Log.d(TAG, "Background music started");
            }
        } catch (Exception e) {
            Log.e(TAG, "Error playing background music: " + e.getMessage());
        }
    }
    
    public void pauseMusic() {
        if (backgroundMusicPlayer != null && backgroundMusicPlayer.isPlaying()) {
            backgroundMusicPlayer.pause();
            Log.d(TAG, "Background music paused");
        }
    }
    
    public void resumeMusic() {
        if (backgroundMusicPlayer != null && !backgroundMusicPlayer.isPlaying()) {
            backgroundMusicPlayer.start();
            Log.d(TAG, "Background music resumed");
        }
    }
    
    public void stopMusic() {
        if (backgroundMusicPlayer != null && backgroundMusicPlayer.isPlaying()) {
            backgroundMusicPlayer.stop();
            Log.d(TAG, "Background music stopped");
        }
    }
    
    public void setMuted(boolean muted) {
        this.isMuted = muted;
        if (muted) {
            pauseMusic();
        } else if (lowPriorityEnabled) {
            resumeMusic();
        }
        Log.d(TAG, "Audio muted: " + muted);
    }
    
    public void setMusicVolume(float volume) {
        this.musicVolume = Math.max(0.0f, Math.min(1.0f, volume));
        if (backgroundMusicPlayer != null) {
            backgroundMusicPlayer.setVolume(musicVolume, musicVolume);
        }
        Log.d(TAG, "Music volume set to: " + musicVolume);
    }
    
    public void setEffectsVolume(float volume) {
        this.effectsVolume = Math.max(0.0f, Math.min(1.0f, volume));
        Log.d(TAG, "Effects volume set to: " + effectsVolume);
    }
    
    public void setVoiceVolume(float volume) {
        this.voiceVolume = Math.max(0.0f, Math.min(1.0f, volume));
        Log.d(TAG, "Voice volume set to: " + voiceVolume);
    }
    
    public void setAudioPriority(String priority, boolean enabled) {
        switch (priority.toLowerCase()) {
            case "high":
                highPriorityEnabled = enabled;
                break;
            case "medium":
                mediumPriorityEnabled = enabled;
                break;
            case "low":
                lowPriorityEnabled = enabled;
                if (!enabled) {
                    stopMusic();
                } else if (!isMuted) {
                    playBackgroundMusic();
                }
                break;
        }
        Log.d(TAG, "Audio priority " + priority + " set to: " + enabled);
    }
    
    public void cleanup() {
        Log.d(TAG, "Cleaning up audio resources...");
        
        if (soundPool != null) {
            soundPool.release();
            soundPool = null;
        }
        
        if (backgroundMusicPlayer != null) {
            backgroundMusicPlayer.release();
            backgroundMusicPlayer = null;
        }
        
        soundMap.clear();
        voiceMap.clear();
    }
    
    private int getResId(String resName, String resType) {
        return context.getResources().getIdentifier(resName, resType, context.getPackageName());
    }

    private String normalizeTemplateId(String templateId) {
        return templateId.toLowerCase().replace('-', '_');
    }
    
    // Getters
    public boolean isMuted() { return isMuted; }
    public float getMusicVolume() { return musicVolume; }
    public float getEffectsVolume() { return effectsVolume; }
    public float getVoiceVolume() { return voiceVolume; }
    public boolean isHighPriorityEnabled() { return highPriorityEnabled; }
    public boolean isMediumPriorityEnabled() { return mediumPriorityEnabled; }
    public boolean isLowPriorityEnabled() { return lowPriorityEnabled; }
}
