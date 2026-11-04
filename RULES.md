# RipLab horror shorts: the rules (from the channel owner)

Series: **"How do you survive this horror character? Part N"**. English narration and captions, vertical 1080x1920, 30 fps, 45-58 s.
Channel: YouTube **RipLab (@rip_lab)**.

## THE reference: Part 3 (owner: "the best result so far")
Every new episode must look, move and sound like **Part 3 – The Pale Stretcher** (`episodes/part3-pale-stretcher`, on YouTube: K4FWNMG-KQo). Same visual style, same quality, same pacing; only the creature, the setting and the story are new.
- Before building, open and look at `reference/part3_sheet.jpg` (a frame every 0.5 s of the whole video) and several `reference/part3_*.jpg` key frames (the number = second).
- Match: dark night palette with cold blue fog and contrast; moon/clouds/bats/particles alive; 2.5D perspective world with comic ink outlines; the creature large and clearly readable; continuous camera moves that flow into each other; character-select spinner; yellow RULE card; grey what-if scenes with a big red X; green "HERE'S WHAT WORKS" checklist; close-up scare of the creature's face against glass/in darkness; calm dawn resolution; CTA block (WOULD YOU HAVE SURVIVED? + heart + FOLLOW + PART N SOON); same caption style; same music bed and sound density.
- After your QA sheet is rendered, compare it side by side with `reference/part3_sheet.jpg`. If yours looks flatter, greyer, emptier, less detailed or less scary, fix it before rendering.

## Story
- A real, gripping story told to "you", with concrete scenarios and options, not a list of facts. The viewer should feel fear and root for the survivor.
- Shape that works (Part 3): fast hook → where you are and what goes wrong → the creature appears (show it a lot) → its rule(s) on a RULE card → 2 wrong options shown as grey "what-if" scenes, each ending in a big red X → "Here's what works" with a green checklist synced to the words → the scariest close call (creature right next to you) → how you survive → CTA.
- Darker / more brutal is fine, but no gore close-ups. Show the creature MUCH.
- Every episode gets a **new, original** creature in the disturbing SCP-096 style: human-like but completely deformed (stretched limbs, wrong proportions, gaping mouth, blank eyes, twitching). Never reuse an old one; never use a known franchise character (no SCP-096 itself, Slenderman, Siren Head, etc.). Vary the setting too (see episodes.json for what was done).
- Give the creature one clear, learnable weakness/rule so the survival advice is logical.
- Call to action every time: ask to like and follow, smartly tied to the story (e.g. "Would you have survived? Follow, because part five is coming for you."), with a heart + "+ FOLLOW" button + "PART N+1 SOON" pop-ups.

## Look (3D comic look, build on the Part 3 test scene look)
- 2.5D perspective world with depth + flat comic shading and ink outlines. Dark, cold, cinematic. Single warm light sources.
- Every scene alive: drifting clouds, bats/birds, falling leaves, particles, swaying trees, rain with dark clouds when it fits, light rays, soft vignette, light volumetric fog that stays pleasant to look at. Never a static sky.
- Take time for every graphic: detailed props (not two circles and a line), small background details.
- Realistic proportions: people vs doors/cars/furniture at natural sizes; hiding places clearly recognizable.
- Characters feel alive; the monster must be genuinely scary; the mood must fit. Slight imperfection is fine, even creepier.
- Cause and effect always visible: things break/fall only when we see the action. Destruction animated with real splinters/shards flying (never a growing black blob).
- Bodies move with weight (walk/run cycles with planted feet, bob, lean), hold objects correctly; never paper cut-outs sliding sideways.
- Never show approach by just scaling a figure up: use perspective (it walks through the 3D world) or camera moves.
- No flicker: no flickering lights, strobing or random dark frames. Light changes are smooth.
- No random automatic zooms; a camera push/zoom only where it means something (a reveal, a scream).
- Transitions flow into each other like a living film (continuous camera moves, dissolves through fog/black, match cuts). Hard cut only on a scare beat. Never PowerPoint-style.
- Hook within 3-4 s: the character-select spinner (portraits of previous creatures + the new one, yellow selector, "PART N" chip) lands in ≤ 2.6 s.

## Text
- Captions: smaller (Inter Black 64 px, white, black stroke), centred around y 1440, 1-3 words per chunk, each word pops exactly when spoken, one red keyword per chunk.
- Every pop-up (RULE card, option chips, checklist, X, CTA) appears on its exact word and stays fully inside the frame (x 60-1020, y 150-1650). Keep clear of the caption zone.

## Sound
- Beautiful creepy ambient music bed (drone + slow minor pads + sparse music-box bells + wind), warmer when the danger is over. Ducked under the voice.
- Lots of sound effects, every one synced to the picture via cue() in shots.js: whooshes on transitions, footsteps on each foot strike, impacts, glass, stings on reveals, heartbeat in the hiding part, pops for text.
- Balanced: voice clearly on top; effects neither too loud nor too quiet; final loudness -14 LUFS.
- Narrator (Kokoro `am_fenrir`) not monotone: slower speed on tense lines, short dramatic pauses (gap) at quiet scary moments so the picture works.
