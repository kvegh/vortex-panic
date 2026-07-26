# VORTEX PANIC — Design v2

*Updated 2026-07-26 — incorporates decision_v2*

## Concept
A 1D relativistic space travel simulator running in the browser. The ship is fixed on screen, the universe scrolls past. All landmarks sit on a single line from Earth to the edge of the observable universe. No frameworks, no build tools — vanilla JS + Canvas + HTML controls.

## Architecture

```
index.html              — canvas + UI control panel (buttons, sliders, readouts)
js/
  constants.js          — speed of light, G, landmark data (positions, masses, sizes, colors)
  physics.js            — relativistic mechanics (pure math, no DOM)
  ship.js               — ship state (position, velocity, fuel mass, proper time, thrust)
  autopilot.js          — destination selector, computes optimal accel/decel profile
  renderer.js           — draws everything on canvas
  ui.js                 — wires HTML controls to ship/autopilot
  main.js               — game loop, ties everything together
```

All modules are ES modules (native browser `import`/`export`). No npm, no bundler.

Physics is pure math with no DOM dependency — portable to other languages if needed.

Thrust interface: `setThrust(level, direction)` — both manual slider and autopilot call the same function. Either can be dropped without affecting the other.

## Visual Design
- **Canvas**: top portion of screen, dark background with stars
- **Ship**: fixed center-right, simple triangle or rocket shape, facing left
- **Direction**: ship flies right to left — destinations approach from the left, Earth recedes to the right
- **Objects**: colored circles — Earth (blue-green), Moon (gray), Sun (yellow-orange), etc.
- **Scale**: objects rendered at proportional size when close, minimum 3px dot when far
- **Clustering**: when objects are < 5px apart on screen, merge into one labeled dot
- **Arrows**: off-screen objects shown as small arrows at canvas edge with distance label
- **UI Panel**: below canvas, HTML controls (buttons, sliders, radio buttons) — no canvas UI

## Physics (all 1D)
- Position in meters from Earth
- Velocity as fraction of c (β)
- Proper acceleration (what the crew feels) capped at human limits
- Coordinate acceleration via relativistic transform
- Time dilation: dτ = dt / γ (proper time accumulates slower at high speed)
- Fuel: relativistic Tsiolkovsky equation, mass ratio decreases as fuel burns
- Gravity: Newtonian from nearby massive bodies (Sun, Sgr A*, etc.)
- Velocity addition: relativistic formula, never exceeds c

## Controls
- **Thrust slider**: 0g to 10g (with 1g marked as "comfortable")
- **Direction**: forward / reverse toggle button
- **Time scale**: logarithmic slider, 1x → 1,000,000x
- **Destination**: radio buttons (Moon, Sun, Pluto, Alpha Centauri, etc.)
- **Autopilot**: button to engage auto accel/decel to selected destination
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
- Fuel remaining (% of initial mass)
- Distance from Earth: displayed in both km and light-years simultaneously
- Estimated time to target: time to reach selected destination at current velocity/acceleration
- Round-trip time dilation: how much more time passes on Earth for a symmetrical flight (go there, come back with same profile) — the twin paradox number

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

## Build Order
1. Scaffold: index.html + all JS files, canvas renders, loop runs
2. Landmarks: place all objects with correct distances, render them
3. Ship + basic physics: position, velocity, thrust, things scroll past
4. Relativistic physics: velocity addition, time dilation, Lorentz factor
5. Fuel: rocket equation, mass tracking, fuel gauge
6. Gravity: gravitational pull from nearby bodies
7. Visual polish: object sizing, clustering, edge arrows, colors
8. Autopilot: destination selector, auto accel/decel planning
9. UI polish: all readouts updating, controls responsive
