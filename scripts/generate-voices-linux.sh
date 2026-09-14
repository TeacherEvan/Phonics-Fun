#!/usr/bin/env bash
# generate-voices-linux.sh
# Linux replacement for generate-voices-*.ps1 (which require Windows System.Speech).
# Uses espeak-ng to synthesize the G-letter voice templates for all 4 voice
# families: american-male, american-female, british-female, british-male.
#
# Output format matches the existing recorded assets: WAV, 16-bit, mono, 22050 Hz.
#
# Usage:  ./scripts/generate-voices-linux.sh [voice-template ...]
#   Defaults to all four templates. Pass a subset to regenerate only those.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VOICE_DIR="${ROOT_DIR}/Assets/sounds/voices"

# G-letter vocabulary (single source of truth: js/main.js PHONICS_FUN_LETTER_DATA.G)
WORDS=("grape" "goat" "gold" "girl" "grandpa")

# espeak-ng parameters — match the .ps1 intent: slightly slower for children, full volume.
SPEED=120
PITCH=50

TEMPLATES=("american-male" "american-female" "british-female" "british-male")
if [[ $# -gt 0 ]]; then
    TEMPLATES=("$@")
fi

for template in "${TEMPLATES[@]}"; do
    dir="${VOICE_DIR}/${template}"
    mkdir -p "${dir}"
    echo "=== Generating ${template} (${#WORDS[@]} words) ==="
    for word in "${WORDS[@]}"; do
        out="${dir}/voice-${word}.wav"
        text="G is for ${word}!"
        echo "  ${text}  ->  ${out}"
        espeak-ng -w "${out}" "${text}" -s "${SPEED}" -p "${PITCH}" -b 1
    done
done

echo ""
echo "=== Done. Voice tree: ==="
find "${VOICE_DIR}" -name '*.wav' -o -name '*.placeholder' | sort
