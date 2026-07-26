import { C, BODIES, SHIP_DEFAULTS } from './constants.js';
import { Ship } from './ship.js';
import { Renderer } from './renderer.js';
import { UI } from './ui.js';
import { Autopilot } from './autopilot.js';
import { FlightLog } from './flightlog.js';
import { flightStateAtFraction } from './physics.js';

const canvas = document.getElementById('canvas');
const ship = new Ship(SHIP_DEFAULTS);
const renderer = new Renderer(canvas);
const ui = new UI(ship);
const autopilot = new Autopilot(ship);
const log = new FlightLog();

log.setShip(ship);
ui.setLog(log);

let paused = false;

log.add('[0s] VORTEX PANIC v10 — Parked on Earth surface');

ui.onReset = () => {
    ship.reset();
    autopilot.disengage();
    log.clear();
    log.add('[0s] VORTEX PANIC v10 — Parked on Earth surface');
    document.getElementById('ap-btn').textContent = 'AUTOPILOT';
    document.getElementById('ap-btn').classList.remove('ap-on');
    paused = false;
    document.getElementById('pause-btn').textContent = '⏸ PAUSE';
};

document.getElementById('pause-btn').addEventListener('click', () => {
    paused = !paused;
    document.getElementById('pause-btn').textContent = paused ? '▶ RESUME' : '⏸ PAUSE';
    log.logUI(paused ? 'PAUSED' : 'RESUMED');
});

function stepToPercent(targetPct) {
    if (autopilot.totalDist <= 0) {
        log.logUI('STEP — no flight plan active');
        return;
    }
    if (targetPct < 0) targetPct = 0;
    if (targetPct > 100) targetPct = 100;

    const fraction = targetPct / 100;
    const dir = Math.sign(autopilot.target.position - autopilot.startPos);
    const s = flightStateAtFraction(fraction, autopilot.totalDist, autopilot.accel,
        ship.totalMass, ship.dryMass, ship.exhaustVelocity);

    ship.setState({
        position: autopilot.startPos + dir * s.distTraveled,
        velocity: dir * s.velocity,
        mass: s.mass,
        properTime: s.properTime,
        coordTime: s.coordTime,
        gamma: s.gamma,
        thrustLevel: autopilot.accel,
        thrustDirection: s.phase === 'brake' || s.phase === 'correct' ? -dir : dir,
        parked: targetPct === 0,
    });

    autopilot.phase = s.phase;
    if (targetPct > 0 && targetPct < 100) {
        autopilot.engaged = true;
        document.getElementById('ap-btn').textContent = '⚡ DISENGAGE';
        document.getElementById('ap-btn').classList.add('ap-on');
    }
    if (targetPct >= 100) {
        ship.velocity = 0;
        ship.parked = true;
        autopilot.phase = 'arrived';
        autopilot.engaged = false;
        document.getElementById('ap-btn').textContent = 'AUTOPILOT';
        document.getElementById('ap-btn').classList.remove('ap-on');
    }

    log.lastProgressMilestone = Math.floor(fraction * 10) - 1;
    const vFrac = Math.abs(ship.velocity) / C;
    log.lastSpeedBracket = vFrac < 0.001 ? 0 : vFrac < 0.01 ? 1 : vFrac < 0.1 ? 2 : vFrac < 0.5 ? 3 : vFrac < 0.9 ? 4 : vFrac < 0.99 ? 5 : 6;

    if (!paused) {
        paused = true;
        document.getElementById('pause-btn').textContent = '▶ RESUME';
    }
    renderer.render(ship, BODIES, paused, autopilot);
    ui.update(ship);
    log.logUI(`STEP → ${targetPct}%`);
}

document.getElementById('step-fwd').addEventListener('click', () => {
    const traveled = Math.abs(ship.position - autopilot.startPos);
    const pct = autopilot.totalDist > 0 ? (traveled / autopilot.totalDist) * 100 : 0;
    const target = Math.min(100, Math.ceil(pct / 10 + 0.001) * 10);
    stepToPercent(target);
});

document.getElementById('step-back').addEventListener('click', () => {
    const traveled = Math.abs(ship.position - autopilot.startPos);
    const pct = autopilot.totalDist > 0 ? (traveled / autopilot.totalDist) * 100 : 0;
    const target = Math.max(0, Math.floor(pct / 10 - 0.001) * 10 - 10);
    stepToPercent(target);
});

document.getElementById('log-copy').addEventListener('click', () => {
    const text = log.snapshot(ship, autopilot);
    navigator.clipboard.writeText(text).then(() => {
        log.logUI('Log copied to clipboard');
    });
});

document.getElementById('log-snap').addEventListener('click', () => {
    log.add(log.snapshot(ship, autopilot));
    log.logUI('Snapshot taken');
});

document.getElementById('log-toggle').addEventListener('click', () => {
    const panel = document.getElementById('log-panel');
    panel.classList.toggle('hidden');
    const hidden = panel.classList.contains('hidden');
    document.getElementById('log-toggle').textContent = hidden ? 'SHOW' : 'HIDE';
    log.logUI(hidden ? 'Log HIDDEN' : 'Log SHOWN');
});

document.getElementById('ap-btn').addEventListener('click', () => {
    if (autopilot.engaged) {
        autopilot.disengage();
        document.getElementById('ap-btn').textContent = 'AUTOPILOT';
        document.getElementById('ap-btn').classList.remove('ap-on');
        log.logUI('Autopilot disengaged');
    } else if (ui.selectedDest) {
        autopilot.setTarget(ui.selectedDest);
        autopilot.engage(ui.apThrustG * 9.80665);
        document.getElementById('ap-btn').textContent = '⚡ DISENGAGE';
        document.getElementById('ap-btn').classList.add('ap-on');
        log.logUI(`Autopilot engaged → ${ui.selectedDest.name} at ${ui.apThrustG}g`);
    } else {
        log.logUI('Autopilot FAILED — no destination selected!');
    }
});

canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    renderer.setZoom(renderer.pixelsPerDecade + (e.deltaY > 0 ? -2 : 2));
}, { passive: false });

let lastTime = null;

function loop(timestamp) {
    if (lastTime === null) lastTime = timestamp;
    const dtReal = Math.min((timestamp - lastTime) / 1000, 0.1);
    lastTime = timestamp;

    if (!paused) {
        const timeScale = ui.getTimeScale();
        const dtSim = dtReal * timeScale;

        const maxSteps = 2000;
        const steps = Math.min(maxSteps, Math.max(1, Math.ceil(dtSim)));
        const subDt = dtSim / steps;
        for (let i = 0; i < steps; i++) {
            autopilot.update();
            ship.update(subDt, BODIES);
        }
    }

    if (!autopilot.engaged && autopilot.phase === 'arrived') {
        document.getElementById('ap-btn').textContent = 'AUTOPILOT';
        document.getElementById('ap-btn').classList.remove('ap-on');
        autopilot.phase = '';
    }
    renderer.render(ship, BODIES, paused, autopilot);
    ui.update(ship);
    log.update(ship, autopilot, BODIES);
    requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
