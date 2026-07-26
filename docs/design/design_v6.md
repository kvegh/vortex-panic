# VORTEX PANIC — Design v6

*Updated 2026-07-26 — incorporates decisions v2–v6*

## Concept
A 1D relativistic space travel simulator running in the browser. The ship is fixed on screen, the universe scrolls past. All landmarks sit on a single line from Earth to the edge of the observable universe. No frameworks, no build tools — vanilla JS + Canvas + HTML controls. Autopilot-only flight control.

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

Physics is pure math with no DOM dependency. Thrust interface: `setThrust(level, direction)` — called by autopilot only. Setting thrust > 0 clears parked state.

## Ship State

- **Parked**: ship starts parked on Earth surface (position = Earth radius, 6,371km). When parked, gravity is ignored — ship stays put. Autopilot parks ship on arrival. Any thrust clears parked and re-enables gravity.
- **Position**: meters from Earth center
- **Velocity**: m/s, clamped to 0.9999999c
- **Mass**: total mass including fuel, decreases as fuel burns
- **Proper time / coordinate time**: accumulated separately each frame

## Flight Control — Autopilot Only

No manual thrust controls. All flight is managed by the autopilot:

1. Select destination (radio buttons)
2. Select thrust preset (radio buttons)
3. Click AUTOPILOT to engage
4. Autopilot accelerates toward target, brakes when stopping distance reached, parks on arrival
5. On arrival: thrust zeroed, velocity zeroed, ship parked, autopilot disengaged
6. Select new destination and fly again

### Thrust Presets
Radio buttons in DESTINATION section:
- **Human 1g** — comfortable indefinitely, negligible time dilation
- **Hardened 2g** — trained military crew, sustainable for days
- **Unmanned 55g** — hardened electronics limit (default), solidly relativistic
- **Fantasy 250g** — deep relativistic time dilation, extreme twin paradox

### Autopilot Logic
- Accelerate toward target at selected g-level
- Brake when relativistic stopping distance `(c²/a)(γ − 1)` with 1.5× safety margin reaches remaining distance
- Arrival: distance < 1000km AND speed < 1 km/s → zero velocity, park ship, disengage
- Runs inside physics substep loop for accuracy at high time scales
- Symmetric: same acceleration for accel and brake phases

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
- Proper acceleration converted to coordinate acceleration: a_coord = a_proper / γ³
- Time dilation: dτ = dt / γ (proper time accumulates slower at high speed)
- Fuel: relativistic Tsiolkovsky equation, mass ratio decreases as fuel burns
- Gravity: Newtonian from nearby massive bodies (Sun, Sgr A*, etc.) — skipped when parked
- Velocity clamped to 0.9999999c — never reaches or exceeds c

## Controls
- **Destination**: two-column radio button grid (Moon through Observable Universe Edge)
- **AP Thrust**: four radio buttons (Human 1g / Hardened 2g / Unmanned 55g / Fantasy 250g)
- **Autopilot**: engage/disengage button (green when active)
- **Time scale**: 8 fixed radio buttons (1x, 10x, 50x, 100x, 1Kx, 10Kx, 100Kx, 1Mx)
- **Pause/Resume**: toggle simulation
- **Step**: advance one frame at current time scale
- **Reset**: restart parked on Earth surface

## Readout Panel
- Speed: fraction of c, km/s, km/h (three units simultaneously)
- Lorentz factor γ
- Proper time elapsed (ship time)
- Coordinate time elapsed (Earth time)
- Time dilation ratio
- G-force: compact "G: X.X" in FLIGHT section
- Fuel remaining (% with visual bar)
- Distance from Earth (km and light-years)
- Estimated time to target
- Round-trip time dilation: Earth ages vs you age

## Flight Log
- Version shown at startup: "VORTEX PANIC v6"
- Capped at 4 visible lines, scrollable
- Timestamped log of all events with ship position, velocity, and nearest body
- Logged events:
  - Every UI action (destination, AP thrust preset, autopilot engage/disengage, time scale, pause, reset)
  - Autopilot failures (no destination selected)
  - Autopilot engage with selected g-level
  - Speed milestones (0.1%c, 1%c, 10%c, 50%c, 90%c, 99%c)
  - Autopilot phase changes (accelerating, braking, arrived)
  - Body approach and pass-by
  - Fuel exhaustion
- COPY button: full snapshot to clipboard
- SNAPSHOT button: dumps current state into log
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
