import { C, g0 } from './constants.js';

export class Autopilot {
    constructor(ship) {
        this.ship = ship;
        this.target = null;
        this.engaged = false;
        this.accel = 1 * g0;
    }

    setTarget(body) { this.target = body; }

    engage() {
        if (this.target) this.engaged = true;
    }

    disengage() {
        this.engaged = false;
        this.ship.setThrust(0, 1);
    }

    update() {
        if (!this.engaged || !this.target) return;

        const dist = this.target.position - this.ship.position;
        const absDist = Math.abs(dist);
        const dir = Math.sign(dist);
        const v = Math.abs(this.ship.velocity);
        const gamma = this.ship.gamma;

        const stopDist = (C * C / this.accel) * (gamma - 1);

        if (absDist < 1000 && v < 100) {
            this.ship.setThrust(0, 1);
            this.engaged = false;
            return;
        }

        if (stopDist >= absDist * 0.9) {
            const brakeDir = -Math.sign(this.ship.velocity) || -dir;
            this.ship.setThrust(this.accel, brakeDir);
        } else {
            this.ship.setThrust(this.accel, dir);
        }
    }
}
