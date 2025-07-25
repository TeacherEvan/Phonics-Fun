const fs = require('fs');
const path = require('path');

class BackgroundMusicGenerator {
    constructor() {
        this.sampleRate = 44100;
        this.duration = 30; // 30 seconds of music that can loop
    }
    
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
    
    generateBackgroundMusic() {
        const samples = Math.floor(this.duration * this.sampleRate);
        const data = Buffer.alloc(samples * 2);
        
        // Simple pleasant chord progression: C-Am-F-G
        const chords = [
            [262, 330, 392], // C major
            [220, 262, 330], // A minor
            [175, 220, 262], // F major
            [196, 247, 294]  // G major
        ];
        
        for (let i = 0; i < samples; i++) {
            const t = i / this.sampleRate;
            const chordIndex = Math.floor((t / 7.5) % chords.length); // Change chord every 7.5 seconds
            const chord = chords[chordIndex];
            
            // Create a gentle, pleasant melody
            const envelope = 0.3 + 0.2 * Math.sin(t * 0.1); // Gentle volume variation
            
            let sample = 0;
            chord.forEach((freq, index) => {
                const amplitude = [0.4, 0.3, 0.2][index]; // Different amplitudes for harmony
                sample += Math.sin(2 * Math.PI * freq * t) * amplitude;
            });
            
            // Add a subtle bass line
            const bassFreq = chord[0] * 0.5; // Octave lower
            sample += Math.sin(2 * Math.PI * bassFreq * t) * 0.2;
            
            sample *= envelope * 0.15; // Keep it soft
            
            const intSample = Math.max(-32768, Math.min(32767, sample * 32767));
            data.writeInt16LE(intSample, i * 2);
        }
        
        return data;
    }
    
    saveAudioFile(filename, audioData) {
        const header = this.generateWavHeader(audioData.length);
        const fullPath = path.join(__dirname, 'assets', 'sounds', filename);
        
        const fullData = Buffer.concat([header, audioData]);
        fs.writeFileSync(fullPath, fullData);
        console.log(`Generated: ${filename}`);
    }
    
    generate() {
        console.log('Generating background music...');
        const musicData = this.generateBackgroundMusic();
        this.saveAudioFile('background-music.wav', musicData);
        console.log('Background music generated successfully!');
    }
}

// Generate the music
const generator = new BackgroundMusicGenerator();
generator.generate();
