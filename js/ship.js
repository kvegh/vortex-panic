import { C } from './constants.js';
import { lorentzFactor, properToCoordAccel, gravitationalAccel, fuelBurnRate } from './physics.js';

export class Ship {
    constructor(defaults) {
        this.defaults = defaults;
        this.reset();
    }

    reset() {
        const d = this.defaults;
        this.position = d.position;
        this.velocity = d.velocity;
        this.totalMass = d.totalMass;
        this.mass = d.totalMass;
        this.dryMass = d.totalMass * (1 - d.fuelFraction);
        this.exhaustVelocity = d.exhaustVelocity;
        this.properTime = 0;
        this.coordinateTime = 0;
        this.thrustLevel = 0;
        this.thrustDirection = 1;
        this.gamma = 1;
        this.parked = true;
    }

    setThrust(level, direction) {
        this.thrustLevel = level;
        this.thrustDirection = direction;
        if (level > 0) this.parked = false;
    }

    get fuelFraction() {
        return Math.max(0, (this.mass - this.dryMass) / (this.totalMass - this.dryMass));
    }

    get hasFuel() {
        return this.mass > this.dryMass * 1.001;
    }

    setState(s) {
        this.position = s.position;
        this.velocity = s.velocity;
        this.mass = s.mass;
        this.properTime = s.properTime;
        this.coordinateTime = s.coordTime;
        this.gamma = s.gamma;
        this.thrustLevel = s.thrustLevel;
        this.thrustDirection = s.thrustDirection;
        this.parked = s.parked;
    }

    update(dt, bodies) {
        if (dt <= 0) return;

        this.gamma = lorentzFactor(this.velocity);

        let thrustAccel = 0;
        if (this.thrustLevel > 0 && this.hasFuel) {
            thrustAccel = properToCoordAccel(this.thrustLevel * this.thrustDirection, this.velocity);
            const dm = fuelBurnRate(this.thrustLevel, this.mass, this.exhaustVelocity, this.gamma) * dt;
            this.mass = Math.max(this.dryMass, this.mass - dm);
        }

        const gravAccel = this.parked ? 0 : gravitationalAccel(this.position, bodies);
        this.velocity += (thrustAccel + gravAccel) * dt;

        const maxV = C * 0.9999999;
        this.velocity = Math.max(-maxV, Math.min(maxV, this.velocity));

        this.gamma = lorentzFactor(this.velocity);
        this.position += this.velocity * dt;
        this.coordinateTime += dt;
        this.properTime += dt / this.gamma;
    }
}
