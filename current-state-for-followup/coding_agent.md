# VORTEX PANIC — Coding Agent Handoff Document

*Written 2026-07-26 at v6. Read this before touching code.*

## Project summary

Browser-based 1D relativistic space travel simulator. Vanilla JS + HTML5 Canvas, ES modules loaded natively (no bundler, no npm, no build step). The ship flies right-to-left from Earth to the observable universe edge. Autopilot-only flight control with 4 thrust presets. All physics is relativistic (Lorentz factor, time dilation, relativistic rocket equation).

**Run it**: Open `index.html` in any modern browser. That's the entire deployment.
**Hosted**: GitHub Pages from `git@github.com:kvegh/vortex-panic.git` (SSH, not HTTPS).

## Architecture

```
index.html              — single page: CSS (inline <style>), HTML controls, <canvas>, loads js/main.js
js/
  constants.js          — exports: C, G, AU, LY, g0, BODIES[], SHIP_DEFAULTS
  physics.js            — exports: lorentzFactor(v), properToCoordAccel(a,v), gravitationalAccel(pos,bodies),
                           fuelBurnRate(a,mass,exhV,gamma), roundTripTimes(dist,a)
  ship.js               — exports: Ship class
  autopilot.js          — exports: Autopilot class
  renderer.js           — exports: Renderer class
  ui.js                 — exports: UI class
  flightlog.js          — exports: FlightLog class
  main.js               — entry point, game loop, event handlers, wiring
img/
  earth.jpg, moon.jpg, sun.jpg — 2048x1024 textures (Solar System Scope, CC BY 4.0)
docs/design/
  design_vN.md          — cumulative design spec at version N (N=1..6)
  decision_vN.md        — changelog + rationale at version N (N=2..6)
```

### Dependency graph

```
main.js
  ├── constants.js  (C, G, AU, LY, g0, BODIES, SHIP_DEFAULTS)
  ├── Ship          (← constants, physics)
  ├── Renderer      (← constants)
  ├── UI            (← constants, physics)
  ├── Autopilot     (← constants)
  └── FlightLog     (← constants)

physics.js is pure math — no DOM, no imports except constants.
renderer.js reads ship state but never mutates it.
ui.js reads ship state for display, owns UI event handlers.
autopilot.js mutates ship state via ship.setThrust() and ship.velocity/parked.
main.js owns the game loop and wires everything together.
```

### No shared mutable state except Ship

The `Ship` instance is the single source of truth. Autopilot mutates it during `update()`. Renderer and UI read it. FlightLog reads it. Main.js creates all instances and passes the ship around.

## Key classes and their state

### Ship (`js/ship.js`)

```
position: number       — meters from Earth center (starts at 6.371e6 = Earth surface)
velocity: number       — m/s, clamped to ±0.9999999c
mass: number           — current mass in kg (decreases as fuel burns)
totalMass: number      — initial mass (1e6 kg = 1000 tonnes)
dryMass: number        — mass without fuel (totalMass * 0.1)
exhaustVelocity: number — 0.1c
properTime: number     — seconds, accumulated at rate dt/gamma
coordinateTime: number — seconds, accumulated at rate dt
thrustLevel: number    — proper acceleration in m/s² (0 when coasting)
thrustDirection: number — +1 (toward higher positions) or -1 (toward lower)
gamma: number          — current Lorentz factor
parked: boolean        — when true, gravity is ignored, ship stays put
```

**Critical**: `setThrust(level, direction)` clears `parked` when level > 0. This is how autopilot "unparks" the ship.

**Critical**: `update(dt, bodies)` applies acceleration as `a_coord = a_proper / gamma^3`. This is the correct relativistic transformation. Velocity is clamped to 0.9999999c every frame.

### Autopilot (`js/autopilot.js`)

```
target: body object    — from BODIES array, or null
engaged: boolean       — actively flying
accel: number          — proper acceleration in m/s² (set from thrust preset)
phase: string          — '', 'accel', 'brake', 'arrived'
```

**Arrival condition**: `absDist < 1e6 (1000 km) AND v < 1000 (1 km/s)` → zeroes velocity, sets parked=true, disengages.

**Braking decision**: uses relativistic stopping distance `(c²/a)(gamma - 1)` with 1.5x safety margin. When `stopDist * 1.5 >= remaining distance`, switches to brake phase.

**Important**: `update()` is called inside the physics substep loop in main.js (not once per frame). This ensures autopilot responds accurately even at high time scales where each frame covers thousands of substeps.

### Renderer (`js/renderer.js`)

