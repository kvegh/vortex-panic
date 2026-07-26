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

export function computeAccelPhase(accel, totalMass, dryMass, exhaustVelocity) {
    const a = accel;
    const m_coast = dryMass + 0.5 * (totalMass - dryMass);
    const tau_accel = (exhaustVelocity / a) * Math.log(totalMass / m_coast);
    const S = Math.cosh(a * tau_accel / C) - 1;
    const gamma = S + 1;
    const maxV = C * 0.9999999;
    const v_cruise = (S > 0) ? Math.min(maxV, C * Math.sqrt(1 - 1 / (gamma * gamma))) : 0;
    const d_accel = S * C * C / a;
    const t_accel = (S > 0) ? (C / a) * Math.sqrt(S * S + 2 * S) : 0;
    return { d_accel, v_cruise, gamma_cruise: gamma, t_accel, tau_accel, S_accel: S, m_coast };
}

export function flightStateAtFraction(fraction, totalDist, accel, totalMass, dryMass, exhaustVelocity) {
    const D = totalDist;
    const a = accel;
    const x = fraction * D;
    const maxV = C * 0.9999999;

    const ap = computeAccelPhase(a, totalMass, dryMass, exhaustVelocity);

    if (D < 2 * ap.d_accel) {
        return flightStateMidpoint(fraction, D, a, totalMass, dryMass, exhaustVelocity);
    }

    const d_coast = D - 2 * ap.d_accel;
    const correctionDist = D * 0.001;

    if (x <= ap.d_accel) {
        const S = a * x / (C * C);
        const gamma = S + 1;
        const v = (S > 0) ? Math.min(maxV, C * Math.sqrt(1 - 1 / (gamma * gamma))) : 0;
        const t = (S > 0) ? (C / a) * Math.sqrt(S * S + 2 * S) : 0;
        const tau = (S > 0) ? (C / a) * Math.acosh(S + 1) : 0;
        const mass = Math.max(dryMass, totalMass * Math.exp(-a * tau / exhaustVelocity));
        const fuelFraction = Math.max(0, (mass - dryMass) / (totalMass - dryMass));
        return { distTraveled: x, velocity: v, gamma, coordTime: t, properTime: tau, mass, fuelFraction, phase: 'accel' };
    }

    if (x <= ap.d_accel + d_coast) {
        const coast_d = x - ap.d_accel;
        const t_coast = coast_d / ap.v_cruise;
        const tau_coast = t_coast / ap.gamma_cruise;
        const coordTime = ap.t_accel + t_coast;
        const properTime = ap.tau_accel + tau_coast;
        const phase = (D - x <= correctionDist) ? 'correct' : 'coast';
        return { distTraveled: x, velocity: ap.v_cruise, gamma: ap.gamma_cruise, coordTime, properTime, mass: ap.m_coast, fuelFraction: 0.5, phase };
    }

    const d_remaining = D - x;
    const S = a * d_remaining / (C * C);
    const gamma = S + 1;
    const v = (S > 0) ? Math.min(maxV, C * Math.sqrt(1 - 1 / (gamma * gamma))) : 0;
    const t_rem = (S > 0) ? (C / a) * Math.sqrt(S * S + 2 * S) : 0;
    const tau_rem = (S > 0) ? (C / a) * Math.acosh(S + 1) : 0;

    const t_coast_total = d_coast / ap.v_cruise;
    const tau_coast_total = t_coast_total / ap.gamma_cruise;

    const tau_decel_elapsed = ap.tau_accel - tau_rem;
    const coordTime = ap.t_accel + t_coast_total + (ap.t_accel - t_rem);
    const properTime = ap.tau_accel + tau_coast_total + tau_decel_elapsed;

    const mass = Math.max(dryMass, ap.m_coast * Math.exp(-a * tau_decel_elapsed / exhaustVelocity));
    const fuelFraction = Math.max(0, (mass - dryMass) / (totalMass - dryMass));

    let phase;
    if (D - x <= correctionDist) {
        phase = 'correct';
    } else {
        phase = 'brake';
    }

    return { distTraveled: x, velocity: v, gamma, coordTime, properTime, mass, fuelFraction, phase };
}

function flightStateMidpoint(fraction, totalDist, accel, totalMass, dryMass, exhaustVelocity) {
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
    const maxV = C * 0.9999999;
    const v = (S > 0) ? Math.min(maxV, C * Math.sqrt(1 - 1 / (gamma * gamma))) : 0;
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
