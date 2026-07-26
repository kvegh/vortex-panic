# VORTEX PANIC — Design v5

*Updated 2026-07-26 — incorporates decisions v2, v3, v4, v5*

## Concept
A 1D relativistic space travel simulator running in the browser. The ship is fixed on screen, the universe scrolls past. All landmarks sit on a single line from Earth to the edge of the observable universe. No frameworks, no build tools — vanilla JS + Canvas + HTML controls.

## Architecture

```
index.html              — canvas + UI control panel + flight log
img/
  earth.jpg             — Earth texture (Solar System Scope, CC BY 4.0)
  moon.jpg              — Moon texture
  sun.jpg               — Sun texture
js/
  constants.js          — speed of light, G, landmark data (positions, masses, sizes, colors)
  physics.js            — relativistic mechanics (pure math, no DOM)
  ship.js               — ship state (position, velocity, fuel mass, proper time, thrust, parked flag)
  autopilot.js          — destination selector, computes optimal accel/decel profile
  renderer.js           — draws everything on canvas, loads and clips textures
  ui.js                 — wires HTML controls to ship/autopilot, logs all UI actions
  flightlog.js          — timestamped event log with position tracking
  main.js               — game loop, pause/step controls, ties everything together
docs/design/
  design_vN.md          — cumulative design state at version N
  decision_vN.md        — what changed and why at version N
```

All modules are ES modules (native browser `import`/`export`). No npm, no bundler.

Physics is pure math with no DOM dependency — portable to other languages if needed.

Thrust interface: `setThrust(level, direction)` — both manual slider and autopilot call the same function. Setting thrust > 0 clears parked state.

## Ship State

- **Parked**: ship starts parked on Earth surface (position = Earth radius, 6,371km). When parked, gravity is ignored — ship stays put. Autopilot parks ship on arrival. Any thrust clears parked and re-enables gravity.
- **Position**: meters from Earth center
- **Velocity**: m/s, clamped to 0.9999999c
- **Mass**: total mass including fuel, decreases as fuel burns
- **Proper time / coordinate time**: accumulated separately each frame

## Control Modes

Two mutually exclusive modes:

### Manual Mode
- Thrust slider (0g–10g) and direction button (ACCEL/BRAKE) are active
- Ship responds directly to slider input
- Autopilot is off

### Autopilot Mode
- Engaged via AUTOPILOT button (requires destination selected)
- Manual controls are disabled (greyed out, non-interactive)
- Autopilot manages thrust level and direction automatically
- Thrust slider visually tracks autopilot's current thrust (read-only)
- Disengaged by: clicking DISENGAGE, arriving at destination, or RESET
- On disengage: manual controls re-enable, thrust zeroed

No silent conflicts possible — modes are enforced by disabling controls.

## Autopilot

- **Thrust presets** (radio buttons in DESTINATION section):
  - Human 1g — comfortable indefinitely
  - Hardened 2g — trained military crew, sustained for days
  - Unmanned 55g — hardened electronics limit (default)
  - Fantasy 250g — deep relativistic time dilation
- **Profile**: accelerate toward target, brake when stopping distance (with 1.5× safety margin) reaches remaining distance
- **Stopping distance**: relativistic formula `(c²/a)(γ − 1)`
- **Arrival**: distance < 1000km AND speed < 1 km/s → zero velocity, park ship, disengage
- **Runs inside physics substep loop** for accuracy at high time scales
- Same acceleration for both accel and brake phases (symmetric)

## Visual Design
- **Canvas**: top portion of screen, maximized vertical space (panel ≤35vh, log 4 lines)
- **Ship**: fixed center-right, simple triangle, facing left
- **Parked text**: "Parked in stable orbit" in green above ship when parked
- **Direction**: ship flies right to left — destinations approach from the left
- **Objects**: textured images (Earth, Moon, Sun) clipped to circles when close enough; colored dots with gradient when far or no texture available
- **Scale**: objects rendered at proportional angular size, minimum 3px dot
- **Clustering**: objects < 20px apart on screen merge into one labeled dot
- **Arrows**: off-screen objects shown as small arrows at canvas edge with labels
- **Paused overlay**: semi-transparent overlay with "PAUSED" text
- **UI Panel**: below canvas, HTML controls — no canvas UI
- **Color scheme**: dark navy (#0a0a1a) background, #4488cc headers, #8899aa subtitle, #8f8 log text

## Physics (all 1D)
- Position in meters from Earth
- Velocity as fraction of c (β)
- Proper acceleration (what the crew/payload feels)
- Coordinate acceleration via relativistic transform: a_coord = a_proper / γ³
- Time dilation: dτ = dt / γ (proper time accumulates slower at high speed)
- Fuel: relativistic Tsiolkovsky equation, mass ratio decreases as fuel burns
- Gravity: Newtonian from nearby massive bodies (Sun, Sgr A*, etc.) — skipped when parked
- Velocity addition: relativistic formula, never exceeds c

## Controls
- **Thrust slider**: 0g to 10g (with 1g marked as "comfortable")
- **Direction**: forward / reverse toggle button
- **Time scale**: logarithmic slider, 1x → 10^15x
- **Destination**: two-column radio button grid (Moon, Sun, Pluto, Alpha Centauri, etc.)
- **AP Thrust**: four radio buttons (Human 1g / Hardened 2g / Unmanned 55g / Fantasy 250g)
- **Autopilot**: button to engage auto accel/decel to selected destination
  - Turns green when engaged
  - Logs failure if no destination selected
  - Disables manual controls when engaged
  - Visually updates thrust slider when controlling thrust
  - 1.5x braking safety margin
- **Pause/Resume**: toggle simulation
- **Step**: advance one frame at current time scale (auto-pauses first)
- **Reset**: restart from Earth surface (parked)

## Readout Panel
- Speed: displayed in three units simultaneously
  - fraction of c (e.g., 0.87c)
  - km/s
  - km/h
- Lorentz factor γ
- Proper time elapsed (ship time)
- Coordinate time elapsed (Earth time)
- G-force: compact "G: X.X" in FLIGHT section (informational, no cap)
- Fuel remaining (% of initial mass) with visual bar
- Distance from Earth: displayed in both km and light-years simultaneously
- Estimated time to target
- Round-trip time dilation: Earth ages vs you age

## Flight Log
- Version shown at startup: "VORTEX PANIC v5"
- Capped at 4 visible lines, scrollable
- Timestamped log of all events with ship position, velocity, and nearest body
- Sliders log only on release (not every intermediate tick)
- Logged events:
  - Every UI action (thrust, direction, time scale, destination, AP thrust preset, autopilot, pause, reset)
  - Autopilot failures (no destination selected)
  - Autopilot engage with selected g-level
  - Speed milestones (0.1%c, 1%c, 10%c, 50%c, 90%c, 99%c)
  - Autopilot phase changes (accelerating, braking, arrived)
  - Body approach and pass-by
  - Fuel exhaustion
- COPY button: full snapshot (state + distances to all bodies + recent log) to clipboard
- SNAPSHOT button: dumps current state into the log
- HIDE/SHOW toggle

## Landmarks

| Landmark | Distance from Earth |
|---|---|
| Moon | 384,400 km |
| Sun | 1 AU (~150M km) |
| Pluto | ~39 AU |
| Alpha Centauri | 4.37 ly |
| Pillars of Creation | ~6,500 ly |
| Galactic center (Sgr A*) | ~26,000 ly |
| Andromeda Galaxy | ~2.5M ly |
| Nearest supercluster edge | ~100M ly |
| Observable universe edge | ~46.5B ly |
