# Decision v5 — 2026-07-26

## Changes from v4

1. **Autopilot/manual mode separation**: Manual thrust controls (slider, direction button) are now disabled and greyed out while autopilot is engaged. Prevents accidental disengagement mid-flight. Controls re-enable on DISENGAGE click, arrival, or RESET.

2. **Slider log spam fix**: Thrust and time scale sliders now log only on release ('change' event), not on every intermediate tick ('input' event). A single slider drag previously generated 20-30 log entries, burying real events like autopilot engagement.

3. **Autopilot arrival convergence**: Widened arrival threshold from 100km/50m·s⁻¹ to 1000km/1km·s⁻¹. The old thresholds caused the ship to oscillate indefinitely around the Moon (~700km amplitude) without ever satisfying both conditions simultaneously. Velocity is zeroed on arrival.

4. **Parked state**: Ship has a "parked" flag. When parked, gravity is ignored and the ship stays put. Ship starts parked on Earth surface. Autopilot sets parked on arrival. Any thrust clears parked. "Parked in stable orbit" text shown above ship on canvas.

5. **Ship starts on Earth surface**: Initial position changed from 6,771km (LEO) to 6,371km (Earth radius). Ship sits stationary until the player launches.

6. **G-force display**: Moved to compact "G: X.X" line in FLIGHT section. Removed from canvas overlay. Informational only — no cap enforced (unmanned ship).

7. **Autopilot thrust presets**: Four configurable acceleration levels replace the hardcoded 1g:
   - Human 1g — comfortable indefinitely
   - Hardened 2g — trained military crew, sustained for days
   - Unmanned 55g — hardened electronics limit (default)
   - Fantasy 250g — deep relativistic time dilation
   Selected via radio buttons in DESTINATION section. Both accel and brake phases use the selected value.

8. **Destination section widened**: min-width 260px, flex:2 to accommodate two-column destination grid and AP thrust presets without overflow.

9. **Log panel height reduced**: Tighter padding, smaller buttons, reduced line-height to minimize vertical footprint.
