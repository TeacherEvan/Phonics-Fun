package com.phonicsfun.activities;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Canvas;
import android.graphics.RectF;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.TextView;

import com.phonicsfun.R;
import com.phonicsfun.core.AudioManager;
import com.phonicsfun.core.GameState;
import com.phonicsfun.core.SymbolRenderer;

/**
 * GameplayActivity - Main game screen with letter/symbol gameplay
 */
public class GameplayActivity extends Activity {
    private static final String TAG = "GameplayActivity";
    
    private GameState gameState;
    private AudioManager audioManager;
    private SymbolRenderer symbolRenderer;
    
    private char currentLetter;
    private int currentWordIndex = 0;
    private int score = 0;
    private String[] currentWords;
    
    // UI Components
    private Button backButton;
    private Button settingsButton;
    private Button audioButton;
    private Button hintButton;
    private Button nextWordButton;
    private TextView currentLetterText;
    private TextView levelProgressText;
    private TextView scoreValueText;
    private TextView gameStatusText;
    private FrameLayout gameCanvas;
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_gameplay);
        
        // Get the letter from intent
        Intent intent = getIntent();
        currentLetter = intent.getCharExtra("letter", 'G');
        
        // Initialize core components
        gameState = GameState.getInstance();
        audioManager = new AudioManager(this);
        symbolRenderer = new SymbolRenderer(this);
        
        // Initialize UI
        initializeUI();
        
        // Set up click listeners
        setupClickListeners();
        
        // Initialize game for current letter
        initializeGame();
        
        // Update display
        updateGameDisplay();
    }
    
    /**
     * Initialize UI components
     */
    private void initializeUI() {
        backButton = findViewById(R.id.back_button);
        settingsButton = findViewById(R.id.settings_button);
        audioButton = findViewById(R.id.audio_button);
        hintButton = findViewById(R.id.hint_button);
        nextWordButton = findViewById(R.id.next_word_button);
        currentLetterText = findViewById(R.id.current_letter);
        levelProgressText = findViewById(R.id.level_progress);
        scoreValueText = findViewById(R.id.score_value);
        gameStatusText = findViewById(R.id.game_status);
        gameCanvas = findViewById(R.id.game_canvas);
    }
    
    /**
     * Set up click listeners
     */
    private void setupClickListeners() {
        backButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                finish();
            }
        });
        
        settingsButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Intent intent = new Intent(GameplayActivity.this, SettingsActivity.class);
                startActivity(intent);
            }
        });
        
        audioButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                playCurrentWordAudio();
            }
        });
        
        hintButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                showHint();
            }
        });
        
        nextWordButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                nextWord();
            }
        });
    }
    
    /**
     * Initialize game for current letter
     */
    private void initializeGame() {
        currentWords = symbolRenderer.getWordsForSymbol(currentLetter);
        currentWordIndex = 0;
        score = 0;
        
        // Play phoneme sound for the letter
        audioManager.playPhoneme(currentLetter);
    }
    
    /**
     * Update game display
     */
    private void updateGameDisplay() {
        // Update letter display
        currentLetterText.setText(String.valueOf(currentLetter));
        
        // Update progress
        String progressText = getString(R.string.level_progress, 
                currentWordIndex + 1, currentWords.length);
        levelProgressText.setText(progressText);
        
        // Update score
        scoreValueText.setText(String.valueOf(score));
        
        // Update game status
        if (currentWordIndex < currentWords.length) {
            String currentWord = currentWords[currentWordIndex];
            gameStatusText.setText(currentLetter + " is for " + currentWord);
        } else {
            gameStatusText.setText(getString(R.string.game_completed));
        }
    }
    
    /**
     * Play audio for current word
     */
    private void playCurrentWordAudio() {
        if (currentWordIndex < currentWords.length) {
            String currentWord = currentWords[currentWordIndex];
            audioManager.playVoice(currentWord);
        }
    }
    
    /**
     * Show hint for current word
     */
    private void showHint() {
        if (currentWordIndex < currentWords.length) {
            String currentWord = currentWords[currentWordIndex];
            gameStatusText.setText("Hint: " + currentWord + " starts with " + currentLetter);
        }
    }
    
    /**
     * Move to next word
     */
    private void nextWord() {
        if (currentWordIndex < currentWords.length - 1) {
            currentWordIndex++;
            score += 10; // Add points for completing word
            updateGameDisplay();
            
            // Play audio for new word
            playCurrentWordAudio();
        } else {
            // Game completed for this letter
            gameState.markLetterCompleted(currentLetter);
            audioManager.playCelebration();
            
            // Show completion message
            gameStatusText.setText(getString(R.string.game_completed));
            
            // Disable next word button
            nextWordButton.setEnabled(false);
        }
    }
    
    /**
     * Custom game view for rendering symbols
     */
    private class GameView extends View {
        
        public GameView(android.content.Context context) {
            super(context);
        }
        
        @Override
        protected void onDraw(Canvas canvas) {
            super.onDraw(canvas);
            
            // Create bounds for symbol rendering
            RectF bounds = new RectF(0, 0, getWidth(), getHeight());
            
            // Render current letter using SymbolRenderer
            symbolRenderer.renderSymbol(canvas, currentLetter, bounds, 1);
        }
    }
    
    @Override
    protected void onResume() {
        super.onResume();
        // Resume audio playback if needed
        audioManager.resume();
    }
    
    @Override
    protected void onPause() {
        super.onPause();
        // Pause audio playback
        audioManager.pause();
    }
    
    @Override
    protected void onDestroy() {
        super.onDestroy();
        // Clean up resources
        audioManager.release();
    }
}