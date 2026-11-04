#!/bin/bash
# One-time per session: Python env with Kokoro voice + librosa, Kokoro model files, checks node/ffmpeg/playwright.
set -e
FH=$HOME/.faceless-shorts; VENV=$FH/venv; mkdir -p $FH/kokoro
command -v ffmpeg >/dev/null || { echo "ffmpeg missing"; exit 1; }
node -e "require('playwright')" 2>/dev/null || (cd /home/claude && node -e "require('playwright')") || { echo "playwright missing"; exit 1; }
if [ ! -x $VENV/bin/python ]; then uv venv -q --python 3.11 $VENV || python3 -m venv $VENV; fi
$VENV/bin/python -c "import kokoro_onnx, librosa, scipy" 2>/dev/null || uv pip install -q --python $VENV/bin/python numpy scipy kokoro-onnx librosa
for f in kokoro-v1.0.onnx voices-v1.0.bin; do
  [ -s $FH/kokoro/$f ] || curl -sSL -o $FH/kokoro/$f https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/$f
done
$VENV/bin/python -c "import kokoro_onnx, librosa, scipy; print('python ok')"
echo "SETUP OK"
