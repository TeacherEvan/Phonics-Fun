# Phonics Fun - Educational Game Development

**CRITICAL: Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.**

Phonics Fun is an HTML5, CSS3, and vanilla JavaScript educational game for teaching children phonics, with Android app capability through Gradle build system. The game teaches letters through interactive space-themed gameplay.

## Working Effectively

### Bootstrap and Run the Web Application
**ALWAYS start with these steps:**
- `cd /home/runner/work/Phonics-Fun/Phonics-Fun`
- **Web server options (choose one):**
  - **Python (recommended):** `python3 -m http.server 8000` - starts in ~1 second
  - **Node.js:** `npx http-server -p 8000` - takes ~8 seconds initial install, then starts quickly
  - **Docker:** See Docker section below
- Open `http://localhost:8000` in browser
- **Direct file access:** Open `index.html` directly (works but limited functionality)

### Build and Test Commands
- **Docker build:** `docker build -t phonics-fun .` - **NEVER CANCEL** - takes 2-5 minutes. Use timeout of 10+ minutes.
- **Docker run:** `docker run -d -p 8080:80 --name phonics-fun-container phonics-fun`
- **Android build:** **DOES NOT WORK** - Gradle fails due to missing Android plugin repositories
- **Tests:** Open test files directly in browser via web server (no automated test runners)

### Time Expectations - NEVER CANCEL
- **Web server startup:** 1-8 seconds (Python fast, NPX slower first time)
- **Docker build:** 2-5 minutes - **NEVER CANCEL, set timeout to 600+ seconds**
- **Docker container startup:** 2-3 seconds
- **NPX http-server initial install:** ~8 seconds first time, instant after

## Validation and Testing

### Manual Validation Scenarios
**ALWAYS run through these scenarios after making changes:**

1. **Web Application Flow:**
   - Start web server with `python3 -m http.server 8000`
   - Navigate to `http://localhost:8000`
   - Click "Start Game" button
   - Click letter "G" in level select
   - Click on "G" planets in gameplay (should trigger asteroid animations)
   - Verify audio plays (explosion sounds, voice messages)
   - Complete level (5 hits) and verify completion popup

2. **Test Suite Validation:**
   - Access `http://localhost:8000/Tests/test-suite.html`
   - Access `http://localhost:8000/Tests/audio-test.html`
   - Access `http://localhost:8000/Tests/asset-generator.html`
   - Access `http://localhost:8000/Tests/sound-test.html`

3. **Docker Container Validation (if needed):**
   - **Note:** Original Dockerfile fails due to network issues
   - Use simplified build if Docker is required
   - Build: `docker build -f Dockerfile.simple -t phonics-simple .` (set 600+ second timeout)
   - Run: `docker run -d -p 8080:80 --name test-container phonics-simple`
   - Test: `curl -s http://localhost:8080 | head -5`
   - Cleanup: `docker stop test-container && docker rm test-container`

### Asset Verification
**Before making changes, verify these critical files exist:**
- `index.html` - Main game file
- `css/styles.css` - All game styling
- `js/main.js` - Core game logic  
- `js/audio-manager.js` - Audio system
- `js/collision-manager.js` - Physics system
- `Assets/sounds/` - Audio files (some are .placeholder files)
- `Assets/images/` - Image files (some are .placeholder files)

## Build System Details

### Web Application (PRIMARY)
- **Technology:** HTML5 + CSS3 + Vanilla JavaScript
- **No build process required** - static files served directly
- **No package.json** - no npm dependencies
- **No linting/formatting tools** - manual code review only

### Android Application (BROKEN)
- **Status:** DOES NOT WORK - do not attempt Android builds
- **Issue:** `gradle tasks` fails with plugin resolution errors
- **Files:** `build.gradle`, `settings.gradle`, `app/build.gradle` exist but broken
- **Error:** Android Gradle Plugin 8.1.4 not found in repositories

### Docker Deployment (PARTIALLY WORKING)
- **Original Dockerfile:** FAILS due to network issues with Alpine package manager
- **Workaround:** Use simplified Dockerfile without package installations
- **Build time:** 2-5 minutes - **CRITICAL: NEVER CANCEL, use 600+ second timeouts**
- **Simple Docker build:** `docker build -f Dockerfile.simple -t phonics-simple .` (works reliably)

## Common Tasks and Workflows

### Adding New Letters/Content
1. Update `js/main.js` - modify `handleLetterClick` method
2. Add corresponding audio files to `Assets/sounds/voices/`
3. Add image files to `Assets/images/`
4. Test with web server: `python3 -m http.server 8000`
5. Validate complete gameplay flow manually

### Audio System Changes
1. Modify `js/audio-manager.js` for audio logic
2. Test with `Tests/audio-test.html`
3. Verify browser console for audio errors
4. Test across browsers (audio support varies)

### UI/Animation Changes
1. Modify `css/styles.css` for styling
2. Modify `js/main.js` for interactions
3. Test responsive design on different screen sizes
4. Validate animations work smoothly

## Troubleshooting

### Common Issues and Solutions
- **"Game doesn't load":** Check browser console for JavaScript errors, verify all files in correct paths
- **"Audio doesn't play":** Many audio files are .placeholder - real audio files may be missing
- **"Android build fails":** Expected - Android builds are broken, use web version only
- **"Docker build hangs":** Original Dockerfile has network issues with Alpine package manager, use simplified version without package installations
- **"Tests don't work":** Tests are HTML files - access via web server, not direct file opening

### Debug Commands
- `python3 -m http.server 8000 > /dev/null 2>&1 &` - Start web server in background
- `pkill -f "python3 -m http.server"` - Stop all Python web servers  
- `docker ps` - List running containers
- `docker images | grep phonics` - List built images
- Browser Developer Tools (F12) - Check console for JavaScript errors

## File Structure Quick Reference
```
phonics-fun/
├── index.html              # Main game file - START HERE
├── css/styles.css          # All game styling and animations  
├── js/
│   ├── main.js            # Core game logic and state management
│   ├── audio-manager.js   # Audio system with Web Audio API
│   ├── collision-manager.js # Physics-based collision detection
│   └── [other modules]    # Event management, particles, etc.
├── Assets/
│   ├── images/           # Game images (some .placeholder files)
│   └── sounds/           # Audio files (some .placeholder files)
├── Tests/               # Browser-based test suites (HTML files)
├── Docs/               # Extensive project documentation
├── app/                # Android app structure (BROKEN)
├── Dockerfile          # Docker deployment (has network issues)
└── run.bat            # Windows convenience script
```

## Critical Reminders
- **NEVER attempt Android builds** - they are broken and will waste time
- **ALWAYS use 600+ second timeouts** for Docker builds 
- **ALWAYS validate changes** by running complete game scenarios manually
- **Test audio functionality** explicitly - many audio files are placeholders
- **Use Python web server** for fastest/most reliable local development
- **Check browser console** for JavaScript errors when debugging issues