import { C, G } from './constants.js';

export function lorentzFactor(v) {
    const beta2 = (v * v) / (C * C);
    if (beta2 >= 1) return 1e12;
    return 1 / Math.sqrt(1 - beta2);
}

export function properToCoordAccel(properAccel, v) {
    const gamma = lorentzFactor(v);
    return properAccel / (gamma * gamma * gamma);
}

export function gravitationalAccel(position, bodies) {
    let accel = 0;
    for (const body of bodies) {
        if (body.mass === 0) continue;
        const r = body.position - position;
        const absR = Math.abs(r);
        const minR = Math.max(absR, body.radius || 1000);
        accel += G * body.mass * Math.sign(r) / (minR * minR);
    }
    return accel;
}

export function fuelBurnRate(properAccel, mass, exhaustVelocity, gamma) {
    return Math.abs(properAccel) * mass / (exhaustVelocity * gamma);
}

export function roundTripTimes(distance, properAccel) {
    if (properAccel <= 0 || distance <= 0) return { coordTime: Infinity, properTime: Infinity };
    const d = distance / 2;
    const S = properAccel * d / (C * C);
    const tHalf = (C / properAccel) * Math.sqrt((S + 1) * (S + 1) - 1);
    const tauHalf = (C / properAccel) * Math.acosh(S + 1);
    return {
        coordTime: 4 * tHalf,
        properTime: 4 * tauHalf,
    };
}
