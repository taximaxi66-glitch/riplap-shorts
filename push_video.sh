#!/bin/bash
# Usage: bash push_video.sh path/to/final.mp4 name.mp4   -> prints the raw URL Zapier can fetch (branch video-drop, force-pushed)
# Usage: bash push_video.sh --clear                     -> overwrite video-drop with a placeholder after the upload
set -e
cd "$(dirname "$0")"; R=taximaxi66-glitch/riplap-shorts; TMP=$(mktemp -d)
git -C "$TMP" init -q -b video-drop
if [ "$1" = "--clear" ]; then echo "no video right now" > "$TMP/PLACEHOLDER"
else mkdir -p "$TMP/v"; cp "$1" "$TMP/v/$2"; fi
git -C "$TMP" add -A && git -C "$TMP" -c user.name=taximaxi66-glitch -c user.email=taximaxi66@gmail.com commit -qm "video drop"
git -C "$TMP" push -qf "https://github.com/$R" video-drop:video-drop
rm -rf "$TMP"
if [ "$1" != "--clear" ]; then
  U="https://raw.githubusercontent.com/$R/video-drop/v/$2"; sleep 3
  curl -sSIL "$U" | grep -iE "^HTTP/2 200|content-length" ; echo "URL=$U"
fi
