# Daily run: make the next episode and publish it on YouTube (no human in the loop)

You run unattended every morning. Nobody will answer questions. Make the best decisions yourself, finish, and report.
Read `RULES.md` fully first. `episodes.json` lists every episode so far (creatures, settings, YouTube ids).

## 0. Setup (≈2 min)
- Repo is cloned at `/home/claude/riplap-shorts` (attach it with add_repo, owner `taximaxi66-glitch`, repo `riplap-shorts`, access `push`, if it is not).
- `bash setup.sh` must print `SETUP OK` (Kokoro voice, librosa, playwright, ffmpeg).
- Facts about this environment (all verified): huggingface / Whisper downloads are blocked (word timing is done by `voice.py` with DTW alignment instead, it is accurate); temp file hosts (litterbox, uguu, catbox) are blocked; GitHub releases and branch deletion are blocked; **force-push to a branch works** and raw.githubusercontent.com URLs are fetchable by Zapier.

## 1. Plan the episode
- First look at `reference/part3_sheet.jpg` and 4-6 `reference/part3_*.jpg` frames: this is the target look (see RULES.md).
- N = highest part in episodes.json + 1.
- Invent a new original creature (SCP-096-like deformed humanoid; NEW body shape, see RULES.md "Lessons") and follow the new story structure in RULES.md "Story": universal home-alone start (bed, phone, night) → mysterious sound → you check, POV → slow reveal (eyes high on the door frame...) → it comes closer → you run → **two options, what do you do?** → comment CTA. Vary the home situation between episodes (bedroom, kitchen, bathroom, hallway, front door, basement stairs, living room TV...).
- Write the narration (≈100-140 words → 40-55 s) in `script.json` lines with per-line `speed` (0.85-1.08) and `gap` (pauses before scary beats). Line 1 = the everyday hook (e.g. "You're home alone, lying in bed... when something falls over downstairs."). Include "How do you survive... the <Name>?" early (by ~5 s). Near the end: "You have two options: ... or ... What do you do?". Last line = comment + follow CTA with "part <N+1>".
- Read RULES.md "Lessons from Parts 3-6" before planning shots, and plan around close/POV shots instead of flat side views.

## 2. Build the episode
- `cp -r engine episodes/part<N>-<slug>` and work there. The engine = Part 3's code:
  `src/lib.js` math/timing helpers (LN, WD, WDW word times) · `src/world.js` foggy perspective world (sky, moon, clouds, bats/birds, trees, road, fog, rays, particles, rain, car) · `src/chars.js` jointed rig (`drawRig` with yaw, `walkPose`, STRETCHER/HUMAN proportions, big face close-ups) · `src/scenes.js` composed sets (roadScene, windshieldPOV, carSide, sideForest) · `src/ui.js` captions, chips, RULE card, big X, checklist, spinner portraits · `src/shots.js` the timeline (shots with fades + `cue(t, sound)` calls) · `mix.py` all sound effects + music · `voice.py` narration + word timing · `render.mjs` frames/sheet/video.
- Replace the creature: new rig proportions + new head/face drawing functions in chars.js. Do NOT build a character-select spinner (removed by the owner); delete the spinner shot from shots.js.
- Build new sets in scenes.js/world.js for the new setting with the same care (detailed props, living background, fog, light). Reuse pieces where they fit.
- Rewrite shots.js for the new story. Keep: a shocking first frame in the home setting, continuous camera moves, fades, cues for every visible event, captions, two option cards (A/B) + comment/follow CTA block. No RULE-card/what-if/red-X/checklist structure any more.
- Add any new sound effect to mix.py (`s_<name>`), and set its level in VOL.
- Run the voice first (`$HOME/.faceless-shorts/venv/bin/python voice.py .` inside the episode folder) so `data/timing.json` exists, then write shots against the real word times.

## 3. QA (never skip; max ~3 rounds)
- `node render.mjs frames review/f "t1,t2,..."` for single frames; `node render.mjs sheet review/all.jpg 0.5` for a sheet of the whole video. LOOK at them (Read the jpg).
- Compare with `reference/part3_sheet.jpg`: same look and quality level, or better.
- Check every frame: makes sense with the narration at that moment; creature clearly visible and scary; nothing collides with captions; all text inside the frame; no blank/washed-out frames; proportions right; nothing flickers; the very first frame already shows the everyday scene with something wrong in it (no spinner/menu).
- Motion check: look at 5-fps frame strips of every shot where something moves or touches something (walks, grabs, climbs): feet planted, hands really holding, no floating, no pose snaps (see RULES.md "Lessons"). Pitfalls hit before: fog too heavy/grey (keep the night palette dark with contrast); headlight glow too strong when the camera is near the car; creatures hidden behind the car or dissolved in bright dawn fog (use `fogMul`); shots overlapping because a long fade starts too early; scratch() canvases rotate (max 4 in use at once).

## 4. Render
- `bash build.sh episodes/part<N>-<slug>` (≈5-6 min). Prints `BUILD OK`, final file `renders/final.mp4`. Look at `review/final_sheet.jpg` once more.

## 5. Publish
- `bash push_video.sh episodes/part<N>-<slug>/renders/final.mp4 part<N>.mp4` → must show `HTTP/2 200` and the content-length; it prints `URL=...`.
- Zapier YouTube (`YouTubeV4CLIAPI`, default connection = RipLab): `inspect_zapier_actions` tool_name `youtube_upload_video`, then `execute_zapier_write_action` action `upload_video` with:
  `video` = the URL, `title` = situation + question (≤ 70 chars), e.g. "Home alone and something is on the ceiling… what do you do? 😨 Part N", `description` = 2-sentence teaser + the two options as a question ("Under the bed or out the window? Comment!") + "Follow for Part N+1!" + "\n\n#shorts #horror #scary #survival #creepy #scarystories #animation", `tags` 6-8, `category_id` "24", `privacy_status` "public", `made_for_kids` "false", `embeddable` "true", `notify_subscribers` "true", `default_language` "en", `default_audio_language` "en", `license` "youtube".
- Then `bash push_video.sh --clear`.

## 6. Keep the video, record + report
- **NEVER delete the finished video** (owner's explicit instruction: he also uploads every episode to TikTok). Copy `renders/final.mp4` to `videos/part<N>-<slug>.mp4` in the repo and commit it. Also send it to the owner with SendUserFile (display "attach") so he can download it right away.
- Then delete only the intermediate files: `renders/` (after the copy above), `review/`, `data/*.wav` from the episode folder (keep source + data/timing.json + data/cues.json). Append the episode to episodes.json (part, title, monster, setting, date, youtube id, source, video file). Commit to main and push (`git fetch origin main && git rebase origin/main` first if needed).
- Send the owner one short message in German (SendUserMessage): title, YouTube link `https://www.youtube.com/watch?v=<id>`, one line about the creature.
- If something failed so the video is not good enough or could not be uploaded: do NOT upload a broken video. Report in German what happened.
