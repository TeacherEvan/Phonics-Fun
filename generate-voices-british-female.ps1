# PowerShell script to generate British female voice messages using Windows TTS
Add-Type -AssemblyName System.Speech

# Create SpeechSynthesizer object
$synthesizer = New-Object System.Speech.Synthesis.SpeechSynthesizer

# Configure voice settings
$synthesizer.Rate = -1    # Slightly slower for children
$synthesizer.Volume = 100  # Maximum volume

# Try to select a British female voice
$voices = $synthesizer.GetInstalledVoices()
$britishFemaleVoice = $voices | Where-Object { $_.VoiceInfo.Name -match "Hazel|British|UK" -and $_.VoiceInfo.Name -match "Female|Woman" } | Select-Object -First 1

if ($britishFemaleVoice) {
    $synthesizer.SelectVoice($britishFemaleVoice.VoiceInfo.Name)
    Write-Host "Using voice: $($britishFemaleVoice.VoiceInfo.Name)"
} else {
    # Fallback to any available female voice
    $femaleVoice = $voices | Where-Object { $_.VoiceInfo.Name -match "Female|Woman" } | Select-Object -First 1
    if ($femaleVoice) {
        $synthesizer.SelectVoice($femaleVoice.VoiceInfo.Name)
        Write-Host "Using fallback female voice: $($femaleVoice.VoiceInfo.Name)"
    } else {
        Write-Host "Using default voice (British female voice not found)"
    }
}

# Ensure output directory exists
$outputDir = "assets\sounds\voices\british-female"
if (!(Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir -Force
}

# Generate voice messages
$words = @("grape", "goat", "gold", "girl", "grandpa")

foreach ($word in $words) {
    $text = "G is for $word!"
    $filename = "assets\sounds\voices\british-female\voice-$word.wav"
    
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

Write-Host "All British female voice messages generated successfully!"
Write-Host "Files saved to: assets\sounds\voices\british-female\"
