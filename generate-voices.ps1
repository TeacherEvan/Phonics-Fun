# PowerShell script to generate voice messages using Windows TTS
Add-Type -AssemblyName System.Speech

# Create SpeechSynthesizer object
$synthesizer = New-Object System.Speech.Synthesis.SpeechSynthesizer

# Configure voice settings
$synthesizer.Rate = -1    # Slightly slower for children
$synthesizer.Volume = 100  # Maximum volume

# Try to select a female voice
$voices = $synthesizer.GetInstalledVoices()
$femaleVoice = $voices | Where-Object { $_.VoiceInfo.Name -match "Zira|Female|Woman" } | Select-Object -First 1

if ($femaleVoice) {
    $synthesizer.SelectVoice($femaleVoice.VoiceInfo.Name)
    Write-Host "Using voice: $($femaleVoice.VoiceInfo.Name)"
} else {
    Write-Host "Using default voice"
}

# Ensure output directory exists
$outputDir = "assets\sounds"
if (!(Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir -Force
}

# Generate voice messages
$words = @("grape", "goat", "gold", "girl", "grandpa")

foreach ($word in $words) {
    $text = "G is for $word!"
    $filename = "assets\sounds\voice-$word.wav"
    
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

Write-Host "All voice messages generated successfully!"
Write-Host "Files saved to: assets\sounds\"
