# PowerShell script to generate American male voice messages using Windows TTS
Add-Type -AssemblyName System.Speech

# Create SpeechSynthesizer object
$synthesizer = New-Object System.Speech.Synthesis.SpeechSynthesizer

# Configure voice settings
$synthesizer.Rate = -1    # Slightly slower for children
$synthesizer.Volume = 100  # Maximum volume

# Try to select a male American voice
$voices = $synthesizer.GetInstalledVoices()
$maleVoice = $voices | Where-Object { $_.VoiceInfo.Name -match "David|Male|Man" } | Select-Object -First 1

if ($maleVoice) {
    $synthesizer.SelectVoice($maleVoice.VoiceInfo.Name)
    Write-Host "Using voice: $($maleVoice.VoiceInfo.Name)"
} else {
    Write-Host "Using default voice (male voice not found)"
}

# Ensure output directory exists
$outputDir = "assets\sounds\voices\american-male"
if (!(Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir -Force
}

# Generate voice messages
$words = @("grape", "goat", "gold", "girl", "grandpa")

foreach ($word in $words) {
    $text = "G is for $word!"
    $filename = "assets\sounds\voices\american-male\voice-$word.wav"
    
    Write-Host "Generating: $text -> $filename"
    
    # Set output to file
    $synthesizer.SetOutputToWaveFile($filename)
    
    # Speak the text
    $synthesizer.Speak($text)
    
    Write-Host "Generated: voice-$word.wav"
}

# Cleanup
$synthesizer.SetOutputToDefaultAudioDevice()
$synthesizer.Dispose()

Write-Host "All American male voice messages generated successfully!"
Write-Host "Files saved to: assets\sounds\voices\american-male\"
