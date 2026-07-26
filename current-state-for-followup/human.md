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

The project owner's programming background: no JavaScript, a little HTML, tiny fragments of Python, some Ansible, Bash, teenie tiny C. They are NOT a web developer. They steer by looking at the output — running the sim in a browser, pasting flight log snapshots, describing what's wrong visually. They want:

1. Proactive design suggestions — don't just implement requests, co-design the experience ("Always provide constructive input to co-design with me")
2. Physics accuracy — the sim should reflect real relativistic physics faithfully
3. Clean, minimal UI — maximum canvas space, compact controls
4. Every UI action logged — full observability through the flight log

The owner validates physics by asking sanity-check questions ("wait, Edge is 46B ly but we get there in 47 yrs?", "1g for 1 year = 0.77c????", "how can Earth age 1300 years in 10 days?"). These aren't confusion — they're the owner cross-checking simulation behavior against intuition. Answer with the math and explain why the surprising result is correct.

## README.md is outdated

The README says "2D", mentions "gravity slingshots" and "pilot a spacecraft". The sim is actually 1D, has no slingshot mechanic, and is autopilot-only. The README predates most of the development. Update it when convenient.

## Thrust preset research

The four thrust presets were chosen based on research into sustained g-force tolerances:

- **Human 1g**: Comfortable indefinitely. Earth-normal gravity. The "baseline" that makes relativistic travel human-scale thanks to the c/g ~ 1 year coincidence.
- **Hardened 2g**: Trained military crew or fighter pilots can sustain this for extended periods (hours to days). Roughly the max for "battle-hardened humans".
- **Unmanned 55g**: Based on research into hardened electronics and spacecraft components. Military electronics are rated to ~50-100g sustained. 55g is the practical limit for robotic probes. This is the default preset.
- **Fantasy 250g**: No physical justification — pure sci-fi. Chosen because at 200g you reach 0.99998c in 10 days (essentially c), so going higher has diminishing returns. 250g gives deep relativistic time dilation and extreme twin paradox effects. Originally considered 500g, then researched down through 200g/300g/400g/450g/475g calculations to find that 200g+ is effectively "at c" for all practical purposes, so 250g was chosen as a round number.

## Reference table — 1g acceleration

Ship proper time (one-way, accel to midpoint + decel to arrival), Earth aging (round trip), and distance covered at 10%/50%/90% of ship journey time:

| Destination | Distance | Ship (1-way) | Earth (round trip) | @10% | @50% | @90% |
|---|---|---|---|---|---|---|
| Moon | 384,400 km | 3.5 hrs | 7.0 hrs | 2% | 50% | 98% |
| Sun | 1 AU | 2.9 days | 5.7 days | 2% | 50% | 98% |
| Pluto | 39.5 AU | 18 days | 36 days | 2% | 50% | 98% |
| Alpha Centauri | 4.37 ly | 3.6 yrs | 12.0 yrs | 1.5% | 50% | 98.5% |
| Capella* | 43 ly | 7.4 yrs | 89.8 yrs | 0.7% | 50% | 99.3% |
| Polaris* | 430 ly | 11.8 yrs | 864 yrs | 0.19% | 50% | 99.81% |
| Pillars | 6,500 ly | 17.1 yrs | 13.0K yrs | 0.03% | 50% | 99.97% |
| Sgr A* | 26,000 ly | 19.8 yrs | 52.0K yrs | 0.01% | 50% | 99.99% |
| Andromeda | 2.5M ly | 28.6 yrs | 5.0M yrs | <0.01% | 50% | >99.99% |
| Supercluster | 100M ly | 35.7 yrs | 200M yrs | <0.01% | 50% | >99.99% |
| Edge | 46.5B ly | 47.6 yrs | 93.0B yrs | <0.01% | 50% | >99.99% |

*Capella and Polaris are not yet in the sim — discussed as planned additions.

The @10%/@90% columns show a striking pattern: nearby targets (Moon through Pluto) are symmetric 2%/98% — purely Newtonian. As distances grow, the percentages skew dramatically because the ship spends most of its proper time at near-c speeds, covering almost all the distance in the last fraction of journey time.

## Discussed but not yet implemented

- **Two new landmarks**: Capella (43 ly, quadruple star system in Auriga) and Polaris (430 ly, the North Star) — to fill the logarithmic gap between Alpha Centauri (4.37 ly) and Pillars of Creation (6,500 ly). Already researched and calculated in the reference table above. Would be added to the BODIES array in `js/constants.js`.
- **Reference tables at other g-levels**: Tables at 2g, 55g, and 250g were implied ("Table 1" suggests more) but not yet produced.
- **The sim hasn't been flight-tested at v6** by the owner yet. The Moon flight was tested through v5 but v6 (autopilot-only, fixed time scale) hasn't been verified with a real flight log paste.

## Key physics insights for anyone continuing

1. **c/g ~ 1 year (354 days)**: This is a fundamental coincidence of nature. It means 1g acceleration for 1 year gets you to ~0.77c. This makes 1g the "human-scale" relativistic acceleration — comfortable and gets you to relativistic speeds in a familiar timeframe.

2. **Proper time grows logarithmically**: Ship time = (2c/a) * arccosh(1 + ad/2c²). For large distances, arccosh ≈ ln, so proper time grows as the logarithm of distance. This is why 46.5 billion light-years is reachable in ~48 years of ship time at 1g — the logarithm flattens everything out.

3. **No air drag in space**: On Earth, a car at "2g" reaches 350 km/h and stops accelerating because air drag = engine force. In space, there is no drag. 1g stays 1g forever. This is why constant acceleration is so powerful — the ship never hits a "top speed" from drag, only the relativistic velocity limit (gamma^3 suppression of coordinate acceleration).

4. **The twin paradox is the point**: The sim exists to make you feel the twin paradox viscerally. You fly to Alpha Centauri in 3.6 years of ship time, but Earth ages 12 years. You fly to the Edge in 48 years, Earth ages 93 billion years. The flight log shows both clocks diverging in real time.

5. **Above ~200g, diminishing returns**: At 200g you reach 0.99998c in 10 days. Going higher (250g, 500g) barely changes the cruise speed but does reduce ship proper time marginally. This is why 250g was chosen as the "fantasy" cap rather than 500g or 1000g.
