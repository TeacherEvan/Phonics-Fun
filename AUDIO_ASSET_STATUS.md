# Audio Asset Status — Phonics Fun

Download islands / validation only; DB logic is intact per the upstream docs.

Validated downloads
- URL `voice-airplane.wav` confirmed reachable and is now at:
  `Assets/sounds/voices/american-male/voice-airplane.wav`

- URL `voice-boat.wav` confirmed reachable and is now at:
  `Assets/sounds/voices/american-male/voice-boat.wav`

Ready-to-run batch downloader
- Script: `download-phonics.sh`
- Scripts fetch manifest: `scripts/find_audio_urls.py`

Placeholder syntax remaining for verification by maintainers
- `<SOURCE_URL>/voice-<word>.mp3`
- `<SOURCE_URL>/phoneme-<letter>.mp3`

Audio conversions applied during staging
- Downloaded `.mp3` → 44.1 kHz mono `.wav` via ffmpeg
- Conversion command pattern:
  `ffmpeg -i input.mp3 -ar 44100 -ac 1 output.wav`

Previous docs superseded by this file
- `AUDIO-GENERATION-COMPLETE.md`
