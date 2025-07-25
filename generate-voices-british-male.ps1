# PowerShell script to generate British male voice messages using Windows TTS
Add-Type -AssemblyName System.Speech

# Create SpeechSynthesizer object
$synthesizer = New-Object System.Speech.Synthesis.SpeechSynthesizer

# Configure voice settings
$synthesizer.Rate = -1    # Slightly slower for children
$synthesizer.Volume = 100  # Maximum volume

# Try to select a British male voice
$voices = $synthesizer.GetInstalledVoices()
$britishMaleVoice = $voices | Where-Object { $_.VoiceInfo.Name -match "British|UK" -and $_.VoiceInfo.Name -match "Male|Man" } | Select-Object -First 1

if ($britishMaleVoice) {
    $synthesizer.SelectVoice($britishMaleVoice.VoiceInfo.Name)
    Write-Host "Using voice: $($britishMaleVoice.VoiceInfo.Name)"
} else {
    # Fallback to any available male voice
    $maleVoice = $voices | Where-Object { $_.VoiceInfo.Name -match "Male|Man|David" } | Select-Object -First 1
    if ($maleVoice) {
        $synthesizer.SelectVoice($maleVoice.VoiceInfo.Name)
        Write-Host "Using fallback male voice: $($maleVoice.VoiceInfo.Name)"
    } else {
        Write-Host "Using default voice (British male voice not found)"
    }
}

# Ensure output directory exists
$outputDir = "assets\sounds\voices\british-male"
if (!(Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir -Force
}

# Generate voice messages
$words = @("grape", "goat", "gold", "girl", "grandpa")

foreach ($word in $words) {
    $text = "G is for $word!"
    $filename = "assets\sounds\voices\british-male\voice-$word.wav"
    
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

Write-Host "All British male voice messages generated successfully!"
Write-Host "Files saved to: assets\sounds\voices\british-male\"
