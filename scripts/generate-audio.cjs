const fs = require('fs');
const path = require('path');

// Create audio files programmatically
class AudioGenerator {
    constructor() {
        this.sampleRate = 44100;
        this.duration = 0.6;
    }
    
    // Generate WAV file header
    generateWavHeader(dataLength) {
        const buffer = Buffer.alloc(44);
        
        // RIFF header
        buffer.write('RIFF', 0, 4);
        buffer.writeUInt32LE(36 + dataLength, 4);
        buffer.write('WAVE', 8, 4);
        
        // fmt chunk
        buffer.write('fmt ', 12, 4);
        buffer.writeUInt32LE(16, 16);
        buffer.writeUInt16LE(1, 20);  // PCM
        buffer.writeUInt16LE(1, 22);  // Mono
        buffer.writeUInt32LE(this.sampleRate, 24);
        buffer.writeUInt32LE(this.sampleRate * 2, 28);
        buffer.writeUInt16LE(2, 32);
        buffer.writeUInt16LE(16, 34);
        
        // data chunk
        buffer.write('data', 36, 4);
        buffer.writeUInt32LE(dataLength, 40);
        
        return buffer;
    }
    
    // Generate G phoneme sound
    generatePhoneme() {
        const samples = Math.floor(this.duration * this.sampleRate);
        const data = Buffer.alloc(samples * 2);
        
        for (let i = 0; i < samples; i++) {
            const t = i / this.sampleRate;
            
            // Envelope
            const attack = Math.min(1, t * 15);
            const decay = Math.max(0, 1 - Math.pow((t - 0.2) / 0.4, 2));
            const envelope = attack * decay;
            
            // G phoneme frequencies
            const fundamental = 120;
            const formant1 = 700;
            const formant2 = 1200;
            
            const fund = Math.sin(2 * Math.PI * fundamental * t);
            const form1 = Math.sin(2 * Math.PI * formant1 * t) * 0.4;
            const form2 = Math.sin(2 * Math.PI * formant2 * t) * 0.2;
            
            const sample = (fund + form1 + form2) * envelope * 0.3;
            const intSample = Math.max(-32768, Math.min(32767, sample * 32767));
            
            data.writeInt16LE(intSample, i * 2);
        }
        
        return data;
    }
    
    // Generate explosion sound
    generateExplosion() {
        const duration = 1.2;
        const samples = Math.floor(duration * this.sampleRate);
        const data = Buffer.alloc(samples * 2);
        
        for (let i = 0; i < samples; i++) {
            const t = i / this.sampleRate;
            const envelope = Math.exp(-t * 4) * (1 - Math.exp(-t * 20));
            
            const noise = (Math.random() - 0.5) * 2;
            const lowFreq = Math.sin(2 * Math.PI * 60 * t) * 0.3;
            
            const sample = (noise + lowFreq) * envelope * 0.4;
            const intSample = Math.max(-32768, Math.min(32767, sample * 32767));
            
            data.writeInt16LE(intSample, i * 2);
        }
        
        return data;
    }
    
    // Generate celebration sound
    generateCelebration() {
        const duration = 2.5;
        const samples = Math.floor(duration * this.sampleRate);
        const data = Buffer.alloc(samples * 2);
        
        const notes = [262, 294, 330, 349, 392, 440, 494, 523];
        
        for (let i = 0; i < samples; i++) {
            const t = i / this.sampleRate;
            const noteIndex = Math.floor(t * 4) % notes.length;
            const frequency = notes[noteIndex];
            
            const envelope = Math.exp(-t * 0.5) * Math.sin(t * Math.PI * 2);
            const harmonic1 = Math.sin(2 * Math.PI * frequency * t);
            const harmonic2 = Math.sin(2 * Math.PI * frequency * 2 * t) * 0.3;
            
            const sample = (harmonic1 + harmonic2) * envelope * 0.25;
            const intSample = Math.max(-32768, Math.min(32767, sample * 32767));
            
            data.writeInt16LE(intSample, i * 2);
        }
        
        return data;
    }
    
    // Save audio file
    saveAudioFile(filename, audioData) {
        const header = this.generateWavHeader(audioData.length);
        const fullPath = path.join(__dirname, 'assets', 'sounds', filename);
        
        // Ensure directory exists
        const dir = path.dirname(fullPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        const fullData = Buffer.concat([header, audioData]);
        fs.writeFileSync(fullPath, fullData);
        console.log(`Generated: ${filename}`);
    }
    
    // Generate all audio files
    generateAll() {
        console.log('Generating audio files...');
        
        // Generate phoneme
        const phonemeData = this.generatePhoneme();
        this.saveAudioFile('phoneme-g.wav', phonemeData);
        
        // Generate explosion
        const explosionData = this.generateExplosion();
        this.saveAudioFile('explosion.wav', explosionData);
        
        // Generate celebration
        const celebrationData = this.generateCelebration();
        this.saveAudioFile('celebration.wav', celebrationData);
        
        console.log('Audio generation complete!');
        console.log('Note: Voice messages need to be generated separately using TTS');
    }
}

// Run the generator
const generator = new AudioGenerator();
generator.generateAll();
