# Decision v3 — 2026-07-26

## Changes from v2

1. **Texture images for celestial bodies**: Use real NASA/public domain images (from Solar System Scope, CC BY 4.0) for Earth, Moon, Sun instead of blurry gradient circles. Rendered clipped to circles on canvas. Bodies without textures keep programmatic rendering.

2. **Enhanced flight log**: Every UI action (thrust change, direction toggle, time scale change, destination selection, autopilot engage/disengage, pause/resume, reset) is logged with the ship's current position, velocity, and nearest body. Makes debugging and flight analysis possible by copy-pasting log output.

3. **Simulation controls**: Added PAUSE, RESUME, and STEP buttons. STEP advances one frame at current time scale while paused. Allows precise control for debugging overshoot and other physics issues.

4. **Autopilot fix**: Moved autopilot decision-making inside the physics substep loop (was running once per frame, now runs every substep). Added 1.5x safety margin on braking distance to prevent overshoot.
