# VORTEX PANIC — Design v3

*Updated 2026-07-26 — incorporates decision_v2 and decision_v3*

## Concept
A 1D relativistic space travel simulator running in the browser. The ship is fixed on screen, the universe scrolls past. All landmarks sit on a single line from Earth to the edge of the observable universe. No frameworks, no build tools — vanilla JS + Canvas + HTML controls.

## Architecture

```
index.html              — canvas + UI control panel (buttons, sliders, readouts)
img/
  earth.jpg             — Earth texture (Solar System Scope, CC BY 4.0)
  moon.jpg              — Moon texture
  sun.jpg               — Sun texture
js/
  constants.js          — speed of light, G, landmark data (positions, masses, sizes, colors)
  physics.js            — relativistic mechanics (pure math, no DOM)
  ship.js               — ship state (position, velocity, fuel mass, proper time, thrust)
  autopilot.js          — destination selector, computes optimal accel/decel profile
  renderer.js           — draws everything on canvas, loads and clips textures
  ui.js                 — wires HTML controls to ship/autopilot, logs all UI actions
  flightlog.js          — timestamped event log with position tracking
  main.js               — game loop, pause/step controls, ties everything together
```

All modules are ES modules (native browser `import`/`export`). No npm, no bundler.

Physics is pure math with no DOM dependency — portable to other languages if needed.

Thrust interface: `setThrust(level, direction)` — both manual slider and autopilot call the same function.

## Visual Design
- **Canvas**: top portion of screen, dark background with stars
- **Ship**: fixed center-right, simple triangle, facing left
- **Direction**: ship flies right to left — destinations approach from the left
- **Objects**: textured images (Earth, Moon, Sun) clipped to circles when close enough; colored dots with gradient when far or no texture available
- **Scale**: objects rendered at proportional angular size, minimum 3px dot
- **Clustering**: objects < 20px apart on screen merge into one labeled dot
- **Arrows**: off-screen objects shown as small arrows at canvas edge with labels
- **Paused overlay**: semi-transparent overlay with "PAUSED" text when simulation is paused
- **UI Panel**: below canvas, HTML controls — no canvas UI

## Physics (all 1D)
- Position in meters from Earth
- Velocity as fraction of c (β)
- Proper acceleration (what the crew feels) capped at human limits
- Coordinate acceleration via relativistic transform
- Time dilation: dτ = dt / γ (proper time accumulates slower at high speed)
- Fuel: relativistic Tsiolkovsky equation, mass ratio decreases as fuel burns
- Gravity: Newtonian from nearby massive bodies (Sun, Sgr A*, etc.)
- Velocity addition: relativistic formula, never exceeds c
- Autopilot runs inside physics substep loop for accuracy

## Controls
- **Thrust slider**: 0g to 10g (with 1g marked as "comfortable")
- **Direction**: forward / reverse toggle button
- **Time scale**: logarithmic slider, 1x → 10^15x
- **Destination**: radio buttons (Moon, Sun, Pluto, Alpha Centauri, etc.)
- **Autopilot**: button to engage auto accel/decel to selected destination (1.5x braking safety margin)
- **Pause/Resume**: toggle simulation
- **Step**: advance one frame at current time scale (auto-pauses first)
- **Reset**: button to restart from Earth

## Readout Panel
- Speed: displayed in three units simultaneously
  - fraction of c (e.g., 0.87c)
  - km/s
  - km/h
- Lorentz factor γ
- Proper time elapsed (ship time)
- Coordinate time elapsed (Earth time)
- Acceleration (current g-force)
- Fuel remaining (% of initial mass) with visual bar
- Distance from Earth: displayed in both km and light-years simultaneously
- Estimated time to target
- Round-trip time dilation: Earth ages vs you age

## Flight Log
- Timestamped log of all events with ship position, velocity, and nearest body
- Logged events:
  - Every UI action (thrust, direction, time scale, destination, autopilot, pause, reset)
  - Speed milestones (0.1%c, 1%c, 10%c, 50%c, 90%c, 99%c)
  - Autopilot phase changes (accelerating, braking, arrived)
  - Body approach and pass-by
  - Fuel exhaustion
- COPY button: puts full snapshot (state + distances to all bodies + recent log) on clipboard
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
