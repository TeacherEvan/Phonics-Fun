package com.phonicsfun.core;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.RectF;
import android.graphics.Typeface;
import java.util.HashMap;
import java.util.Map;

/**
 * SymbolRenderer - Reusable component for rendering any symbol
 * Handles letters (G, A, B) and special symbols (#, $, %, etc.)
 */
public class SymbolRenderer {
    private static final String TAG = "SymbolRenderer";
    
    private Context context;
    private Paint paint;
    private Paint backgroundPaint;
    private Map<Character, SymbolConfig> symbolConfigs;
    
    public SymbolRenderer(Context context) {
        this.context = context;
        this.symbolConfigs = new HashMap<>();
        initializePaints();
        loadDefaultConfigs();
    }
    
    /**
     * Configuration for each symbol
     */
    public static class SymbolConfig {
        public int color;
        public int backgroundColor;
        public float textSize;
        public String fontStyle;
        public String[] words;
        public String[] soundKeys;
        public boolean hasAnimation;
        
        public SymbolConfig(int color, int backgroundColor, float textSize, String[] words, String[] soundKeys) {
            this.color = color;
            this.backgroundColor = backgroundColor;
            this.textSize = textSize;
            this.words = words;
            this.soundKeys = soundKeys;
            this.fontStyle = "default";
            this.hasAnimation = true;
        }
    }
    
    /**
     * Initialize paint objects
     */
    private void initializePaints() {
        paint = new Paint(Paint.ANTI_ALIAS_FLAG);
        paint.setStyle(Paint.Style.FILL);
        paint.setTextAlign(Paint.Align.CENTER);
        paint.setTypeface(Typeface.DEFAULT_BOLD);
        
        backgroundPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        backgroundPaint.setStyle(Paint.Style.FILL);
    }
    
    /**
     * Load default configurations for common symbols
     */
    private void loadDefaultConfigs() {
        // Letter G configuration
        symbolConfigs.put('G', new SymbolConfig(
            0xFF4CAF50, // Green
            0xFF2E7D32, // Dark green background
            48f,
            new String[]{"grape", "goat", "gold", "girl", "grandpa"},
            new String[]{"voice-grape", "voice-goat", "voice-gold", "voice-girl", "voice-grandpa"}
        ));
        
        // Letter A configuration
        symbolConfigs.put('A', new SymbolConfig(
            0xFFFF5722, // Orange
            0xFFD84315, // Dark orange background
            48f,
            new String[]{"apple", "ant", "airplane", "alligator", "arrow"},
            new String[]{"voice-apple", "voice-ant", "voice-airplane", "voice-alligator", "voice-arrow"}
        ));
        
        // Letter B configuration
        symbolConfigs.put('B', new SymbolConfig(
            0xFF2196F3, // Blue
            0xFF1565C0, // Dark blue background
            48f,
            new String[]{"ball", "bat", "bird", "boat", "bear"},
            new String[]{"voice-ball", "voice-bat", "voice-bird", "voice-boat", "voice-bear"}
        ));
        
        // Special symbols
        symbolConfigs.put('#', new SymbolConfig(
            0xFF9C27B0, // Purple
            0xFF6A1B9A, // Dark purple background
            56f,
            new String[]{"hashtag", "pound", "number"},
            new String[]{"voice-hashtag", "voice-pound", "voice-number"}
        ));
        
        symbolConfigs.put('$', new SymbolConfig(
            0xFFFFC107, // Amber
            0xFFF57C00, // Dark amber background
            56f,
            new String[]{"dollar", "money", "cash"},
            new String[]{"voice-dollar", "voice-money", "voice-cash"}
        ));
    }
    
    /**
     * MAIN FUNCTION: Render any symbol dynamically
     * This is what your frontend will call!
     */
    public void renderSymbol(Canvas canvas, char symbol, RectF bounds, int level) {
        SymbolConfig config = symbolConfigs.get(symbol);
        if (config == null) {
            // Create default config for unknown symbols
            config = createDefaultConfig(symbol);
        }
        
        // Draw background circle
        backgroundPaint.setColor(config.backgroundColor);
        float centerX = bounds.centerX();
        float centerY = bounds.centerY();
        float radius = Math.min(bounds.width(), bounds.height()) / 2f;
        canvas.drawCircle(centerX, centerY, radius, backgroundPaint);
        
        // Draw symbol
        paint.setColor(config.color);
        paint.setTextSize(config.textSize * getScaleForLevel(level));
        
        // Center the text vertically
        Paint.FontMetrics fontMetrics = paint.getFontMetrics();
        float textY = centerY - (fontMetrics.ascent + fontMetrics.descent) / 2f;
        
        canvas.drawText(String.valueOf(symbol), centerX, textY, paint);
        
        // Add glow effect if enabled
        if (config.hasAnimation) {
            addGlowEffect(canvas, centerX, centerY, radius, config.color);
        }
    }
    
    /**
     * Get words associated with a symbol
     */
    public String[] getWordsForSymbol(char symbol) {
        SymbolConfig config = symbolConfigs.get(symbol);
        return config != null ? config.words : new String[]{String.valueOf(symbol)};
    }
    
    /**
     * Get sound keys for a symbol
     */
    public String[] getSoundKeysForSymbol(char symbol) {
        SymbolConfig config = symbolConfigs.get(symbol);
        return config != null ? config.soundKeys : new String[]{"voice-" + symbol};
    }
    
    /**
     * Add custom symbol configuration
     */
    public void addSymbolConfig(char symbol, SymbolConfig config) {
        symbolConfigs.put(symbol, config);
    }
    
    /**
     * Create default configuration for unknown symbols
     */
    private SymbolConfig createDefaultConfig(char symbol) {
        return new SymbolConfig(
            0xFF757575, // Gray
            0xFF424242, // Dark gray background
            48f,
            new String[]{String.valueOf(symbol)},
            new String[]{"voice-" + symbol}
        );
    }
    
    /**
     * Get scale factor based on level
     */
    private float getScaleForLevel(int level) {
        return 1.0f + (level * 0.1f); // Slightly larger for higher levels
    }
    
    /**
     * Add glow effect around symbol
     */
    private void addGlowEffect(Canvas canvas, float centerX, float centerY, float radius, int color) {
        Paint glowPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        glowPaint.setStyle(Paint.Style.STROKE);
        glowPaint.setColor(color);
        glowPaint.setStrokeWidth(4f);
        glowPaint.setAlpha(100);
        
        canvas.drawCircle(centerX, centerY, radius + 5, glowPaint);
    }
    
    /**
     * Check if symbol is supported
     */
    public boolean isSymbolSupported(char symbol) {
        return symbolConfigs.containsKey(symbol);
    }
    
    /**
     * Get all supported symbols
     */
    public char[] getSupportedSymbols() {
        return symbolConfigs.keySet().toString().toCharArray();
    }
}
