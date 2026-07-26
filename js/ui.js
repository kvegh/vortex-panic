import { C, g0, LY, BODIES } from './constants.js';
import { roundTripTimes } from './physics.js';

export class UI {
    constructor(ship) {
        this.ship = ship;
        this.timeScale = 1;
        this.selectedDest = null;
        this.onReset = null;
        this.log = null;
        this.init();
    }

    setLog(log) { this.log = log; }

    init() {
        for (const radio of document.querySelectorAll('input[name="timescale"]')) {
            radio.addEventListener('change', () => {
                this.timeScale = parseFloat(radio.value);
                if (this.log) this.log.logUI(`TimeScale: ${this.fmtScale(this.timeScale)}`);
            });
        }

        this.apThrustG = 55;
        for (const radio of document.querySelectorAll('input[name="apthrust"]')) {
            radio.addEventListener('change', () => {
                this.apThrustG = parseFloat(radio.value);
                if (this.log) this.log.logUI(`AP thrust: ${this.apThrustG}g`);
            });
        }

        const dest = document.getElementById('destinations');
        for (const body of BODIES) {
            const lbl = document.createElement('label');
            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = 'dest';
            radio.value = body.name;
            radio.addEventListener('change', () => {
                this.selectedDest = body;
                if (this.log) this.log.logUI(`Destination: ${body.name}`);
            });
            lbl.appendChild(radio);
            lbl.appendChild(document.createTextNode(' ' + body.name));
            dest.appendChild(lbl);
        }

        document.getElementById('reset-btn').addEventListener('click', () => {
            if (this.log) this.log.logUI('RESET');
            if (this.onReset) this.onReset();
        });
    }

    getTimeScale() { return this.timeScale; }

    update(ship) {
        const spd = Math.abs(ship.velocity);
        document.getElementById('speed-c').textContent = Math.min(spd / C, 0.999999).toFixed(6) + ' c';
        document.getElementById('speed-kms').textContent = this.fmtNum(spd / 1000) + ' km/s';
        document.getElementById('speed-kmh').textContent = this.fmtNum(spd * 3.6) + ' km/h';
        document.getElementById('gamma').textContent = 'γ = ' + ship.gamma.toFixed(4);

        const dist = Math.abs(ship.position);
        document.getElementById('dist-km').textContent = this.fmtNum(dist / 1000) + ' km';
        document.getElementById('dist-ly').textContent = this.fmtLy(dist);

        document.getElementById('proper-time').textContent = this.fmtTime(ship.properTime);
        document.getElementById('coord-time').textContent = this.fmtTime(ship.coordinateTime);
        const dil = ship.coordinateTime > 1 ? (ship.coordinateTime / ship.properTime) : 1;
        document.getElementById('dilation').textContent = dil.toFixed(3) + 'x';

        document.getElementById('accel').textContent = (ship.thrustLevel / g0).toFixed(1);
        document.getElementById('fuel').textContent = (ship.fuelFraction * 100).toFixed(1) + '%';
        const fuelBar = document.getElementById('fuel-bar');
        fuelBar.style.width = (ship.fuelFraction * 100) + '%';
        fuelBar.style.background = ship.fuelFraction > 0.2 ? '#4488cc' : '#ff4444';

        if (this.selectedDest) {
            const d = Math.abs(this.selectedDest.position - ship.position);
            document.getElementById('eta').textContent = spd > 10 ? this.fmtTime(d / spd) : '—';
            document.getElementById('dest-name').textContent = this.selectedDest.name;
            document.getElementById('dest-dist').textContent = this.fmtDistBoth(d);
            if (ship.thrustLevel > 0) {
                const rt = roundTripTimes(d, ship.thrustLevel);
                document.getElementById('rt-earth').textContent = this.fmtTime(rt.coordTime);
                document.getElementById('rt-ship').textContent = this.fmtTime(rt.properTime);
            } else {
                document.getElementById('rt-earth').textContent = '—';
                document.getElementById('rt-ship').textContent = '—';
            }
        } else {
            document.getElementById('eta').textContent = 'select target';
            document.getElementById('dest-name').textContent = '—';
            document.getElementById('dest-dist').textContent = '';
            document.getElementById('rt-earth').textContent = '—';
            document.getElementById('rt-ship').textContent = '—';
        }
    }

    fmtNum(n) {
        const a = Math.abs(n);
        if (a < 1000) return n.toFixed(1);
        if (a < 1e6) return (n / 1e3).toFixed(1) + 'K';
        if (a < 1e9) return (n / 1e6).toFixed(1) + 'M';
        if (a < 1e12) return (n / 1e9).toFixed(1) + 'B';
        if (a < 1e15) return (n / 1e12).toFixed(1) + 'T';
        return n.toExponential(2);
    }

    fmtLy(meters) {
        const ly = meters / LY;
        if (ly < 0.001) return ly.toExponential(2) + ' ly';
        if (ly < 1000) return ly.toFixed(3) + ' ly';
        if (ly < 1e6) return (ly / 1e3).toFixed(1) + 'K ly';
        if (ly < 1e9) return (ly / 1e6).toFixed(1) + 'M ly';
        return (ly / 1e9).toFixed(1) + 'B ly';
    }

    fmtDistBoth(d) {
        return this.fmtNum(d / 1000) + ' km / ' + this.fmtLy(d);
    }

    fmtTime(s) {
        if (!isFinite(s) || s < 0) return '∞';
        if (s < 60) return s.toFixed(1) + 's';
        if (s < 3600) return (s / 60).toFixed(1) + ' min';
        if (s < 86400) return (s / 3600).toFixed(1) + ' hrs';
        if (s < 365.25 * 86400) return (s / 86400).toFixed(1) + ' days';
        const y = s / (365.25 * 86400);
        if (y < 1000) return y.toFixed(1) + ' yrs';
        if (y < 1e6) return (y / 1e3).toFixed(1) + 'K yrs';
        if (y < 1e9) return (y / 1e6).toFixed(1) + 'M yrs';
        return (y / 1e9).toFixed(1) + 'B yrs';
    }

    fmtScale(ts) {
        if (ts < 100) return ts.toFixed(0) + 'x';
        if (ts < 1e6) return (ts / 1e3).toFixed(1) + 'Kx';
        if (ts < 1e9) return (ts / 1e6).toFixed(1) + 'Mx';
        if (ts < 1e12) return (ts / 1e9).toFixed(1) + 'Bx';
        return (ts / 1e12).toFixed(1) + 'Tx';
    }
}
