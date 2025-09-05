# Phonics Fun - GitHub Copilot Instructions

Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.

## Project Overview
Phonics Fun is a multi-platform educational game teaching children phonics through interactive gameplay. It consists of:
- **Primary**: HTML5/CSS/JavaScript web application (fully functional)
- **Secondary**: Android native application (requires Android SDK)
- **Tools**: PowerShell scripts for audio generation, HTML-based test suites

## Working Effectively

### Web Application (Primary Platform)
Bootstrap and run the web application:
- `cd .`
- **Python HTTP Server**: `python3 -m http.server 8000` -- starts instantly. NEVER CANCEL.
- **Node.js HTTP Server**: `npm install http-server --no-save` (takes 7 seconds), then `npx http-server -p 8000`
- **Direct Browser**: Open `index.html` directly in browser (works but limited functionality)

### Docker Deployment (Recommended for Production)
- **WORKING**: Use simplified Dockerfile (original fails due to network timeouts)
- Create simplified Dockerfile:
```dockerfile
FROM nginx:alpine
WORKDIR /usr/share/nginx/html
COPY . .
RUN rm -f Dockerfile* README.md run.bat && rm -rf .git .snapshots .gradle .idea
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```
- `docker build -t phonics-fun .` -- takes ~1 second. NEVER CANCEL.
- `docker run -d -p 8080:80 --name phonics-fun phonics-fun` -- starts instantly
- Access via `http://localhost:8080`

### Android Application (Limited - Requires SDK)
- **DOES NOT WORK** without Android SDK installation
- Has Gradle build files but requires: Android SDK 34, minimum SDK 21
- `gradle build` fails with: "Plugin [id: 'com.android.application'] was not found"
- **DO NOT** attempt Android builds unless Android SDK is explicitly installed

## Validation

### ALWAYS validate web application functionality:
1. **Start HTTP server**: `python3 -m http.server 8000`
2. **Test accessibility**: `curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/index.html` (should return 200)
3. **Manual verification**: Open `http://localhost:8000` in browser
4. **Expected behavior**: Welcome screen loads with "Teacher Evan's Fun with phonics!" title and "Start Game" button
5. **Visual verification**: Blue starry background with animated welcome text

### Test Suites (Browser-based)
- **Access via HTTP server**: `http://localhost:8000/Tests/test-suite.html`
- **Available tests**: test-suite.html, audio-test.html, sound-test.html, asset-generator.html
- **All work** when served via HTTP (do not open directly in browser)

### Docker Validation
- **Build test**: `docker build -t test-build .` (should complete in ~1 second)
- **Run test**: `docker run -d -p 8081:80 --name test-container test-build`
- **Access test**: `curl -s -o /dev/null -w "%{http_code}" http://localhost:8081/` (should return 200)
- **Cleanup**: `docker stop test-container && docker rm test-container`

## Build Times and Timeouts

### NEVER CANCEL these operations:
- **Docker build**: Typically 1 second, set timeout to 60+ seconds minimum
- **npm install**: Typically 7 seconds, set timeout to 30+ seconds minimum  
- **Python server startup**: Instant, but allow 10+ seconds for stability
- **Gradle attempts**: Will fail in 10-15 seconds due to missing SDK (expected)

### Expected Timing:
- Web server startup: Instant
- Docker build (simplified): 1 second
- npm install http-server: 7 seconds
- File serving: Instant response

## Known Issues and Limitations

### Asset Limitations
- **Audio files**: Placeholder files only (voice-*.mp3, sounds are missing)
- **Images**: Placeholder files only (*.png.placeholder in Assets/images/)
- **JavaScript modules**: Some ES6 import statements cause console errors (non-breaking)
- **Game functionality**: Welcome screen works, deeper game levels may be limited by missing assets

### Platform Limitations
- **PowerShell scripts**: Require Windows TTS (System.Speech.Synthesis) - will fail on Linux/macOS
- **Android build**: Requires Android SDK installation - document as "not available" if SDK missing
- **Original Dockerfile**: Network timeout issues with Alpine packages - use simplified version

### Development Environment Requirements
- **Python 3**: Required for HTTP server (usually pre-installed)
- **Node.js**: Optional but recommended (install if needed)
- **Docker**: Required for containerized deployment
- **Java 17+**: Available but Android SDK still required for Android builds

## Common Tasks

### Quick Start (Copy-Paste Commands)
```bash
# Start web development server
cd /path/to/project
python3 -m http.server 8000
# Open http://localhost:8000 in browser
```

### Production Deployment
```bash
# Create simplified Dockerfile first (see above), then:
docker build -t phonics-fun .
docker run -d -p 80:80 --name phonics-fun-prod phonics-fun
```

### Testing Workflow
```bash
# Test web app
python3 -m http.server 8001 &
curl http://localhost:8001/index.html
curl http://localhost:8001/Tests/test-suite.html
kill %1

# Test Docker
docker build -t phonics-test .
docker run -d -p 8002:80 --name test phonics-test
curl http://localhost:8002/
docker stop test && docker rm test
```

## File Structure Reference
```
/
├── index.html              # Main web application entry point
├── css/styles.css          # Game styles and animations  
├── js/                     # JavaScript modules (main.js, audio-manager.js, etc.)
├── Assets/                 # Images and sounds (placeholder files)
├── Tests/                  # HTML test suites
├── app/                    # Android application source
├── build.gradle            # Android build configuration
├── Dockerfile              # Container configuration (needs simplification)
├── *.ps1                   # PowerShell scripts (Windows-only)
└── README.md               # Project documentation
```

## Troubleshooting

### Web App Issues
- **404 errors for assets**: Normal due to placeholder files - core app still functions
- **ES6 import errors**: Normal - do not break functionality  
- **Server not starting**: Check port availability, try different port

### Docker Issues  
- **Build timeouts**: Use simplified Dockerfile instead of original
- **Network errors**: Skip package installations in Dockerfile
- **Container access**: Ensure correct port mapping (-p host:container)

### Android Issues
- **Gradle plugin errors**: Expected without Android SDK - document limitation
- **Build failures**: Do not attempt fixes without SDK installation confirmation

## Emergency Recovery
If anything breaks during development:
```bash
# Reset to clean state
docker stop $(docker ps -q) 2>/dev/null || true
docker rm $(docker ps -aq) 2>/dev/null || true
pkill -f "python.*http.server" || true
cd .
python3 -m http.server 8000
```