- Ship drawn at fixed screen position (70% from left, vertically centered)
- Bodies positioned via `worldToScreen()`: logarithmic scale `log10(1 + |delta|) * pixelsPerDecade`
- Bodies closer than 20px on screen merge into labeled clusters
- Off-screen bodies shown as colored arrows at canvas edges
- Textured bodies (Earth, Moon, Sun) clipped to circles when close enough; gradient dots otherwise
- "Parked in stable orbit" green text above ship when `ship.parked`
- Mouse wheel adjusts `pixelsPerDecade` (zoom)

### UI (`js/ui.js`)

- Reads ship state every frame in `update()` to refresh all readout spans
- Owns `timeScale` (from radio buttons, values: 1/10/50/100/1K/10K/100K/1M)
- Owns `apThrustG` (from radio buttons, values: 1/2/55/250)
- Owns `selectedDest` (from destination radio buttons, a BODIES element)
- All formatting helpers: `fmtNum`, `fmtLy`, `fmtTime`, `fmtScale`, `fmtDistBoth`
- Logs every UI action via `this.log.logUI()`

### FlightLog (`js/flightlog.js`)

- `update()` called every frame, but only processes every 30th frame
- Detects speed milestones (0.1%c, 1%c, 10%c, 50%c, 90%c, 99%c)
- Detects autopilot phase changes
- Detects body approach (within 5x radius) and pass (beyond 10x radius, behind ship)
- Detects fuel exhaustion
- `snapshot()` returns a multi-line string with full ship/autopilot state + last 30 log entries
- Max 500 entries, FIFO

### Main.js game loop

```javascript
function loop(timestamp) {
    dtReal = min((timestamp - lastTime) / 1000, 0.1)  // cap at 100ms
    dtSim = dtReal * timeScale
    steps = min(2000, ceil(dtSim))                     // max 2000 substeps/frame
    subDt = dtSim / steps
    for (i = 0..steps) {
        autopilot.update()    // runs INSIDE substep loop
        ship.update(subDt, BODIES)
    }
    // detect autopilot arrival (phase === 'arrived') → reset button
    renderer.render()
    ui.update()
    log.update()
}
```

The 2000-substep cap means at very high time scales (1Mx) with high gamma, physics accuracy may degrade. This hasn't been a problem in practice.

## BODIES array

| Index | Name | Position | Mass | Radius |
|---|---|---|---|---|
| 0 | Earth | 0 | 5.972e24 | 6.371e6 |
| 1 | Moon | 3.844e8 | 7.342e22 | 1.737e6 |
| 2 | Sun | 1 AU | 1.989e30 | 6.96e8 |
| 3 | Pluto | 39.5 AU | 1.309e22 | 1.188e6 |
| 4 | Alpha Centauri | 4.37 ly | 2.187e30 | 8.51e8 |
| 5 | Pillars | 6500 ly | 1e34 | 4 ly |
| 6 | Sgr A* | 26000 ly | 8.26e36 | 2.2e10 |
| 7 | Andromeda | 2.5e6 ly | 2.5e42 | 1.1e21 |
| 8 | Supercluster | 1e8 ly | 1e46 | 5e22 |
| 9 | Edge | 46.5e9 ly | 0 | 0 |

Ship starts at position 6.371e6 m (Earth's radius = Earth's surface). Positions are in meters from Earth's center. All positions are positive (ship flies in +x direction toward higher values).

## Physics formulas used

```
Lorentz factor:       gamma = 1 / sqrt(1 - v²/c²)
Coord acceleration:   a_coord = a_proper / gamma³
Time dilation:        d_tau = dt / gamma
Stopping distance:    d_stop = (c²/a)(gamma - 1)
Fuel burn rate:       dm/dt = |a| * m / (v_exhaust * gamma)
```

Round trip (symmetric accel-decel, there and back):
```
S = a * d_half / c²           where d_half = one-way distance / 2
t_half = (c/a) * sqrt((S+1)² - 1)    coordinate time for one quarter-trip
tau_half = (c/a) * acosh(S + 1)       proper time for one quarter-trip
Total coord time = 4 * t_half
Total proper time = 4 * tau_half
```

Key constant: c/g = 3.057e7 seconds = 0.969 years ~ 354 days. This means 1g for 1 year gets you to ~0.77c.

## CSS architecture

