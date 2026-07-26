# VORTEX PANIC — Current State for Human Continuators

*Written 2026-07-26 at v6*

## What is this?

VORTEX PANIC is a browser-based 1D relativistic space travel simulator. Full name: "Vastly Overambitious Relativistic Travel EXperience with Proportional AstroNavigation Illustrating Cosmic-insignificance". You fly a ship from Earth's surface to landmarks spanning 30 orders of magnitude — from the Moon (384,400 km) to the edge of the observable universe (46.5 billion light-years).

It runs entirely in the browser. No build tools, no npm, no frameworks. Open `index.html` and go.

## How it works

The ship sits fixed on the right side of the canvas. The universe scrolls past it from right to left. Everything is on a single line (1D). The canvas uses logarithmic zoom so you can see objects across wildly different scales simultaneously.

**Flight is autopilot-only.** You pick a destination, pick a thrust preset, click AUTOPILOT. The autopilot accelerates to the midpoint, brakes to arrival, parks the ship in stable orbit with zero velocity. Then you pick a new destination and fly again.

There are no manual thrust controls. They existed in earlier versions but were removed in v6 because they conflicted with autopilot — the slider would silently disengage autopilot mid-flight, causing overshoot bugs.

## Controls

- **Destination**: radio buttons for 10 landmarks (Moon through Observable Universe Edge)
- **AP Thrust**: 4 presets — Human 1g, Hardened 2g, Unmanned 55g (default), Fantasy 250g
- **AUTOPILOT button**: engage/disengage (turns green when active)
- **Time Scale**: 8 fixed steps from 1x to 1,000,000x (radio buttons)
- **Pause/Resume + Step**: standard sim controls
- **Reset**: restart parked on Earth surface
- **Mouse wheel on canvas**: zoom in/out (changes pixels-per-decade)

## Readout panel

Shows speed (c, km/s, km/h), Lorentz factor gamma, ship proper time, Earth coordinate time, time dilation ratio, G-force, fuel %, distance from Earth (km + ly), ETA to target, and round-trip time dilation.

## Flight log

Bottom of screen. Logs every UI action, speed milestones (0.1%c, 1%c, 10%c...), autopilot phase changes, body approaches, fuel exhaustion. COPY button puts a full snapshot on clipboard. SNAPSHOT dumps current state into the log. Max 4 visible lines, scrollable.

## Physics

The sim models real relativistic physics:
- **Lorentz factor**: gamma = 1/sqrt(1 - v^2/c^2)
- **Proper acceleration to coordinate acceleration**: a_coord = a_proper / gamma^3 (this is why the ship can never reach c — as gamma grows, coordinate acceleration shrinks toward zero)
- **Time dilation**: proper time ticks slower by factor gamma
- **Fuel burn**: relativistic Tsiolkovsky equation, mass decreases as fuel burns
- **Newtonian gravity**: from nearby massive bodies (switched off when parked)
- **Velocity cap**: 0.9999999c hard limit

The autopilot uses the relativistic stopping distance formula: d_stop = (c^2/a)(gamma - 1), with a 1.5x safety margin.

## File structure

```
index.html          — page layout, CSS, all HTML controls
js/
  constants.js      — c, G, AU, LY, g0, BODIES array (10 landmarks), SHIP_DEFAULTS
  physics.js        — pure math: lorentzFactor, properToCoordAccel, gravitationalAccel, fuelBurnRate, roundTripTimes
  ship.js           — Ship class: position, velocity, mass, fuel, proper/coordinate time, parked flag
  autopilot.js      — Autopilot class: target selection, accel/brake/arrival logic
  renderer.js       — Canvas rendering: stars, bodies (textured or dots), ship, arrows for off-screen objects
  ui.js             — Wires HTML controls to ship/autopilot state, all formatting functions
  flightlog.js      — Timestamped event log, milestone detection, snapshot
  main.js           — Game loop, pause/step, event handlers, ties everything together
img/
  earth.jpg         — Earth texture (Solar System Scope, CC BY 4.0)
  moon.jpg          — Moon texture
  sun.jpg           — Sun texture
docs/design/
  design_vN.md      — Cumulative design state at version N
  decision_vN.md    — What changed and why at version N
```

All JS files are ES modules loaded natively by the browser. No transpilation.

## Design version history

- **v1**: Initial sim, basic physics, manual thrust slider
- **v2**: Autopilot, body textures, flight log
- **v3**: Textures for Earth/Moon/Sun, pause/step, log enhancements
- **v4**: Two-column destinations, fixed autopilot engagement, compact layout
- **v5**: Separated autopilot/manual modes, fixed overshoot/oscillation bugs, parked state, Earth surface start, thrust presets (1g/2g/55g/250g)
- **v6**: Removed manual thrust entirely, fixed time scale steps (radio buttons instead of slider), dead code cleanup

Each version has a `decision_vN.md` explaining what changed and why, and a `design_vN.md` with the full cumulative state.

## Hosting

GitHub Pages from `git@github.com:kvegh/vortex-panic.git`. Push to main, it's live. MIT license.

## What the owner cares about

The project owner doesn't read JavaScript. They steer by looking at the output — running the sim in a browser, pasting flight log snapshots, describing what's wrong visually. They want:

1. Proactive design suggestions — don't just implement requests, co-design the experience
2. Physics accuracy — the sim should reflect real relativistic physics faithfully
3. Clean, minimal UI — maximum canvas space, compact controls
4. Every UI action logged — full observability through the flight log

## Discussed but not yet implemented

- **Two new landmarks**: Capella (43 ly) and Polaris (430 ly) — to fill the gap between Alpha Centauri (4.37 ly) and Pillars of Creation (6,500 ly). Already researched and calculated in reference tables.
- **Reference tables at other g-levels**: The owner has a 1g table with all destinations. Tables at 2g, 55g, and 250g were implied but not yet produced.
- **The sim hasn't been flight-tested at v6** by the owner yet. The Moon flight was tested through v5 but v6 (autopilot-only, fixed time scale) hasn't been verified with a real flight log paste.

## Key physics insight for anyone continuing

c/g is approximately 1 year (354 days). This means 1g acceleration for 1 year gets you to ~0.77c. Ship proper time grows logarithmically with distance (arccosh ~ ln for large arguments), so even 46.5 billion light-years is reachable in ~48 years of ship time at 1g. The twin paradox is the whole point of the sim — you arrive in a human lifetime while Earth ages billions of years.
