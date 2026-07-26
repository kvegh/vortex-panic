# Decision v6 — 2026-07-26

## Changes from v5

1. **Manual thrust removed**: Dropped the THRUST section entirely (slider, direction button, all event handlers). Ship is now autopilot-only. The thrust engine in ship.js remains — autopilot calls `setThrust()`. All manual-specific code removed: `onManualThrust` callback, `updateThrustDisplay`, `disableManualControls`, `enableManualControls`, `.braking` CSS class, range input styling.

2. **Time scale fixed steps**: Replaced continuous logarithmic slider with 8 fixed radio buttons: 1x, 10x, 50x, 100x, 1Kx, 10Kx, 100Kx, 1Mx. Eliminates slider log spam and gives predictable, repeatable time scales.

3. **Autopilot thrust presets updated**: Four levels based on research into sustained g-force tolerances:
   - Human 1g — comfortable indefinitely
   - Hardened 2g — trained military crew, sustainable for days
   - Unmanned 55g — hardened electronics limit (default)
   - Fantasy 250g — deep relativistic time dilation

4. **Dead code cleanup**: Removed CSS for `input[type="range"]` and `button.braking` — no sliders or manual direction button remain.
