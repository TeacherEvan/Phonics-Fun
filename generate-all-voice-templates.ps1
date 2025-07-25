# Master PowerShell script to generate all voice templates using Windows TTS
# This script creates all voice templates in the correct directory structure

Write-Host "=== Phonics Fun Voice Template Generator ===" -ForegroundColor Green
Write-Host "Generating all voice templates..." -ForegroundColor Yellow

Add-Type -AssemblyName System.Speech

# Create SpeechSynthesizer object
$synthesizer = New-Object System.Speech.Synthesis.SpeechSynthesizer

# Configure voice settings
$synthesizer.Rate = -1    # Slightly slower for children
$synthesizer.Volume = 100  # Maximum volume

# Get all available voices
$voices = $synthesizer.GetInstalledVoices()
Write-Host "Available voices:" -ForegroundColor Cyan
$voices | ForEach-Object { Write-Host "  - $($_.VoiceInfo.Name)" -ForegroundColor Gray }

# Voice template configurations
$templates = @(
    @{
        id = "american-female"
        name = "American Female"
        voicePattern = "Zira|Female|Woman"
        fallbackPattern = "Female|Woman"
    },
    @{
        id = "american-male"
        name = "American Male"
        voicePattern = "David|Male|Man"
        fallbackPattern = "Male|Man|David"
    },
    @{
        id = "british-female"
        name = "British Female"
        voicePattern = "Hazel|British|UK.*Female"
        fallbackPattern = "Female|Woman"
    },
    @{
        id = "british-male"
        name = "British Male"
        voicePattern = "British|UK.*Male"
        fallbackPattern = "Male|Man|David"
    }
)

# Words to generate
$words = @("grape", "goat", "gold", "girl", "grandpa")

# Generate each template
foreach ($template in $templates) {
    Write-Host "`n--- Generating $($template.name) ---" -ForegroundColor Yellow
    
    # Create directory if it doesn't exist
    $outputDir = "assets\sounds\voices\$($template.id)"
    if (!(Test-Path $outputDir)) {
        New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
    }
    
    # Try to find appropriate voice
    $targetVoice = $voices | Where-Object { $_.VoiceInfo.Name -match $template.voicePattern } | Select-Object -First 1
    
    if (!$targetVoice) {
        # Try fallback pattern
        $targetVoice = $voices | Where-Object { $_.VoiceInfo.Name -match $template.fallbackPattern } | Select-Object -First 1
    }
    
    if ($targetVoice) {
        $synthesizer.SelectVoice($targetVoice.VoiceInfo.Name)
        Write-Host "Using voice: $($targetVoice.VoiceInfo.Name)" -ForegroundColor Green
    } else {
        Write-Host "Using default voice (no matching voice found)" -ForegroundColor Red
    }
    
    # Generate voice files for this template
    foreach ($word in $words) {
        $text = "G is for $word!"
        $filename = "$outputDir\voice-$word.wav"
        
        Write-Host "  Generating: $text -> voice-$word.wav" -ForegroundColor Gray
        
        # Set output to file
        $synthesizer.SetOutputToWaveFile($filename)
        
        # Speak the text
        $synthesizer.Speak($text)
    }
    
    Write-Host "$($template.name) template generated successfully!" -ForegroundColor Green
}

# Cleanup
$synthesizer.SetOutputToDefaultAudioDevice()
$synthesizer.Dispose()

Write-Host "`n=== Voice Template Generation Complete ===" -ForegroundColor Green
Write-Host "All voice templates have been generated successfully!" -ForegroundColor Yellow
Write-Host "Files saved to: assets\sounds\voices\" -ForegroundColor Gray
Write-Host "`nAvailable templates:" -ForegroundColor Cyan
$templates | ForEach-Object { Write-Host "  - $($_.name) (ID: $($_.id))" -ForegroundColor Gray }

Write-Host "`nReady to use in Phonics Fun!" -ForegroundColor Green
