import { C, g0 } from './constants.js';

export class Autopilot {
    constructor(ship) {
        this.ship = ship;
        this.target = null;
        this.engaged = false;
        this.accel = 1 * g0;
        this.phase = '';
        this.startPos = 0;
        this.totalDist = 0;
    }

    setTarget(body) { this.target = body; }

    engage(accel) {
        if (this.target) {
            if (accel) this.accel = accel;
            this.engaged = true;
            this.phase = 'accel';
            this.startPos = this.ship.position;
            this.totalDist = Math.abs(this.target.position - this.ship.position);
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
            this.ship.parked = true;
            this.phase = 'arrived';
            this.engaged = false;
            return;
        }

        const correctionDist = this.totalDist * 0.001;

        if (absDist <= correctionDist) {
            this.phase = 'correct';
            const stopDist = (C * C / this.accel) * (gamma - 1);
            if (stopDist >= absDist) {
                const brakeDir = -Math.sign(this.ship.velocity) || -dir;
                this.ship.setThrust(this.accel, brakeDir);
            } else {
                this.ship.setThrust(this.accel, dir);
            }
        } else {
            const traveled = Math.abs(this.ship.position - this.startPos);
            if (traveled < this.totalDist / 2) {
                this.phase = 'accel';
                this.ship.setThrust(this.accel, dir);
            } else {
                this.phase = 'brake';
                const brakeDir = -Math.sign(this.ship.velocity) || -dir;
                this.ship.setThrust(this.accel, brakeDir);
            }
        }
    }
}
