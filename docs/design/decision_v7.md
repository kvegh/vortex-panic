# Decision v7 — 2026-07-26

## Changes from v6

1. **Autopilot rewritten — midpoint-based flight profile**: Replaced the reactive "check stopping distance every substep" approach with a planned flight: full acceleration to the midpoint (50% of total distance), then symmetric full deceleration. Eliminates the accel/brake oscillation that spammed the flight log with dozens of phase switches during final approach. The old autopilot had no flight plan — it asked "should I brake yet?" every substep, and the 1.5× safety margin caused it to brake too early, overshoot the braking, re-accelerate, re-brake, etc. The new autopilot only falls back to stopping-distance logic in the last 0.1% of the journey (correction zone).

2. **Correction zone (last 0.1%)**: After the symmetric accel/decel brings the ship close to the target, a FINAL APPROACH phase uses stopping-distance logic to fine-tune arrival. This handles numerical errors from discrete time stepping and the midpoint detection. For short flights (Moon), the correction zone is ~384 km at low speed. For interstellar flights, it's a seamless handoff — the ship enters the zone at exactly the velocity that requires that distance to stop.

3. **10% progress milestones in flight log**: Every 10% of distance traveled, the log records a full status line: speed (c), gamma, G-force, fuel %, ship time, Earth time, dilation ratio, and distance to target. Provides structured observability of the flight profile without needing manual snapshots.

4. **New autopilot phase: FINAL APPROACH**: Added `correct` phase between BRAKING and ARRIVED. Flight log shows four clean phases: ACCELERATING → BRAKING → FINAL APPROACH → ARRIVED.

5. **RESET button moved to SIMULATION section**: Was incorrectly placed in the TIME SCALE section. Now lives with PAUSE and STEP where it belongs.
