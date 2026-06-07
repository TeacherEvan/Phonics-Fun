#!/usr/bin/env bash
set -euo pipefail

DEST=/home/ewaldt/Documents/VS/GAMES/Phonics-Fun/Assets/sounds/phonics-audio
mkdir -p "$DEST"

# exact curl recipe list: grouped by asset family

# A-SET voices (american-male)
curl -L "https://soundbible.com/airplane-landing_daniel_simion.mp3" \
  -o "$DEST/voice-airplane.wav"
curl -L "<SOURCE_URL>/voice-ant.mp3" \
  -o "$DEST/voice-ant.wav"
curl -L "<SOURCE_URL>/voice-apple.mp3" \
  -o "$DEST/voice-apple.wav"
curl -L "<SOURCE_URL>/voice-alligator.mp3" \
  -o "$DEST/voice-alligator.wav"
curl -L "<SOURCE_URL>/voice-arrow.mp3" \
  -o "$DEST/voice-arrow.wav"

# B-SET voices (american-male)
curl -L "<SOURCE_URL>/voice-ball.mp3" \
  -o "$DEST/voice-ball.wav"
curl -L "<SOURCE_URL>/voice-bat.mp3" \
  -o "$DEST/voice-bat.wav"
curl -L "<SOURCE_URL>/voice-bear.mp3" \
  -o "$DEST/voice-bear.wav"
curl -L "<SOURCE_URL>/voice-bird.mp3" \
  -o "$DEST/voice-bird.wav"
curl -L "https://soundbible.com/service-bell_daniel_simion.mp3" \
  -o "$DEST/voice-boat.wav"
curl -L "<SOURCE_URL>/voice-butterfly.mp3" \
  -o "$DEST/voice-butterfly.wav"

# MISC voices (american-male)
curl -L "<SOURCE_URL>/voice-number.mp3" \
  -o "$DEST/voice-number.wav"
curl -L "<SOURCE_URL>/voice-percent.mp3" \
  -o "$DEST/voice-percent.wav"
curl -L "<SOURCE_URL>/voice-percentage.mp3" \
  -o "$DEST/voice-percentage.wav"
curl -L "<SOURCE_URL>/voice-pound.mp3" \
  -o "$DEST/voice-pound.wav"
curl -L "<SOURCE_URL>/voice-hashtag.mp3" \
  -o "$DEST/voice-hashtag.wav"
curl -L "<SOURCE_URL>/voice-dollar.mp3" \
  -o "$DEST/voice-dollar.wav"
curl -L "<SOURCE_URL>/voice-money.mp3" \
  -o "$DEST/voice-money.wav"
curl -L "<SOURCE_URL>/voice-cash.mp3" \
  -o "$DEST/voice-cash.wav"

# PHONEMES (a-z)
for f in a b c d e f h i j k l m n o p q r s t u v w x y z; do
  echo "curl -L '<SOURCE_URL>/phoneme-${f}.mp3' -o '$DEST/phoneme-${f}.wav'"
done
