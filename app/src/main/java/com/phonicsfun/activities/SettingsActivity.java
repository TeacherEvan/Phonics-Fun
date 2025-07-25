package com.phonicsfun.activities;

import android.app.Activity;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.view.View;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.RadioButton;
import android.widget.RadioGroup;
import android.widget.SeekBar;
import android.widget.Spinner;
import android.widget.Switch;
import android.widget.TextView;

import com.phonicsfun.R;
import com.phonicsfun.core.AudioManager;

/**
 * SettingsActivity - Game settings and preferences
 */
public class SettingsActivity extends Activity {
    private static final String TAG = "SettingsActivity";
    private static final String PREFS_NAME = "PhonicsGamePrefs";
    
    private AudioManager audioManager;
    private SharedPreferences sharedPreferences;
    
    // UI Components
    private Button backButton;
    private Spinner voiceTemplateSpinner;
    private Button voicePreviewButton;
    private SeekBar audioVolumeSeekBar;
    private TextView audioVolumeValue;
    private Switch backgroundMusicSwitch;
    private RadioGroup gameSpeedGroup;
    private Spinner difficultySpinner;
    private Button resetProgressButton;
    private TextView appVersionText;
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_settings);
        
        // Initialize components
        audioManager = new AudioManager(this);
        sharedPreferences = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        
        // Initialize UI
        initializeUI();
        
        // Set up click listeners
        setupClickListeners();
        
        // Load current settings
        loadSettings();
    }
    
    /**
     * Initialize UI components
     */
    private void initializeUI() {
        backButton = findViewById(R.id.back_button);
        voiceTemplateSpinner = findViewById(R.id.voice_template_spinner);
        voicePreviewButton = findViewById(R.id.voice_preview_button);
        audioVolumeSeekBar = findViewById(R.id.audio_volume_seekbar);
        audioVolumeValue = findViewById(R.id.audio_volume_value);
        backgroundMusicSwitch = findViewById(R.id.background_music_switch);
        gameSpeedGroup = findViewById(R.id.game_speed_group);
        difficultySpinner = findViewById(R.id.difficulty_spinner);
        resetProgressButton = findViewById(R.id.reset_progress_button);
        appVersionText = findViewById(R.id.app_version);
        
        // Set up voice template spinner
        ArrayAdapter<CharSequence> voiceAdapter = ArrayAdapter.createFromResource(
                this, R.array.voice_templates, android.R.layout.simple_spinner_item);
        voiceAdapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        voiceTemplateSpinner.setAdapter(voiceAdapter);
        
        // Set up difficulty spinner
        ArrayAdapter<CharSequence> difficultyAdapter = ArrayAdapter.createFromResource(
                this, R.array.difficulty_levels, android.R.layout.simple_spinner_item);
        difficultyAdapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        difficultySpinner.setAdapter(difficultyAdapter);
        
        // Set app version
        appVersionText.setText(getString(R.string.app_version));
    }
    
    /**
     * Set up click listeners and change listeners
     */
    private void setupClickListeners() {
        backButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                saveSettings();
                finish();
            }
        });
        
        voicePreviewButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                previewVoiceTemplate();
            }
        });
        
        audioVolumeSeekBar.setOnSeekBarChangeListener(new SeekBar.OnSeekBarChangeListener() {
            @Override
            public void onProgressChanged(SeekBar seekBar, int progress, boolean fromUser) {
                if (fromUser) {
                    audioVolumeValue.setText(progress + "%");
                    audioManager.setVolume(progress / 100.0f);
                }
            }
            
            @Override
            public void onStartTrackingTouch(SeekBar seekBar) {}
            
            @Override
            public void onStopTrackingTouch(SeekBar seekBar) {}
        });
        
        backgroundMusicSwitch.setOnCheckedChangeListener(
                (buttonView, isChecked) -> {
                    if (isChecked) {
                        audioManager.playBackgroundMusic();
                    } else {
                        audioManager.stopBackgroundMusic();
                    }
                });
        
        gameSpeedGroup.setOnCheckedChangeListener(new RadioGroup.OnCheckedChangeListener() {
            @Override
            public void onCheckedChanged(RadioGroup group, int checkedId) {
                // Handle game speed change
                if (checkedId == R.id.speed_slow) {
                    setGameSpeed(0.5f);
                } else if (checkedId == R.id.speed_medium) {
                    setGameSpeed(1.0f);
                } else if (checkedId == R.id.speed_fast) {
                    setGameSpeed(1.5f);
                }
            }
        });
        
        resetProgressButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                resetGameProgress();
            }
        });
    }
    
    /**
     * Load current settings from preferences
     */
    private void loadSettings() {
        // Load voice template
        int voiceTemplate = sharedPreferences.getInt("voice_template", 0);
        voiceTemplateSpinner.setSelection(voiceTemplate);
        
        // Load audio volume
        int audioVolume = sharedPreferences.getInt("audio_volume", 80);
        audioVolumeSeekBar.setProgress(audioVolume);
        audioVolumeValue.setText(audioVolume + "%");
        
        // Load background music setting
        boolean backgroundMusic = sharedPreferences.getBoolean("background_music", true);
        backgroundMusicSwitch.setChecked(backgroundMusic);
        
        // Load game speed
        float gameSpeed = sharedPreferences.getFloat("game_speed", 1.0f);
        if (gameSpeed == 0.5f) {
            gameSpeedGroup.check(R.id.speed_slow);
        } else if (gameSpeed == 1.0f) {
            gameSpeedGroup.check(R.id.speed_medium);
        } else if (gameSpeed == 1.5f) {
            gameSpeedGroup.check(R.id.speed_fast);
        }
        
        // Load difficulty
        int difficulty = sharedPreferences.getInt("difficulty", 1); // Default to normal
        difficultySpinner.setSelection(difficulty);
    }
    
    /**
     * Save current settings to preferences
     */
    private void saveSettings() {
        SharedPreferences.Editor editor = sharedPreferences.edit();
        
        // Save voice template
        editor.putInt("voice_template", voiceTemplateSpinner.getSelectedItemPosition());
        
        // Save audio volume
        editor.putInt("audio_volume", audioVolumeSeekBar.getProgress());
        
        // Save background music setting
        editor.putBoolean("background_music", backgroundMusicSwitch.isChecked());
        
        // Save game speed
        float gameSpeed = getCurrentGameSpeed();
        editor.putFloat("game_speed", gameSpeed);
        
        // Save difficulty
        editor.putInt("difficulty", difficultySpinner.getSelectedItemPosition());
        
        editor.apply();
    }
    
    /**
     * Preview selected voice template
     */
    private void previewVoiceTemplate() {
        int selectedTemplate = voiceTemplateSpinner.getSelectedItemPosition();
        String[] voiceTemplates = {"american-female", "american-male", "british-female", "british-male"};
        
        if (selectedTemplate < voiceTemplates.length) {
            String template = voiceTemplates[selectedTemplate];
            audioManager.setVoiceTemplate(template);
            audioManager.playVoice("girl"); // Preview with "girl" voice
        }
    }
    
    /**
     * Get current game speed from radio group
     */
    private float getCurrentGameSpeed() {
        int checkedId = gameSpeedGroup.getCheckedRadioButtonId();
        if (checkedId == R.id.speed_slow) {
            return 0.5f;
        } else if (checkedId == R.id.speed_fast) {
            return 1.5f;
        } else {
            return 1.0f; // Medium speed
        }
    }
    
    /**
     * Set game speed
     */
    private void setGameSpeed(float speed) {
        // This would be implemented to affect game timing
        // For now, just store the value
    }
    
    /**
     * Reset game progress
     */
    private void resetGameProgress() {
        SharedPreferences.Editor editor = sharedPreferences.edit();
        editor.remove("completed_letters");
        editor.remove("scores");
        editor.remove("progress");
        editor.apply();
        
        // Show confirmation (in a real app, you'd show a dialog)
        // For now, just a simple indicator
        resetProgressButton.setText("Progress Reset!");
        resetProgressButton.setEnabled(false);
        
        // Re-enable button after 2 seconds
        resetProgressButton.postDelayed(() -> {
            resetProgressButton.setText(getString(R.string.reset_all_progress));
            resetProgressButton.setEnabled(true);
        }, 2000);
    }
    
    @Override
    protected void onDestroy() {
        super.onDestroy();
        audioManager.release();
    }
}