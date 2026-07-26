# Decision v4 — 2026-07-26

## Changes from v3

1. **Autopilot engagement fix**: Clicking AUTOPILOT with no destination now logs a failure message instead of silently doing nothing. Manual thrust/direction changes auto-disengage autopilot to prevent silent conflicts. Autopilot visually updates the thrust slider when controlling thrust. Button turns green when engaged.

2. **Version in log**: Flight log shows "VORTEX PANIC v4" at startup and reset for traceability.

3. **Destination layout**: Two-column grid instead of single column, halving the vertical space.

4. **Subtitle readability**: Changed from #555 (invisible) to #8899aa (light steel blue) at 10px.

5. **Canvas space maximized**: Log output capped at 4 visible lines (scrollable). Control panel max-height reduced from 45vh to 35vh. Canvas gets the freed vertical space.

6. **Design collaboration**: Claude provides proactive design suggestions alongside fixes, not just code.
