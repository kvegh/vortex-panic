import { C, g0, LY, AU, BODIES } from './constants.js';

export class FlightLog {
    constructor(maxEntries = 500) {
        this.entries = [];
        this.maxEntries = maxEntries;
        this.el = document.getElementById('log-content');
        this.lastPhase = '';
        this.lastSpeedBracket = -1;
        this.loggedBodies = new Set();
        this.frameCount = 0;
        this.ship = null;
    }

    setShip(ship) { this.ship = ship; }

    posTag() {
        if (!this.ship) return '';
        return ` @${this.fmtDist(this.ship.position)} v=${(Math.abs(this.ship.velocity)/C).toFixed(6)}c`;
    }

    nearestBody() {
        if (!this.ship) return '';
        let nearest = null;
        let minD = Infinity;
        for (const b of BODIES) {
            const d = Math.abs(b.position - this.ship.position);
            if (d < minD) { minD = d; nearest = b; }
        }
        return nearest ? ` near=${nearest.name}(${this.fmtDist(minD)})` : '';
    }

    stamp() {
        if (!this.ship) return '[?]';
        return `[${this.fmtTime(this.ship.coordinateTime)}]`;
    }

    add(msg) {
        this.entries.push(msg);
        if (this.entries.length > this.maxEntries) this.entries.shift();
        if (this.el) {
            this.el.textContent = this.entries.join('\n');
            this.el.scrollTop = this.el.scrollHeight;
        }
    }

    logUI(action) {
        this.add(`${this.stamp()} UI: ${action}${this.posTag()}${this.nearestBody()}`);
    }

    fmtTime(s) {
        if (s < 60) return s.toFixed(1) + 's';
        if (s < 3600) return (s / 60).toFixed(1) + 'min';
        if (s < 86400) return (s / 3600).toFixed(1) + 'h';
        const y = s / (365.25 * 86400);
        if (y < 1) return (s / 86400).toFixed(1) + 'd';
        if (y < 1e6) return y.toFixed(1) + 'y';
        return y.toExponential(2) + 'y';
    }

    fmtDist(d) {
        const a = Math.abs(d);
        if (a < 1e6) return (a / 1e3).toFixed(0) + 'km';
        if (a < AU * 0.1) return (a / 1e9).toFixed(2) + 'Mkm';
        if (a < LY * 0.1) return (a / AU).toFixed(2) + 'AU';
        return (a / LY).toFixed(3) + 'ly';
    }

    update(ship, autopilot, bodies) {
        this.frameCount++;
        if (this.frameCount % 30 !== 0) return;

        const t = this.fmtTime(ship.coordinateTime);
        const v = Math.abs(ship.velocity) / C;
        const pos = ship.position;

        const speedBracket = v < 0.001 ? 0 : v < 0.01 ? 1 : v < 0.1 ? 2 : v < 0.5 ? 3 : v < 0.9 ? 4 : v < 0.99 ? 5 : 6;
        if (speedBracket !== this.lastSpeedBracket && speedBracket > 0) {
            const labels = ['', '0.1%c', '1%c', '10%c', '50%c', '90%c', '99%c'];
            this.add(`[${t}] MILESTONE: ${labels[speedBracket]} (${v.toFixed(6)}c) γ=${ship.gamma.toFixed(3)} @${this.fmtDist(pos)}`);
            this.lastSpeedBracket = speedBracket;
        }

        if (autopilot.phase !== this.lastPhase && autopilot.phase) {
            const phaseLabels = { accel: 'ACCELERATING', brake: 'BRAKING', arrived: 'ARRIVED' };
            const label = phaseLabels[autopilot.phase] || autopilot.phase;
            const target = autopilot.target ? autopilot.target.name : '?';
            const targetDist = autopilot.target ? this.fmtDist(Math.abs(autopilot.target.position - pos)) : '?';
            this.add(`[${t}] AP: ${label} → ${target} (dist=${targetDist}) v=${v.toFixed(6)}c @${this.fmtDist(pos)}`);
            this.lastPhase = autopilot.phase;
        }

        for (const body of bodies) {
            const dist = Math.abs(body.position - pos);
            const key = body.name;
            if (dist < body.radius * 5 && dist > 0 && !this.loggedBodies.has(key + '_near')) {
                this.add(`[${t}] APPROACH: ${body.name} dist=${this.fmtDist(dist)} v=${v.toFixed(6)}c @${this.fmtDist(pos)}`);
                this.loggedBodies.add(key + '_near');
            }
            if (dist > body.radius * 10 && this.loggedBodies.has(key + '_near') && !this.loggedBodies.has(key + '_passed')) {
                if (body.position < pos) {
                    this.add(`[${t}] PASSED: ${body.name} now ${this.fmtDist(dist)} behind @${this.fmtDist(pos)}`);
                    this.loggedBodies.add(key + '_passed');
                }
            }
        }

        if (!ship.hasFuel && !this.loggedBodies.has('_nofuel')) {
            this.add(`[${t}] *** FUEL EXHAUSTED *** v=${v.toFixed(6)}c γ=${ship.gamma.toFixed(3)} @${this.fmtDist(pos)}`);
            this.loggedBodies.add('_nofuel');
        }
    }

    snapshot(ship, autopilot) {
        const v = Math.abs(ship.velocity) / C;
        const pos = ship.position;
        const bodyDists = BODIES.map(b => `  ${b.name}: ${this.fmtDist(Math.abs(b.position - pos))} ${b.position < pos ? '(behind)' : '(ahead)'}`);
        const lines = [
            '=== FLIGHT LOG SNAPSHOT ===',
            `Position: ${this.fmtDist(pos)} from Earth (${pos.toExponential(4)} m)`,
            `Velocity: ${v.toFixed(9)}c (${(Math.abs(ship.velocity)/1000).toFixed(1)} km/s)`,
            `Gamma: ${ship.gamma.toFixed(6)}`,
            `Proper time: ${this.fmtTime(ship.properTime)}`,
            `Coord time: ${this.fmtTime(ship.coordinateTime)}`,
            `Mass: ${(ship.mass/1000).toFixed(0)}t / ${(ship.totalMass/1000).toFixed(0)}t`,
            `Fuel: ${(ship.fuelFraction*100).toFixed(1)}%`,
            `Thrust: ${(ship.thrustLevel/g0).toFixed(1)}g dir=${ship.thrustDirection>0?'FWD':'REV'}`,
            `Autopilot: ${autopilot.engaged ? autopilot.phase : 'off'}${autopilot.target ? ' → '+autopilot.target.name : ''}`,
            '--- DISTANCES ---',
            ...bodyDists,
            '--- RECENT LOG ---',
            ...this.entries.slice(-30),
            '=========================',
        ];
        return lines.join('\n');
    }

    clear() {
        this.entries = [];
        this.lastPhase = '';
        this.lastSpeedBracket = -1;
        this.loggedBodies = new Set();
        if (this.el) this.el.textContent = '';
    }
}
