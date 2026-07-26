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

export function flightStateAtFraction(fraction, totalDist, accel, totalMass, dryMass, exhaustVelocity) {
    const D = totalDist;
    const a = accel;
    const x = fraction * D;
    const dHalf = D / 2;

    const S_half = a * dHalf / (C * C);
    const t_half = (C / a) * Math.sqrt(S_half * S_half + 2 * S_half);
    const tau_half = (C / a) * Math.acosh(S_half + 1);

    const inBrake = x > dHalf;
    const d = inBrake ? (D - x) : x;

    const S = a * d / (C * C);
    const gamma = S + 1;
    const v = (S > 0) ? C * Math.sqrt(1 - 1 / (gamma * gamma)) : 0;
    const t_d = (S > 0) ? (C / a) * Math.sqrt(S * S + 2 * S) : 0;
    const tau_d = (S > 0) ? (C / a) * Math.acosh(S + 1) : 0;

    const coordTime = inBrake ? (2 * t_half - t_d) : t_d;
    const properTime = inBrake ? (2 * tau_half - tau_d) : tau_d;

    const mass = Math.max(dryMass, totalMass * Math.exp(-a * properTime / exhaustVelocity));
    const fuelFraction = Math.max(0, (mass - dryMass) / (totalMass - dryMass));

    const correctionDist = D * 0.001;
    let phase;
    if (D - x <= correctionDist) {
        phase = 'correct';
    } else if (inBrake) {
        phase = 'brake';
    } else {
        phase = 'accel';
    }

    return { distTraveled: x, velocity: v, gamma, coordTime, properTime, mass, fuelFraction, phase };
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
