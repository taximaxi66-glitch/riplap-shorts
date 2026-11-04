#!/bin/bash
# Usage: bash build.sh episodes/partN-slug   -> voice+timing, cues, mix, 4-chunk render, final mp4 in <ep>/renders/final.mp4
set -e
EP=$(realpath "$1"); PY=$HOME/.faceless-shorts/venv/bin/python; cd "$EP"; mkdir -p data renders review
step=${2:-all}
if [ "$step" = all ] || [ "$step" = voice ]; then $PY voice.py . ; fi
node render.mjs cues x
$PY mix.py && ffmpeg -v error -y -i data/mix_raw.wav -af loudnorm=I=-14:TP=-1.5:LRA=11 -ar 44100 data/mix.wav
[ "$step" = audio ] && exit 0
D=$(python3 -c "import json;print(json.load(open('data/timing.json'))['duration'])")
Q=$(python3 -c "d=$D;q=round(d/4*30)/30;print(' '.join(f'{round(i*q,4)}' for i in range(4)), d)")
set -- $Q
( node render.mjs video renders/p0.mp4 $1 $2 & node render.mjs video renders/p1.mp4 $2 $3 & node render.mjs video renders/p2.mp4 $3 $4 & node render.mjs video renders/p3.mp4 $4 $5 & wait )
printf "file p0.mp4\nfile p1.mp4\nfile p2.mp4\nfile p3.mp4\n" > renders/list.txt
ffmpeg -v error -y -f concat -i renders/list.txt -c copy renders/video.mp4
ffmpeg -v error -y -i renders/video.mp4 -i data/mix.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart renders/final.mp4
ffmpeg -v error -y -i renders/final.mp4 -vf "fps=2,scale=216:384,tile=8x16" -frames:v 1 review/final_sheet.jpg
ffprobe -v error -show_entries format=duration,size -of compact renders/final.mp4
echo BUILD OK
