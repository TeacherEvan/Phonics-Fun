package com.phonicsfun.activities;

import android.app.Activity;
import android.graphics.Canvas;
import android.graphics.RectF;
import android.os.Bundle;
import com.phonicsfun.core.SymbolRenderer;

/**
 * Example usage of the reusable SymbolRenderer
 * This demonstrates how to render any symbol dynamically
 */
public class SymbolGameActivity extends Activity {
    private SymbolRenderer symbolRenderer;
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Initialize the reusable renderer
        symbolRenderer = new SymbolRenderer(this);
        
        // Example usage scenarios
        demonstrateSymbolRendering();
    }
    
    /**
     * Demonstrate how to use the reusable SymbolRenderer
     */
    private void demonstrateSymbolRendering() {
        // Example 1: Render letter G (existing functionality)
        renderSymbolExample('G', 1);
        
        // Example 2: Render letter A (new functionality)
        renderSymbolExample('A', 2);
        
        // Example 3: Render letter B (new functionality)
        renderSymbolExample('B', 3);
        
        // Example 4: Render special symbols
        renderSymbolExample('#', 4);
        renderSymbolExample('$', 5);
        
        // Example 5: Render any symbol dynamically
        char userSymbol = getUserSelectedSymbol(); // Get from user input
        int userLevel = getUserLevel(); // Get from user progress
        renderSymbolExample(userSymbol, userLevel);
    }
    
    /**
     * Single function that renders any symbol
     * THIS IS THE REUSABLE SOLUTION YOU REQUESTED!
     */
    private void renderSymbolExample(char symbol, int level) {
        // Create canvas and bounds (in real app, this comes from your View)
        Canvas canvas = getCanvasFromView(); // Your implementation
        RectF bounds = new RectF(100, 100, 200, 200); // Symbol position and size
        
        // ONE LINE OF CODE TO RENDER ANY SYMBOL!
        symbolRenderer.renderSymbol(canvas, symbol, bounds, level);
        
        // Get associated words and sounds
        String[] words = symbolRenderer.getWordsForSymbol(symbol);
        String[] sounds = symbolRenderer.getSoundKeysForSymbol(symbol);
        
        // Log what was rendered
        android.util.Log.d("SymbolGame", 
            "Rendered symbol: " + symbol + 
            " at level: " + level + 
            " with words: " + java.util.Arrays.toString(words));
    }
    
    /**
     * Example: Dynamic symbol selection based on user level
     */
    private void handleUserLevelProgression() {
        int userLevel = getUserLevel();
        char symbolToRender;
        
        // Dynamic symbol selection based on level
        switch (userLevel) {
            case 1:
                symbolToRender = 'G';
                break;
            case 2:
                symbolToRender = 'A';
                break;
            case 3:
                symbolToRender = 'B';
                break;
            case 4:
                symbolToRender = '#';
                break;
            case 5:
                symbolToRender = '$';
                break;
            default:
                symbolToRender = 'G'; // Default fallback
        }
        
        // Render the selected symbol
        renderSymbolExample(symbolToRender, userLevel);
    }
    
    /**
     * Example: Add custom symbol configuration
     */
    private void addCustomSymbol() {
        // Create custom configuration for symbol '%'
        SymbolRenderer.SymbolConfig percentConfig = new SymbolRenderer.SymbolConfig(
            0xFFE91E63, // Pink
            0xFFC2185B, // Dark pink background
            52f,
            new String[]{"percent", "percentage", "rate"},
            new String[]{"voice-percent", "voice-percentage", "voice-rate"}
        );
        
        // Add to renderer
        symbolRenderer.addSymbolConfig('%', percentConfig);
        
        // Now you can render '%' symbol
        renderSymbolExample('%', 6);
    }
    
    // Helper methods (implement these in your actual app)
    private Canvas getCanvasFromView() {
        // Return canvas from your custom View
        return null; // Placeholder
    }
    
    private char getUserSelectedSymbol() {
        // Get symbol from user input/selection
        return 'G'; // Placeholder
    }
    
    private int getUserLevel() {
        // Get current user level
        return 1; // Placeholder
    }
}
