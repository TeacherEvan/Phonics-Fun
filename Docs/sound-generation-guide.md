# Sound Generation Guide for Phonics Fun

## 🎵 Audio Generation Tools & Libraries

### 1. Browser-Based Solutions (Recommended)

#### Web Audio API
- **Built into all modern browsers**
- **Free and no dependencies**
- Can generate sounds programmatically
- Example: Create explosion sounds, phoneme sounds, celebration music

```javascript
// Example: Generate explosion sound
function generateExplosionSound() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const duration = 1.0;
    const sampleRate = audioContext.sampleRate;
    const buffer = audioContext.createBuffer(1, duration * sampleRate, sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < buffer.length; i++) {
        const t = i / sampleRate;
        const envelope = Math.exp(-t * 5);
        const noise = (Math.random() - 0.5) * 2;
        data[i] = noise * envelope * 0.3;
    }
    
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    source.start();
}
```

#### SpeechSynthesis API
- **Built into browsers**
- **Perfect for "G is for Grape!" messages**
- Female voice options available
- No external dependencies

```javascript
// Example: Generate voice message
function generateVoiceMessage(word) {
    const utterance = new SpeechSynthesisUtterance(`G is for ${word}!`);
    utterance.rate = 0.8;
    utterance.pitch = 1.2;
    utterance.voice = speechSynthesis.getVoices().find(voice => 
        voice.name.includes('female') || voice.name.includes('Female')
    );
    speechSynthesis.speak(utterance);
}
```

### 2. Open Source Command Line Tools

#### eSpeak (Recommended)
- **Free and open source**
- **Excellent for phoneme generation**
- Cross-platform (Windows, Mac, Linux)
- Can export to WAV files

```bash
# Install eSpeak
# Windows: Download from http://espeak.sourceforge.net/
# Mac: brew install espeak
# Linux: sudo apt-get install espeak

# Generate phoneme sounds
espeak -s 120 -p 50 -a 100 "[[g]]" -w phoneme-g.wav
espeak -s 100 -p 70 -a 100 "G is for grape!" -w voice-grape.wav
espeak -s 100 -p 70 -a 100 "G is for goat!" -w voice-goat.wav
espeak -s 100 -p 70 -a 100 "G is for gold!" -w voice-gold.wav
espeak -s 100 -p 70 -a 100 "G is for girl!" -w voice-girl.wav
espeak -s 100 -p 70 -a 100 "G is for grandpa!" -w voice-grandpa.wav
```

#### Festival Speech Synthesis
- **Free and open source**
- **High quality TTS**
- Good for educational use

```bash
# Install Festival
# Ubuntu/Debian: sudo apt-get install festival
# Mac: brew install festival

# Generate speech
echo "G is for grape!" | festival --tts --output-file grape.wav
```

### 3. JavaScript Audio Libraries

#### Tone.js
- **Free and open source**
- **Excellent for sound effects**
- Musical synthesis capabilities

```javascript
// Install: npm install tone
// Or CDN: <script src="https://unpkg.com/tone@latest/build/Tone.js"></script>

// Generate explosion sound
const noise = new Tone.Noise("pink").toDestination();
const envelope = new Tone.Envelope({
    attack: 0.05,
    decay: 0.4,
    sustain: 0,
    release: 0.1
});
envelope.connect(noise.volume);
noise.start();
envelope.triggerAttackRelease(0.5);
```

#### Howler.js
- **Free and open source**
- **Great for managing multiple sounds**
- Cross-browser compatibility

### 4. Online Tools (Free)

#### Voicemaker.in
- **Free tier available**
- **High quality voices**
- Educational use friendly
- Can download as MP3

#### Natural Reader
- **Free tier available**
- **Good for voice messages**
- Multiple voice options

#### Google Text-to-Speech
- **Free tier available**
- **High quality**
- API integration possible

### 5. Audio Editing Tools

#### Audacity
- **Free and open source**
- **Perfect for editing generated sounds**
- Can adjust pitch, tempo, add effects
- Export to multiple formats

#### GarageBand (Mac)
- **Free on Mac**
- **Great for sound effects**
- Built-in loops and instruments

## 📋 Implementation Strategy

### Phase 1: Quick Implementation (Browser-based)
1. Use Web Audio API for sound effects
2. Use SpeechSynthesis API for voice messages
3. No external dependencies needed

### Phase 2: Enhanced Quality (Command-line tools)
1. Install eSpeak for phoneme generation
2. Use Audacity for post-processing
3. Convert to web-compatible formats

### Phase 3: Professional Quality (If needed)
1. Use online TTS services for voice messages
2. Professional sound effect libraries
3. Audio editing for perfect timing

## 🎯 Specific Sounds Needed

### Sound Effects
1. **Explosion**: Web Audio API noise generation
2. **Phoneme G**: eSpeak with phoneme syntax
3. **Celebration**: Tone.js musical sequence

### Voice Messages
1. **"G is for Grape!"**: SpeechSynthesis API or eSpeak
2. **"G is for Goat!"**: SpeechSynthesis API or eSpeak
3. **"G is for Gold!"**: SpeechSynthesis API or eSpeak
4. **"G is for Girl!"**: SpeechSynthesis API or eSpeak
5. **"G is for Grandpa!"**: SpeechSynthesis API or eSpeak

## 🔧 Implementation Code

### Enhanced Asset Generator (Already created)
The `Tests/asset-generator.html` file already includes:
- Web Audio API sound generation
- SpeechSynthesis API voice generation
- Real-time preview and testing

### Recommended Workflow
1. Open `Tests/asset-generator.html`
2. Generate sounds using browser APIs
3. For better quality, use eSpeak command line
4. Edit in Audacity if needed
5. Convert to MP3 and OGG formats
6. Place in `assets/sounds/` directory

## 📖 Resources

### Documentation
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [SpeechSynthesis API](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis)
- [eSpeak Documentation](http://espeak.sourceforge.net/commands.html)
- [Tone.js Documentation](https://tonejs.github.io/)

### Educational Use Guidelines
- All mentioned tools are free for educational use
- No commercial licensing required
- Open source alternatives available
- Browser-based solutions require no installation

## 🎵 Quick Start Commands

```bash
# Install eSpeak (Windows - download installer)
# Generate all needed sounds
espeak -s 120 -p 50 "[[g]]" -w assets/sounds/phoneme-g.wav
espeak -s 100 -p 70 "G is for grape!" -w assets/sounds/voice-grape.wav
espeak -s 100 -p 70 "G is for goat!" -w assets/sounds/voice-goat.wav
espeak -s 100 -p 70 "G is for gold!" -w assets/sounds/voice-gold.wav
espeak -s 100 -p 70 "G is for girl!" -w assets/sounds/voice-girl.wav
espeak -s 100 -p 70 "G is for grandpa!" -w assets/sounds/voice-grandpa.wav

# Convert to MP3 (requires ffmpeg)
ffmpeg -i assets/sounds/phoneme-g.wav assets/sounds/phoneme-g.mp3
# ... repeat for other files
```

This guide provides multiple free, open-source options for generating all the audio needed for the Phonics Fun game!
