# RipLab horror shorts: the rules (from the channel owner)

Series: **"How do you survive this horror character? Part N"**. English narration and captions, vertical 1080x1920, 30 fps, 40-55 s.
Channel: YouTube **RipLab (@rip_lab)**.

## THE look reference: Part 3 (owner: "the best result so far")
Every new episode must LOOK and SOUND like **Part 3 – The Pale Stretcher** (`episodes/part3-pale-stretcher`, YouTube K4FWNMG-KQo): same visual style and quality. The STORY STRUCTURE is the new one below (owner, 2026-11-07), not Part 3's.
- Before building, open and look at `reference/part3_sheet.jpg` (a frame every 0.5 s) and several `reference/part3_*.jpg` key frames.
- Keep from the look: dark night palette with cold blue fog and contrast; living particles/light; comic ink outlines; continuous camera moves; close-up scare of the creature's face against glass/in darkness; same caption style; same music bed and sound density.
- Owner's favourite moment ever: the Pale Stretcher's long fingertips slowly tapping on the car window (Part 3). More of these quiet, unpleasant, tense moments in every episode.
- After your QA sheet is rendered, compare it side by side with `reference/part3_sheet.jpg`. If yours looks flatter, greyer, emptier, less detailed or less scary, fix it before rendering.

## Story (new structure, owner 2026-11-07)
- **The story must be gripping enough to go viral.** First second: a hook that makes people stay. Then escalate every few seconds (a new sound, a new detail, it gets closer), never a calm stretch. A clear emotional curve: normal → uneasy → mystery → dread → reveal → panic → the impossible choice. The viewer must feel they are in it and want to comment their choice.
- **Universal starting situation.** Every viewer must recognise it, whatever their age, gender, job or social role. NOT situations only some people know (night-shift lighthouse keeper, filling up the car at midnight, ice fishing: young viewers have never done that). It does NOT always have to be the bedroom; vary between everyday life moments, for example:
  - home alone in the evening, lying in bed scrolling your phone (parents out, siblings away)
  - walking home alone at night (from a friend's place, a party, a visit) through a dark village/street with only a few weak streetlights
  - the midnight snack: going downstairs at 1-2 a.m. for something from the fridge or a bowl of cereal
  - sitting in the kitchen, mom says she's going out with her friends for two hours and leaves... 30 seconds later you hear her voice from the basement, screaming for help
  - more of the same kind: taking out the trash at night, the bathroom mirror, the doorbell late at night, the bus stop, the stairwell, the elevator...
- **Let the picture tell it.** The narrator doesn't have to talk from the first second. An episode may open with only images and sound (set a longer `lead` in script.json, ~3-6 s): e.g. third person, someone walking alone through the dark street, a bit uneasy, looking around... then a cut to their POV: they stop, and far ahead, barely visible under a streetlight, stands a disgusting, thin, human-like but completely deformed figure, about 5 m tall. They turn and run. The narration starts when it adds something. The first frames must still be tense and intriguing (alone, darkness, unease), so nobody swipes.
- **No character-select spinner.** (Part 5 data: 47 % swiped away in the first second because of the calm menu intro.) The very first second already shows the bed/room with something wrong (a sound, a shadow, a message) plus a short on-screen line.
- **Mystery before monster.** E.g. a sound from downstairs or the next room (a voice, something falling over, a cough), or a figure far away under a streetlight. You go and check / you freeze. Make it disturbing and mysterious; don't let the monster simply walk into the picture (that never felt scary). Use your POV: you look into the room, at first glance everything is normal... then two disgusting dark eyes peek around the TOP corner of the door frame, unnaturally high, so it can't be a person (it would have to cling to the ceiling). Then it comes closer, the silhouette becomes clearer as it moves into the light, details appear. You run.
- Keep and build up quiet creepy moments: fingertips tapping on glass, a face pressed against a window, breathing behind a door, a shadow in the gap under the door, a hand curling around the door frame.
- **Open ending with two options (around 30-40 s).** No more "wrong option → red X → here's what works". Instead, at the climax: "You have two options: hide under the bed, or climb out of the window. What do you do?" Two big option cards (A / B). Both must be believable; the story gives just enough clues to argue for either. The point: viewers decide themselves, root for themselves and discuss in the comments.
- **CTA:** ask for the comment ("Under the bed or out the window? Comment!"), plus like + follow (heart + "+ FOLLOW" + "PART N+1 SOON"). The title should also carry the question.
- Title idea (≈ ≤ 70 chars): situation + question, e.g. "You're home alone and something is on the ceiling… what do you do? 😨 Part N".
- Darker / more brutal is fine, but no gore close-ups. Once revealed, show the creature big and detailed.
- Every episode gets a **new, original** creature in the disturbing SCP-096 style: human-like but completely deformed (stretched limbs, wrong proportions, gaping mouth, blank or pitch-black eyes, twitching). New silhouette each time, not just the same stick limbs. Never a known franchise character (no SCP-096, Slenderman, Siren Head, etc.).
- The creature may have one trait/clue (it hunts by sound, it can't fit through small gaps, it hates light...) so the two options are debatable with logic.

## Look (the comic look of Part 3)
- Stay with the Part 3 engine and look (`engine/`). The owner does not want an extra focus on 3D: do NOT switch to a real-3D / three.js engine (`engine3d/`, used once for night01) and do not build scenes around 3D effects. Spend the effort on story, atmosphere and mood instead.
- **Strong depth and a truly living world (owner, 2026-11-07).** Every scene must have a clear depth effect, built with the Part 3 2.5D engine (objects at real x/y/z through `proj`, depth fog, depth-sorted layers): a detailed foreground, a midground and a background, camera moves with parallax, light and fog in depth. The world must feel alive at all times (wind in trees/curtains, drifting fog and particles, birds/bats, moving clouds, rain, small background details that move). Do not use three.js for it.
- **Monster movement must be scary, never boring (owner: in night01 the monster's walk and how monsters simply came into frame was boring, no horror at all).** Never let a creature just walk into frame. Build every appearance as suspense: silence or a sound drop first, then a partial reveal (eyes in the dark, fingers around a door frame, a silhouette that does not belong), then unnatural motion: frozen stillness and a sudden jerk, too-fast head turns, stop-start twitching, crawling on walls/ceiling, limbs bending the wrong way, slowly unfolding to full height. When it walks, it walks heavy with planted feet and weight, never gliding.
- Flat comic shading and ink outlines like Part 3. Dark, cold, cinematic. Single warm light sources.
- Every scene alive: drifting clouds, bats/birds, falling leaves, particles, swaying trees, rain with dark clouds when it fits, light rays, soft vignette, light volumetric fog that stays pleasant to look at. Never a static sky.
- Take time for every graphic: detailed props (not two circles and a line), small background details.
- Realistic proportions: people vs doors/cars/furniture at natural sizes; hiding places clearly recognizable.
- Characters feel alive; the monster must be genuinely scary; the mood must fit. Slight imperfection is fine, even creepier.
- Cause and effect always visible: things break/fall only when we see the action. Destruction animated with real splinters/shards flying (never a growing black blob).
- Bodies move with weight (walk/run cycles with planted feet, bob, lean), hold objects correctly; never paper cut-outs sliding sideways.
- Never show approach by just scaling a figure up: let it really walk through the scene, or use camera moves.
- No flicker: no flickering lights, strobing or random dark frames. Light changes are smooth.
- No random automatic zooms; a camera push/zoom only where it means something (a reveal, a scream).
- Transitions flow into each other like a living film (continuous camera moves, dissolves through fog/black, match cuts). Hard cut only on a scare beat. Never PowerPoint-style.
- Hook in the first second: the home situation with something already wrong in frame (see Story). No spinner, no menu, no title card as the first image. A small "PART N" chip may appear later as an overlay.

## Lessons from Parts 3-6 (self-review, 2026-11-07): what worked, what looked clunky
Worked well (keep): big detailed face close-ups (Part 3/5/6); face pressed against glass with hands and breath (Part 5/6); fingertips tapping on the window (Part 3); perspective establishing shots with one warm light source (gas station, lighthouse beam); the split close-up (creature top, your face with eyes shut bottom); smooth dawn resolution; word-accurate captions.
Looked bad (never again):
- Flat side-view "what-if" scenes: everything in profile on one line, props as flat triangles/cut-outs (Part 6's rock was a grey cone; you were pasted next to it; the creature "popped" on top of it and floated, never touching the rock or the ground).
- Interactions faked by overlap: hands pass through the car and the door just pops off (Part 5); no grip, no pull, no weight. If something is grabbed, the hand must close on a real point of the object (attach the object to the hand joint), the body must lean back and pull, then the object comes loose.
- Floating/sliding feet: legs cycling while the body glides, feet not planted, no contact shadow. Use foot-locking: a planted foot stays at its ground point until it lifts; contact shadow under each foot; body height follows the legs.
- Snap changes: pose/yaw jumping from walk to idle, creatures "teleporting" between poses. Blend every pose change over ≥ 0.3 s.
- Monsters walking into frame in full view, small and in the middle distance: not scary. Reveal in parts (eyes, fingers, silhouette), then close and big.
- All creatures built from the same thin tube limbs: they start to look alike. Give each one a different body shape (hunched mass, bloated torso, dangling skin, too many joints, crawling posture...).
- The survivor rig looks stiff (stick arms, rigid poses, awkward sitting). Prefer close shots of hands/face/POV for the survivor, and give poses some lean, weight shift and breathing.
- Large empty grey ground filling the lower half of wide shots: lower the camera horizon or fill the foreground (furniture, objects, floor detail).

## Text
- Captions: smaller (Inter Black 64 px, white, black stroke), centred around y 1440, 1-3 words per chunk, each word pops exactly when spoken, one red keyword per chunk.
- Every pop-up (RULE card, option chips, checklist, X, CTA) appears on its exact word and stays fully inside the frame (x 60-1020, y 150-1650). Keep clear of the caption zone.

## Sound
- Music must stay **exciting and creepy the whole time** and be **clearly audible**: in Part 3 it was too quiet and unobtrusive next to the voice (owner feedback). The sound effects in Part 3 were good, keep them as they are.
- Music bed = creepy ambient (drone + slow minor pads + sparse music-box bells + wind) PLUS a tension layer (stalking low pulse, dissonant tremolo strings, a riser into every scare). Warmer only when the danger is over, dark again for the teaser at the end.
- Level: music about 6-8 dB under the voice in pauses, only lightly ducked under speech (engine/mix.py: music gain 0.2, duck 0.3). Never let it disappear; never let it cover the voice.
- Lots of sound effects, every one synced to the picture via cue() in shots.js: whooshes on transitions, footsteps on each foot strike, impacts, glass, stings on reveals, heartbeat in the hiding part, pops for text.
- Balanced: voice clearly on top; effects neither too loud nor too quiet; final loudness -14 LUFS.
- Narrator (Kokoro `am_fenrir`) not monotone: slower speed on tense lines, short dramatic pauses (gap) at quiet scary moments so the picture works.
