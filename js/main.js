import { BODIES, SHIP_DEFAULTS } from './constants.js';
import { Ship } from './ship.js';
import { Renderer } from './renderer.js';
import { UI } from './ui.js';
import { Autopilot } from './autopilot.js';
import { FlightLog } from './flightlog.js';

const canvas = document.getElementById('canvas');
const ship = new Ship(SHIP_DEFAULTS);
const renderer = new Renderer(canvas);
const ui = new UI(ship);
const autopilot = new Autopilot(ship);
const log = new FlightLog();

log.add('[0s] Ship initialized in LEO — 400km above Earth');

ui.onReset = () => {
    ship.reset();
    autopilot.disengage();
    log.clear();
    log.add('[0s] Ship reset to LEO');
    document.getElementById('ap-btn').textContent = 'AUTOPILOT';
};

document.getElementById('log-copy').addEventListener('click', () => {
    navigator.clipboard.writeText(log.snapshot(ship, autopilot));
});

document.getElementById('log-snap').addEventListener('click', () => {
    log.add(log.snapshot(ship, autopilot));
});

document.getElementById('log-toggle').addEventListener('click', () => {
    const panel = document.getElementById('log-panel');
    panel.classList.toggle('hidden');
    document.getElementById('log-toggle').textContent = panel.classList.contains('hidden') ? 'SHOW' : 'HIDE';
});

document.getElementById('ap-btn').addEventListener('click', () => {
    if (autopilot.engaged) {
        autopilot.disengage();
        document.getElementById('ap-btn').textContent = 'AUTOPILOT';
    } else if (ui.selectedDest) {
        autopilot.setTarget(ui.selectedDest);
        autopilot.engage();
        document.getElementById('ap-btn').textContent = 'DISENGAGE';
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

    const timeScale = ui.getTimeScale();
    const dtSim = dtReal * timeScale;

    const maxSteps = 2000;
    const steps = Math.min(maxSteps, Math.max(1, Math.ceil(dtSim)));
    const subDt = dtSim / steps;
    for (let i = 0; i < steps; i++) {
        autopilot.update();
        ship.update(subDt, BODIES);
    }

    renderer.render(ship, BODIES);
    ui.update(ship);
    log.update(ship, autopilot, BODIES);
    requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
