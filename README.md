# Phonics Fun - Letter G Game

A fun, educational web game that teaches children the letter "G" through interactive gameplay.

## Features

- **Welcome Screen**: Animated welcome message with pulsating colors
- **Level Selection**: A-Z letter grid with only "G" playable
- **Space-themed Gameplay**: Interactive planets in a galaxy setting
- **Enhanced Audio System**: Advanced sound effects and voice messages
- **Physics-Based Collisions**: Accurate asteroid-planet interactions
- **Event-Driven Architecture**: Responsive gameplay experience
- **Responsive Design**: Works on desktop and mobile devices
- **Cross-browser Compatible**: Tested on Chrome, Safari, Firefox, and Edge

## Quick Start

### Option 1: Direct HTML File
1. Download or clone this repository
2. Open `index.html` in your web browser
3. Start playing!

### Option 2: Local Server
```bash
# Using Python 3
python -m http.server 8000

# Using Node.js (if you have http-server installed)
npx http-server

# Using PHP
php -S localhost:8000
```

Then open `http://localhost:8000` in your browser.

### Option 3: Docker
```bash
# Build the image
docker build -t phonics-fun .

# Run the container
docker run -p 8080:80 phonics-fun
```

Then open `http://localhost:8080` in your browser.

## File Structure

```plaintext
phonics-fun/
├── index.html          # Main HTML file
├── css/
│   └── styles.css      # Game styles and animations
├── js/
│   ├── main.js         # Core game logic
│   ├── audio-manager.js # Advanced audio system
│   ├── event-manager.js # Event coordination system
│   ├── collision-manager.js # Physics-based collision system
│   └── particles.js    # Particle effects system
├── assets/
│   ├── images/         # Game images
│   └── sounds/         # Audio files
├── Tests/
│   ├── test-suite.html # General tests
│   ├── asset-generator.html # Asset generator
│   ├── audio-test.html # Audio testing tool
│   └── sound-test.html # Sound testing
├── Docs/
│   ├── project-status.md # Current status
│   ├── audio-enhancement-guide.md # Audio system documentation
│   └── sound-generation-guide.md # Sound generation guide
├── Dockerfile          # Docker container setup
├── README.md           # This file
└── run.bat             # Windows startup script
```
├── css/
│   └── styles.css      # All styles and animations
├── js/
│   └── main.js         # Game logic and state management
├── assets/
│   ├── images/         # Game images (planets, words, etc.)
│   └── sounds/         # Audio files (effects, voices)
├── docs/               # Documentation files
├── tests/              # Test files
├── Dockerfile          # Docker configuration
└── README.md           # This file
```

## How to Play

1. **Welcome Screen**: Click "Start Game" to begin
2. **Level Select**: Click on the letter "G" to start the phonics lesson
3. **Gameplay**: 
   - Click on planets showing the letter "G"
   - Watch asteroids collide with planets
   - Enjoy explosions and hear the "/g/" sound
   - Listen to words that start with "G"
   - Complete all 5 hits to finish the level

## Game Flow

### Welcome Screen
- Displays animated welcome message
- Single "Start Game" button

### Level Selection
- Shows A-Z grid of letters
- Only "G" is playable (green button)
- Other letters show "COMING SOON!" popup
- Clicking "G" shows loading screen

### Gameplay
- Space-themed background with moving stars
- 5 planets with letter "G" orbit around the screen
- 3 decoy planets with other letters
- Clicking correct "G" planets triggers:
  - Fiery asteroid from random screen edge
  - Explosion animation and sound
  - Low-pitched "/g/" phoneme sound
  - Voice message: "G is for [Word]!" 
  - Semi-transparent word image in background
- Progress bar shows completion (5 hits needed)
- Level complete popup offers "Next Level" or "Exit"

## Browser Support

- **Chrome**: 88+ ✅
- **Safari**: 14+ ✅
- **Firefox**: 85+ ✅
- **Edge**: 88+ ✅
- **Mobile Safari**: iOS 14+ ✅
- **Chrome Mobile**: Android 8+ ✅

## Technical Details

### Technologies Used
- HTML5 with semantic markup
- CSS3 with animations and transitions
- Vanilla JavaScript (ES6+)
- Web Audio API for sound
- CSS Grid and Flexbox for layout
- CSS animations for visual effects

### Key Features
- **State Management**: Simple state machine for screen transitions
- **Event Handling**: Touch and mouse event optimization
- **Responsive Design**: Mobile-first approach with breakpoints
- **Performance**: Efficient DOM manipulation and animation
- **Accessibility**: Semantic HTML and proper ARIA attributes
- **Error Handling**: Graceful degradation for missing assets

### Audio Files Required
Place these files in `assets/sounds/`:
- `explosion.mp3` - Explosion sound effect
- `phoneme-g.mp3` - Low-pitched "/g/" sound
- `celebration.mp3` - Level completion sound
- `voice-grape.mp3` - "G is for Grape!"
- `voice-goat.mp3` - "G is for Goat!"
- `voice-gold.mp3` - "G is for Gold!"
- `voice-girl.mp3` - "G is for Girl!"
- `voice-grandpa.mp3` - "G is for Grandpa!"

### Image Files Required
Place these files in `assets/images/`:
- `grape.png` - Grape illustration
- `goat.png` - Goat illustration
- `gold.png` - Gold illustration
- `girl.png` - Girl illustration
- `grandpa.png` - Grandpa illustration

## Development

### Adding New Letters
1. Update the `handleLetterClick` method in `js/main.js`
2. Create new gameplay logic for the letter
3. Add corresponding audio and image assets
4. Update CSS if needed for new animations

### Customization
- **Colors**: Modify CSS custom properties in `styles.css`
- **Animations**: Adjust keyframes and timing in CSS
- **Game Logic**: Update `GameState` class in `main.js`
- **Audio**: Replace files in `assets/sounds/`
- **Images**: Replace files in `assets/images/`

## Testing

### Manual Testing Checklist
- [ ] Welcome screen loads correctly
- [ ] Start button works
- [ ] Level select screen shows A-Z grid
- [ ] Only G button is clickable
- [ ] Other letters show "COMING SOON!" popup
- [ ] G button shows loading screen
- [ ] Gameplay screen loads after 5 seconds
- [ ] Planets move and are clickable
- [ ] Correct hits trigger effects
- [ ] Incorrect hits show dull asteroids
- [ ] Progress bar updates correctly
- [ ] Level completes after 5 hits
- [ ] Audio plays correctly
- [ ] Responsive design works on mobile
- [ ] Cross-browser compatibility

### Browser Testing
Test the game in:
1. Chrome (latest)
2. Safari (latest)
3. Firefox (latest)
4. Edge (latest)
5. Mobile Safari (iOS)
6. Chrome Mobile (Android)

## Troubleshooting

### Common Issues

**Game doesn't load:**
- Check browser console for JavaScript errors
- Ensure all files are in correct directories
- Try refreshing the page

**Audio doesn't play:**
- Check if audio files exist in `assets/sounds/`
- Some browsers require user interaction before playing audio
- Check browser console for audio errors

**Images don't display:**
- Verify image files exist in `assets/images/`
- Check file extensions match code references
- Ensure images are web-optimized (PNG, JPG, WebP)

**Performance issues:**
- Reduce image file sizes
- Check for console errors
- Close other browser tabs/applications

**Touch events not working:**
- Ensure device supports touch events
- Check if other gestures are interfering
- Try refreshing the page

### Debug Mode
Open browser developer tools (F12) and check the Console tab for debug messages and errors.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is created for educational purposes. Feel free to use and modify for learning and teaching.

## Credits

- **Game Design**: Educational phonics principles
- **Development**: AI Assistant
- **Target Audience**: Children learning phonics
- **Educational Value**: Letter recognition and phoneme association

---

**Teacher Evan's Phonics Fun** - Making learning letters fun and interactive! 🎮📚