All CSS is inline in `index.html` `<style>` block. Key selectors:
- `#panel` — flexbox wrap, gap 3px, max-height 35vh, holds `.sec` sections
- `.sec` — individual control sections with `#1a1a2e` background, min-width 140px
- `#destinations` — CSS grid, 2 columns
- `button.ap-on` — green border/text for engaged autopilot
- `#log-content` — max-height 52px, pre-wrap, green text (#8f8)
- `#log-panel.hidden #log-content` — display:none toggle

## Important patterns and conventions

1. **All UI actions MUST be logged.** Every radio button change, button click, state transition gets logged via `log.logUI()`. The owner debugs by pasting flight log snapshots.

2. **No manual thrust controls exist.** They were removed in v6. The engine (`ship.setThrust`) remains because autopilot calls it, but there's no user-facing thrust slider or direction button.

3. **Parked state is gravity-immune.** When `ship.parked === true`, `gravitationalAccel()` returns 0. This prevents drift after autopilot arrival. Any thrust > 0 clears parked.

4. **Autopilot runs inside the substep loop**, not once per frame. This is critical for accuracy at high time scales.

5. **Position is in meters from Earth center**, not from Earth surface. The ship starts at position 6.371e6 (Earth radius). Body positions are also from Earth center.

6. **Velocity can be negative** (ship moving toward Earth). Autopilot handles direction via `Math.sign(dist)`.

7. **No TypeScript, no JSDoc.** Plain vanilla ES modules. The owner doesn't read JavaScript — they evaluate changes by running the sim.

8. **Design docs are versioned.** When making changes, create `decision_v{N+1}.md` (what changed and why) and `design_v{N+1}.md` (full cumulative state). Current version is v6.

## Known issues and edge cases

1. **Substep cap at high time scales**: At 1Mx time scale, `dtSim` can be ~100,000 seconds/frame. With 2000 substeps max, each substep is 50 seconds. At very high gamma this may cause slight inaccuracies. Not observed as a problem yet.

2. **Gravity is Newtonian, not relativistic**: Gravitational acceleration doesn't account for relativistic effects. At the scales involved (mostly deep space cruising), this doesn't matter.

3. **Body positions are static**: Bodies don't orbit. The Moon is always 384,400 km from Earth. This is by design — it's a relativistic time-dilation demonstrator, not an orbital mechanics sim.

4. **Fuel model is unrealistic**: 1,000,000 kg ship with 90% fuel fraction and 0.1c exhaust velocity. The exhaust velocity alone is science fiction. Fuel exists as a gameplay constraint, not a realistic model.

5. **Large mass/radius values for distant objects** (Pillars: mass 1e34, radius 4 ly) are crude approximations to make gravity and rendering work at those scales.

## Bugs that were fixed (avoid reintroducing)

1. **Autopilot overshoot**: Caused by slider `input` events logging every tick and silently disengaging autopilot. Fix: separated modes, then removed manual controls entirely.

2. **Autopilot oscillation**: Ship bounced around target at tight thresholds (100km/50m/s). Fix: widened to 1000km/1km/s, zero velocity on arrival.

3. **Gravitational drift after arrival**: Ship drifted because gravity kept pulling after autopilot disengaged near a body. Fix: parked state ignores gravity.

4. **Reset not clearing AP button state**: Green ap-on class persisted after reset. Fix: explicit classList.remove in reset handler.

## Planned but not implemented

1. **New landmarks**: Capella (43 ly) and Polaris (430 ly) discussed as additions to fill the gap between Alpha Centauri (4.37 ly) and Pillars (6,500 ly). Would be added to the BODIES array in constants.js with appropriate mass/radius values.

2. **Reference tables**: A 1g acceleration table exists with all destinations showing ship time, Earth aging, and distance-at-time percentages. Tables at 2g, 55g, 250g were implied but not created.

3. **The v6 sim hasn't been flight-tested** with a real Moon flight + log paste by the owner.

## How to make changes

1. Edit the relevant JS module(s)
2. Open `index.html` in browser to test
3. Verify the flight log captures any new events
4. Create `docs/design/decision_v{N+1}.md` and `docs/design/design_v{N+1}.md`
5. Commit with a descriptive message
6. Push to origin (GitHub Pages auto-deploys)

## Owner interaction style

The owner steers by output, not by reading code. They will:
- Run the sim in a browser
- Paste flight log snapshots when something goes wrong
- Describe visual issues ("the panel is too tall", "the text is hanging off the right")
- Ask physics questions to validate the sim's behavior
- Expect proactive design suggestions ("Always provide constructive input to co-design with me")

They explicitly do NOT:
- Read JavaScript
- Use dev tools or console
- Debug code themselves
