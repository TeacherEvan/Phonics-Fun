package com.phonicsfun.activities;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.TextView;

import com.phonicsfun.R;
import com.phonicsfun.core.GameState;

/**
 * LevelSelectActivity - Shows available letters/levels to play
 */
public class LevelSelectActivity extends Activity {
    private static final String TAG = "LevelSelectActivity";
    
    private GameState gameState;
    private Button backButton;
    private Button settingsButton;
    private Button letterGButton;
    private Button letterAButton;
    private Button letterBButton;
    private TextView progressText;
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_level_select);
        
        // Initialize game state
        gameState = GameState.getInstance();
        
        // Initialize UI components
        initializeUI();
        
        // Set up click listeners
        setupClickListeners();
        
        // Update progress display
        updateProgressDisplay();
    }
    
    /**
     * Initialize UI components
     */
    private void initializeUI() {
        backButton = findViewById(R.id.back_button);
        settingsButton = findViewById(R.id.settings_button);
        letterGButton = findViewById(R.id.letter_g_button);
        letterAButton = findViewById(R.id.letter_a_button);
        letterBButton = findViewById(R.id.letter_b_button);
        progressText = findViewById(R.id.progress_text);
    }
    
    /**
     * Set up click listeners for buttons
     */
    private void setupClickListeners() {
        backButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                finish(); // Return to previous activity
            }
        });
        
        settingsButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Intent intent = new Intent(LevelSelectActivity.this, SettingsActivity.class);
                startActivity(intent);
            }
        });
        
        letterGButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                startGameplayActivity('G');
            }
        });
        
        letterAButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                startGameplayActivity('A');
            }
        });
        
        letterBButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                startGameplayActivity('B');
            }
        });
    }
    
    /**
     * Start gameplay activity for specific letter
     */
    private void startGameplayActivity(char letter) {
        Intent intent = new Intent(LevelSelectActivity.this, GameplayActivity.class);
        intent.putExtra("letter", letter);
        startActivity(intent);
    }
    
    /**
     * Update progress display
     */
    private void updateProgressDisplay() {
        // Calculate progress based on completed letters
        int completedLetters = gameState.getCompletedLettersCount();
        int totalLetters = 3; // G, A, B for now
        int progressPercentage = (completedLetters * 100) / totalLetters;
        
        String progressMessage = getString(R.string.progress, progressPercentage);
        progressText.setText(progressMessage);
    }
    
    @Override
    protected void onResume() {
        super.onResume();
        // Update progress when returning from gameplay
        updateProgressDisplay();
    }
}