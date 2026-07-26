import { C, g0 } from './constants.js';
import { computeAccelPhase } from './physics.js';

export class Autopilot {
    constructor(ship) {
        this.ship = ship;
        this.target = null;
        this.engaged = false;
        this.accel = 1 * g0;
        this.phase = '';
        this.startPos = 0;
        this.totalDist = 0;
        this.useCoast = false;
        this.accelDist = 0;
        this.initialFuelMass = 0;
    }

    setTarget(body) { this.target = body; }

    engage(accel) {
        if (this.target) {
            if (accel) this.accel = accel;
            this.engaged = true;
            this.phase = 'accel';
            this.startPos = this.ship.position;
            this.totalDist = Math.abs(this.target.position - this.ship.position);
            this.initialFuelMass = this.ship.mass - this.ship.dryMass;

            const ap = computeAccelPhase(this.accel, this.ship.totalMass, this.ship.dryMass, this.ship.exhaustVelocity);
            this.accelDist = ap.d_accel;
            this.useCoast = this.totalDist >= 2 * ap.d_accel;
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

        if (absDist < 1e6 && v < 1000) {
            this.ship.setThrust(0, 1);
            this.ship.velocity = 0;
            this.ship.parked = true;
            this.phase = 'arrived';
            this.engaged = false;
            return;
        }

        if (this.useCoast) {
            this.updateCoastProfile(dist, absDist, dir, v);
        } else {
            this.updateMidpointProfile(dist, absDist, dir, v);
        }
    }

    updateCoastProfile(dist, absDist, dir, v) {
        const currentFuel = this.ship.mass - this.ship.dryMass;
        const halfFuel = this.initialFuelMass * 0.5;
        const traveled = Math.abs(this.ship.position - this.startPos);
        const correctionDist = this.totalDist * 0.001;

        if (absDist <= correctionDist) {
            this.phase = 'correct';
            const gamma = this.ship.gamma;
            const stopDist = (C * C / this.accel) * (gamma - 1);
            if (stopDist >= absDist) {
                const brakeDir = -Math.sign(this.ship.velocity) || -dir;
                this.ship.setThrust(this.accel, brakeDir);
            } else {
                this.ship.setThrust(this.accel, dir);
            }
            return;
        }

        if (this.phase === 'accel') {
            this.ship.setThrust(this.accel, dir);
            if (currentFuel <= halfFuel) {
                this.accelDist = traveled;
                this.phase = 'coast';
            }
        } else if (this.phase === 'coast') {
            this.ship.setThrust(0, dir);
            if (absDist <= this.accelDist) {
                this.phase = 'brake';
            }
        } else if (this.phase === 'brake') {
            const brakeDir = -Math.sign(this.ship.velocity) || -dir;
            this.ship.setThrust(this.accel, brakeDir);
        }
    }

    updateMidpointProfile(dist, absDist, dir, v) {
        const correctionDist = this.totalDist * 0.001;

        if (absDist <= correctionDist) {
            this.phase = 'correct';
            const gamma = this.ship.gamma;
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
