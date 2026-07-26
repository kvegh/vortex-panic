# VORTEX PANIC — Design & Decision History

*Consolidated document. Each section describes the design at that version and the decisions that shaped it.*

---

## v1 — Initial Design

### Design

A 1D relativistic space travel simulator running in the browser. The ship is fixed on screen, the universe scrolls past. All landmarks sit on a single line from Earth to the edge of the observable universe. No frameworks, no build tools — vanilla JS + Canvas + HTML controls.

**Architecture**: 7 ES modules loaded natively by the browser. `constants.js` (physical constants, landmarks), `physics.js` (pure math, no DOM — portable to other languages), `ship.js` (state), `autopilot.js` (accel/decel), `renderer.js` (canvas), `ui.js` (controls), `main.js` (game loop). Thrust interface: `setThrust(level, direction)` — both manual slider and autopilot call the same function.

**Visual**: dark canvas with stars, ship as a triangle (fixed center-left, facing right), colored circles for bodies. Objects cluster when <5px apart on screen, arrows for off-screen bodies.

**Physics**: 1D relativistic mechanics — Lorentz factor, time dilation, coordinate acceleration (`a_coord = a_proper / γ³`), relativistic fuel burn (Tsiolkovsky equation), Newtonian gravity. Velocity clamped to 0.9999999c.

**Controls**: thrust slider (0–10g), direction toggle, time scale slider (1x–1Mx), destination radio buttons, autopilot button, reset.

**Readouts**: speed (fraction of c), gamma, ship time, Earth time, G-force, fuel %, distance to landmark.

**Landmarks**: Moon (384,400 km), Sun (1 AU), Pluto (~39 AU), Alpha Centauri (4.37 ly), Pillars of Creation (~6,500 ly), Sgr A* (~26,000 ly), Andromeda (~2.5M ly), Supercluster edge (~100M ly), Observable Universe edge (~46.5B ly).

### Build Order
1. Scaffold: index.html + all JS files, canvas renders, loop runs
2. Landmarks: place all objects with correct distances, render them
3. Ship + basic physics: position, velocity, thrust, things scroll past
4. Relativistic physics: velocity addition, time dilation, Lorentz factor
5. Fuel: rocket equation, mass tracking, fuel gauge
6. Gravity: gravitational pull from nearby bodies
7. Visual polish: object sizing, clustering, edge arrows, colors
8. Autopilot: destination selector, auto accel/decel planning
9. UI polish: all readouts updating, controls responsive

---

## v2 — Readout Enhancements

### Decisions

1. **Speed display**: show all three units simultaneously — fraction of c, km/s, and km/h. Humans relate to km/h at low speeds, km/s at orbital speeds, fraction of c at relativistic speeds.
2. **Ship direction**: ship flies right to left (not left to right). Destinations approach from the left, Earth recedes to the right.
3. **Distance from Earth**: always displayed in both km and light-years simultaneously.
4. **ETA to target**: show estimated time to reach destination at current velocity/acceleration.
5. **Round-trip time dilation**: display how much more time passes on Earth for a symmetric flight — the twin paradox number.

### Design changes

Readout panel expanded with three-unit speed display, dual-unit distance, ETA, and round-trip dilation. Ship orientation reversed to fly right-to-left.

---

## v3 — Textures, Flight Log, Sim Controls

### Decisions

1. **Texture images**: Real NASA/public domain images (Solar System Scope, CC BY 4.0) for Earth, Moon, Sun. Clipped to circles on canvas. Bodies without textures keep gradient rendering.
2. **Flight log**: Every UI action logged with ship position, velocity, and nearest body. Makes debugging possible by copy-pasting log output. COPY button puts full snapshot on clipboard. SNAPSHOT dumps state into the log. HIDE/SHOW toggle.
3. **Simulation controls**: PAUSE, RESUME, STEP buttons. STEP advances one frame at current time scale while paused.
4. **Autopilot fix**: Moved autopilot decision-making inside the physics substep loop (was once per frame). Added 1.5× safety margin on braking distance to prevent overshoot.

