package com.phonicsfun.activities;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.TextView;
import android.animation.ObjectAnimator;
import android.animation.AnimatorSet;
import android.animation.ValueAnimator;
import android.graphics.Color;
import android.os.Handler;
import android.widget.ImageView;
import java.util.Random;

import com.phonicsfun.core.GameState;
import com.phonicsfun.core.EventManager;

/**
 * WelcomeActivity - Main entry point for the Phonics Fun game
 * Features animated welcome screen with space theme
 * Android/Java implementation
 */
public class WelcomeActivity extends Activity {
    private static final String TAG = "PhonicsWelcome";
    
    private GameState gameState;
    private TextView titleText;
    private TextView teacherNameText;
    private Button startGameButton;
    private Button settingsButton;
    private ImageView backgroundView;
    private Handler animationHandler;
    private Random random;
    
    // Animation objects
    private AnimatorSet welcomeAnimations;
    private boolean animationsActive = false;
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Set fullscreen and landscape
        getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN,
                WindowManager.LayoutParams.FLAG_FULLSCREEN);
        
        setContentView(R.layout.activity_welcome);
        
        // Initialize game state
        gameState = new GameState(this);
        
        // Initialize UI components
        initializeViews();
        setupEventListeners();
        startWelcomeAnimations();
        
        // Start background music
        gameState.getAudioManager().playBackgroundMusic();
    }
    
    private void initializeViews() {
        titleText = findViewById(R.id.welcome_title);
        teacherNameText = findViewById(R.id.teacher_name);
        startGameButton = findViewById(R.id.start_game_button);
        settingsButton = findViewById(R.id.settings_button);
        backgroundView = findViewById(R.id.background_view);
        
        animationHandler = new Handler();
        random = new Random();
        
        // Set initial text
        titleText.setText("Welcome To");
        teacherNameText.setText("Teacher Evan's\nFun with Phonics!");
    }
    
    private void setupEventListeners() {
        startGameButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                startGame();
            }
        });
        
        settingsButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                openSettings();
            }
        });
        
        // Subscribe to game events
        gameState.getEventManager().subscribe(EventManager.GameEvents.SETTINGS_CHANGED, 
            new EventManager.EventListener() {
                @Override
                public void onEvent(String eventType, Object data) {
                    // Handle settings changes
                    updateAudioSettings();
                }
            });
    }
    
    private void startWelcomeAnimations() {
        animationsActive = true;
        
        // Create pulsating text animation
        createPulsatingTextAnimation();
        
        // Create background star animation
        createBackgroundAnimations();
        
        // Create floating planet animation
        createFloatingPlanetAnimation();
        
        // Start all animations
        if (welcomeAnimations != null) {
            welcomeAnimations.start();
        }
    }
    
    private void createPulsatingTextAnimation() {
        // Pulsating effect for title
        ObjectAnimator titlePulse = ObjectAnimator.ofFloat(titleText, "alpha", 0.7f, 1.0f, 0.7f);
        titlePulse.setDuration(2000);
        titlePulse.setRepeatCount(ValueAnimator.INFINITE);
        
        // Scale animation for teacher name
        ObjectAnimator teacherScale = ObjectAnimator.ofFloat(teacherNameText, "scaleX", 1.0f, 1.1f, 1.0f);
        ObjectAnimator teacherScaleY = ObjectAnimator.ofFloat(teacherNameText, "scaleY", 1.0f, 1.1f, 1.0f);
        teacherScale.setDuration(3000);
        teacherScaleY.setDuration(3000);
        teacherScale.setRepeatCount(ValueAnimator.INFINITE);
        teacherScaleY.setRepeatCount(ValueAnimator.INFINITE);
        
        // Button bounce animation
        ObjectAnimator buttonBounce = ObjectAnimator.ofFloat(startGameButton, "translationY", 0f, -20f, 0f);
        buttonBounce.setDuration(1500);
        buttonBounce.setRepeatCount(ValueAnimator.INFINITE);
        
        // Combine animations
        welcomeAnimations = new AnimatorSet();
        welcomeAnimations.playTogether(titlePulse, teacherScale, teacherScaleY, buttonBounce);
    }
    
    private void createBackgroundAnimations() {
        // Create twinkling star effect
        animationHandler.postDelayed(new Runnable() {
            @Override
            public void run() {
                if (animationsActive) {
                    createTwinklingStars();
                    animationHandler.postDelayed(this, 500);
                }
            }
        }, 500);
    }
    
    private void createTwinklingStars() {
        // Create random twinkling effects across the screen
        for (int i = 0; i < 3; i++) {
            final ImageView star = new ImageView(this);
            star.setImageResource(R.drawable.star);
            star.setAlpha(0.0f);
            
            // Random position
            float x = random.nextFloat() * getResources().getDisplayMetrics().widthPixels;
            float y = random.nextFloat() * getResources().getDisplayMetrics().heightPixels;
            
            star.setX(x);
            star.setY(y);
            
            // Add to layout
            findViewById(R.id.welcome_container).addView(star);
            
            // Animate star
            ObjectAnimator starTwinkle = ObjectAnimator.ofFloat(star, "alpha", 0.0f, 1.0f, 0.0f);
            starTwinkle.setDuration(1000);
            starTwinkle.start();
            
            // Remove star after animation
            animationHandler.postDelayed(new Runnable() {
                @Override
                public void run() {
                    findViewById(R.id.welcome_container).removeView(star);
                }
            }, 1000);
        }
    }
    
    private void createFloatingPlanetAnimation() {
        // Create floating planets in the background
        animationHandler.postDelayed(new Runnable() {
            @Override
            public void run() {
                if (animationsActive && random.nextFloat() < 0.3f) {
                    createFloatingPlanet();
                }
                if (animationsActive) {
                    animationHandler.postDelayed(this, 2000);
                }
            }
        }, 2000);
    }
    
    private void createFloatingPlanet() {
        final ImageView planet = new ImageView(this);
        planet.setImageResource(R.drawable.planet_small);
        planet.setAlpha(0.6f);
        
        // Random starting position (off-screen)
        float startX = -200f;
        float startY = random.nextFloat() * getResources().getDisplayMetrics().heightPixels;
        float endX = getResources().getDisplayMetrics().widthPixels + 200f;
        
        planet.setX(startX);
        planet.setY(startY);
        
        // Add to layout
        findViewById(R.id.welcome_container).addView(planet);
        
        // Animate planet movement
        ObjectAnimator planetMove = ObjectAnimator.ofFloat(planet, "x", startX, endX);
        planetMove.setDuration(8000);
        planetMove.start();
        
        // Remove planet after animation
        animationHandler.postDelayed(new Runnable() {
            @Override
            public void run() {
                findViewById(R.id.welcome_container).removeView(planet);
            }
        }, 8000);
    }
    
    private void startGame() {
        // Play button sound
        gameState.getAudioManager().playEffect("celebration");
        
        // Stop animations
        stopAnimations();
        
        // Start level select activity
        Intent intent = new Intent(this, LevelSelectActivity.class);
        startActivity(intent);
        
        // Add transition animation
        overridePendingTransition(R.anim.slide_in_right, R.anim.slide_out_left);
    }
    
    private void openSettings() {
        // Play button sound
        gameState.getAudioManager().playEffect("celebration");
        
        // Open settings activity
        Intent intent = new Intent(this, SettingsActivity.class);
        startActivity(intent);
    }
    
    private void updateAudioSettings() {
        // Update audio settings based on current game state
        if (gameState.isMuted()) {
            gameState.getAudioManager().setMuted(true);
        } else {
            gameState.getAudioManager().setMuted(false);
            gameState.getAudioManager().playBackgroundMusic();
        }
    }
    
    private void stopAnimations() {
        animationsActive = false;
        if (welcomeAnimations != null && welcomeAnimations.isRunning()) {
            welcomeAnimations.cancel();
        }
        animationHandler.removeCallbacksAndMessages(null);
    }
    
    @Override
    protected void onResume() {
        super.onResume();
        if (!animationsActive) {
            startWelcomeAnimations();
        }
        gameState.getAudioManager().playBackgroundMusic();
    }
    
    @Override
    protected void onPause() {
        super.onPause();
        stopAnimations();
        gameState.getAudioManager().pauseMusic();
    }
    
    @Override
    protected void onDestroy() {
        super.onDestroy();
        stopAnimations();
        if (gameState != null) {
            gameState.getEventManager().cleanup();
            gameState.getAudioManager().cleanup();
        }
    }
}
