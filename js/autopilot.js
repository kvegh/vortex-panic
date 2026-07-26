import { C, g0 } from './constants.js';

export class Autopilot {
    constructor(ship) {
        this.ship = ship;
        this.target = null;
        this.engaged = false;
        this.accel = 1 * g0;
        this.phase = '';
    }

    setTarget(body) { this.target = body; }

    engage() {
        if (this.target) {
            this.engaged = true;
            this.phase = 'accel';
        }
    }

    disengage() {
        this.engaged = false;
        this.phase = '';
        this.ship.setThrust(0, 1);
    }

    update() {
        if (!this.engaged || !this.target) return;

        const dist = this.target.position - this.ship.position;
        const absDist = Math.abs(dist);
        const dir = Math.sign(dist);
        const v = Math.abs(this.ship.velocity);
        const gamma = this.ship.gamma;

        if (absDist < 1e6 && v < 1000) {
            this.ship.setThrust(0, 1);
            this.ship.velocity = 0;
            this.phase = 'arrived';
            this.engaged = false;
            return;
        }

        const stopDist = (C * C / this.accel) * (gamma - 1);
        const safetyMargin = 1.5;

        if (stopDist * safetyMargin >= absDist) {
            this.phase = 'brake';
            const brakeDir = -Math.sign(this.ship.velocity) || -dir;
            this.ship.setThrust(this.accel, brakeDir);
        } else {
            this.phase = 'accel';
            this.ship.setThrust(this.accel, dir);
        }
    }
}