### Design changes

New `img/` directory with textures. New `flightlog.js` module. Flight log panel at bottom of screen. Clustering threshold changed from 5px to 20px. Semi-transparent PAUSED overlay on canvas. Speed milestones logged (0.1%c, 1%c, 10%c, 50%c, 90%c, 99%c). Body approach/pass-by and fuel exhaustion logged.

---

## v4 — UI Polish, Layout, Collaboration

### Decisions

1. **Autopilot engagement fix**: clicking AUTOPILOT with no destination logs a failure message. Manual thrust/direction changes auto-disengage autopilot. Button turns green when engaged.
2. **Version in log**: flight log shows version at startup and reset for traceability.
3. **Destination layout**: two-column grid, halving vertical space.
4. **Subtitle readability**: changed from #555 (invisible) to #8899aa (light steel blue).
5. **Canvas space maximized**: log capped at 4 lines, panel max-height reduced from 45vh to 35vh.
6. **Design collaboration**: Claude provides proactive design suggestions alongside fixes.

### Design changes

Compact two-column destination grid. Version string in flight log. Dark navy color scheme established (#0a0a1a background, #4488cc headers, #8899aa subtitle, #8f8 log text).

---

## v5 — Mode Separation, Parked State, Thrust Presets

### Decisions

1. **Autopilot/manual mode separation**: manual controls disabled and greyed out while autopilot is engaged. Prevents accidental disengagement mid-flight. Controls re-enable on DISENGAGE click, arrival, or RESET.
2. **Slider log spam fix**: sliders log only on release (`change` event), not every intermediate tick (`input` event). A single drag previously generated 20–30 log entries.
3. **Autopilot arrival convergence**: widened arrival threshold from 100km/50m·s⁻¹ to 1000km/1km·s⁻¹. Old thresholds caused indefinite oscillation around the Moon (~700km amplitude) without ever satisfying both conditions simultaneously. Velocity zeroed on arrival.
4. **Parked state**: ship has a "parked" flag. When parked, gravity is ignored. Ship starts parked on Earth surface. Autopilot parks on arrival. Any thrust clears parked. "Parked in stable orbit" text shown above ship.
5. **Ship starts on Earth surface**: initial position changed from 6,771km (LEO) to 6,371km (Earth radius).
6. **G-force display**: moved to compact "G: X.X" in FLIGHT section. Informational only — no cap (unmanned ship).
7. **Autopilot thrust presets**: four acceleration levels replace hardcoded 1g:
   - Human 1g — comfortable indefinitely
   - Hardened 2g — trained military crew, sustained for days
   - Unmanned 55g — hardened electronics limit (default)
   - Fantasy 250g — deep relativistic time dilation
8. **Destination section widened**: min-width 260px, flex:2 for two-column grid and thrust presets.
9. **Log panel height reduced**: tighter padding, smaller buttons.

### Design changes

Two mutually exclusive control modes (manual/autopilot). Ship state includes parked flag. Four thrust presets as radio buttons. Ship starts on Earth surface at 6,371 km from center. G-force as informational readout.

---

## v6 — Autopilot Only, Fixed Time Steps

### Decisions

1. **Manual thrust removed**: dropped the THRUST section entirely (slider, direction button). Ship is now autopilot-only. The engine (`setThrust()`) remains because autopilot calls it. All manual-specific code removed: `onManualThrust` callback, `updateThrustDisplay`, `disableManualControls`, `enableManualControls`, `.braking` CSS class, range input styling.
2. **Time scale fixed steps**: replaced continuous logarithmic slider with 8 fixed radio buttons: 1x, 10x, 50x, 100x, 1Kx, 10Kx, 100Kx, 1Mx. Eliminates slider log spam and gives predictable, repeatable time scales.
3. **Thrust presets updated**: four levels based on g-force tolerance research (1g/2g/55g/250g).
4. **Dead code cleanup**: removed CSS for `input[type="range"]` and `button.braking` — no sliders or manual direction button remain.

### Design changes

No manual controls — all flight is autopilot-only. Time scale as fixed radio button steps. Cleaner UI with less code.

---

## v7 — Midpoint Autopilot, Progress Milestones

### Decisions

1. **Autopilot rewritten — midpoint-based flight profile**: replaced reactive "check stopping distance every substep" with a planned flight: full acceleration to midpoint (50% of total distance), then symmetric deceleration. The old autopilot asked "should I brake yet?" every substep, and the 1.5× safety margin caused accel/brake oscillation — dozens of phase switches during final approach. The new autopilot only uses stopping-distance logic in the last 0.1% (correction zone).
2. **Correction zone (last 0.1%)**: FINAL APPROACH phase fine-tunes arrival using stopping-distance logic. Handles numerical errors from discrete time stepping. For short flights (Moon), the zone is ~384 km at low speed. For interstellar flights, a seamless handoff.
3. **10% progress milestones**: every 10% of distance traveled, the log records speed, gamma, G-force, fuel %, ship time, Earth time, dilation, and distance to target.
4. **New autopilot phase: FINAL APPROACH**: flight log shows four clean phases: ACCELERATING → BRAKING → FINAL APPROACH → ARRIVED.
5. **RESET button moved**: from TIME SCALE section to SIMULATION section where it belongs.

### Design changes

Autopilot plans symmetric flights with midpoint flip. Four phases: accel, brake, correct, arrived. On engage, records start position and total distance. Progress milestones in flight log. RESET in SIMULATION section.

---

## v8 — Analytical Flight State, 10% Step Buttons, Extended Time Scale

### Decisions

1. **Analytical flight state function**: `flightStateAtFraction()` in `physics.js` computes exact ship state at any point in the journey using closed-form relativistic rocket equations — no simulation needed. Key formulas:
   - `S = a·d/c²`, `γ = S + 1`, `v = c·√(1 − 1/γ²)`
   - `coord_time = (c/a)·√(S² + 2S)`, `proper_time = (c/a)·arccosh(S + 1)`
   - `mass = m₀·exp(−a·τ/v_exhaust)` (exact solution to the fuel burn ODE)
   - Brake phase times mirrored from midpoint.
   Computed on the fly (~5 math ops, microseconds) rather than precomputed as a static table — stays correct when destinations or ship parameters change.
2. **10% step buttons replace old STEP**: two new buttons in SIMULATION section:
   - **▸ 10% AHEAD**: jumps to next 10% boundary of current flight
   - **◂ 10% BACK**: jumps to previous 10% boundary
   Both use the analytical function, set ship state via new `setState()` method, pause the simulation, and log the step. Requires an active flight plan. Stepping to 100% parks the ship and disengages autopilot; stepping to 0% returns to the start position.
3. **Ship `setState()` method**: sets all state properties at once from a computed state object. Needed because stepping writes position, velocity, mass, times, gamma, thrust, and parked flag simultaneously.
4. **Time scale extended to 100Mx**: added 10Mx and 100Mx radio buttons. At 100Mx, each frame covers ~18 days of sim time. Useful for reaching the Observable Universe Edge. Existing substep loop (capped at 2000 substeps per frame) and `fmtScale()` formatting handle these values.
5. **Header version**: title bar shows "VORTEX PANIC v8".
6. **Subtitle color**: changed from #8899aa to white (#ffffff).

### Design changes

`physics.js` exports analytical flight state function. Ship class has `setState()` for bulk state writes. Old frame-advance STEP button replaced with 10% ahead/back buttons using analytical calculation. Time scale: 10 radio buttons from 1x to 100Mx.

---

## v9 — Speed Display Fix, Step Milestone Fix, Button Logging

### Decisions

1. **Speed display clamped below c**: at ultra-relativistic speeds, `toFixed(6)` rounded 0.9999995+c to "1.000000 c" — looked like the ship reached lightspeed. Display now clamped to 0.999999c (6dp) and 0.999999999c (9dp snapshot). Velocity in the analytical function clamped to 0.9999999c, matching `ship.update()`.
2. **Snapshot km/s clamped below c**: `toFixed(1)` rounded 299792.458 to "299792.5 km/s" — numerically above c. Now clamped before formatting.
3. **Speed milestones no longer re-trigger on step**: `stepToPercent()` was resetting `lastSpeedBracket = -1`, causing "MILESTONE: 99%c" to fire on every step. Now computes the correct bracket from current velocity.
4. **Log-toggle button logged**: HIDE/SHOW clicks now recorded in the flight log. All button clicks are now logged.
5. **Step back jumps 2 boundaries**: stepping back from 93% now goes to 80% instead of 90%. The nearest boundary was too close to feel like movement.
6. **Flame size fixed per preset**: replaced `10 + g * 4` (1010px at 250g) with a lookup — 1g: 10px, 2g: 20px, 55g: 100px, 250g: 200px.

### Design changes

Speed display never shows ≥1c anywhere. All button clicks logged. Step-back skips one extra boundary. Flame sizes fixed per thrust preset.

---

## v10 — Ship Image, Phase Text, Deceleration Flip

### Decisions

1. **Ship image replaces triangle**: `img/ship_creativecommons.png` loaded as a texture and drawn at 35px wide (proportional height). Nose points left by default (matching flight direction). Triangle kept as fallback if image fails to load.
2. **Ship flips on deceleration**: during brake/correct phases, the ship image is flipped horizontally so the nose points right (engines face the direction of travel, physically correct for a decelerating rocket).
3. **Phase text above ship**: "ACCELERATING" shown in green (#44ff88) during accel phase. "DECELERATING" shown in orange (#ff8844) during brake/correct phases. "Parked in stable orbit" in green when parked. No text during arrived or idle.
4. **Renderer receives autopilot**: `render()` now takes an autopilot parameter to determine flight phase for ship orientation and text display.

### Design changes

Ship rendered as a rocket image instead of a plain triangle. Flips on deceleration. Phase label floats above the ship during flight. Flame positions adjusted for wider ship sprite.

---

## Current State (v10)

### Architecture
```
index.html              — canvas + UI control panel + flight log
img/                    — Earth, Moon, Sun textures (CC BY 4.0), ship sprite
js/
  constants.js          — C, G, AU, LY, g0, BODIES[], SHIP_DEFAULTS
  physics.js            — pure math: Lorentz, accel, gravity, fuel, round-trip, analytical flight state
  ship.js               — Ship class with setState() for bulk writes
  autopilot.js          — midpoint flight planner with 0.1% correction zone
  renderer.js           — canvas rendering with textures, ship sprite, log zoom, arrows
  ui.js                 — HTML controls, formatting, all UI event logging
  flightlog.js          — timestamped log with speed/progress milestones
  main.js               — game loop, 10% step buttons, event wiring
docs/design/            — this file (consolidated design & decision history)
```

### Flight profile
Symmetric accel/decel with midpoint flip. Four phases: ACCELERATING → BRAKING → FINAL APPROACH → ARRIVED. Analytical state available at any journey fraction. Ship sprite flips on deceleration, phase text shown above ship.

### Visual
Dark navy (#0a0a1a) background, #4488cc headers, #ffffff subtitle, #8f8 log text. Ship rendered as rocket sprite (flips on decel). Textured bodies (Earth, Moon, Sun), clustering at <20px, PAUSED overlay, fuel visual bar. Canvas maximized (panel ≤35vh, log 4 lines). Flame sizes fixed per thrust preset (10/20/100/200px).

### Controls
Autopilot-only. 4 thrust presets (1g/2g/55g/250g). 10 time scale steps (1x–100Mx). 10% step ahead/back buttons. Pause/Reset.

### Landmarks

| Landmark | Distance from Earth |
|---|---|
| Moon | 384,400 km |
| Sun | 1 AU (~150M km) |
| Pluto | ~39 AU |
| Alpha Centauri | 4.37 ly |
| Pillars of Creation | ~6,500 ly |
| Sgr A* | ~26,000 ly |
| Andromeda | ~2.5M ly |
| Supercluster edge | ~100M ly |
| Observable Universe edge | ~46.5B ly |
