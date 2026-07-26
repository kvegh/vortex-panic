export const C = 299792458;
export const G = 6.674e-11;
export const AU = 1.496e11;
export const LY = 9.461e15;
export const g0 = 9.80665;

export const BODIES = [
    { name: 'Earth',       position: 0,              mass: 5.972e24,  radius: 6.371e6,  color: '#4488cc' },
    { name: 'Moon',        position: 3.844e8,        mass: 7.342e22,  radius: 1.737e6,  color: '#aaaaaa' },
    { name: 'Sun',         position: 1 * AU,         mass: 1.989e30,  radius: 6.96e8,   color: '#ffcc33' },
    { name: 'Pluto',       position: 39.5 * AU,      mass: 1.309e22,  radius: 1.188e6,  color: '#cc9966' },
    { name: 'α Centauri',  position: 4.37 * LY,      mass: 2.187e30,  radius: 8.51e8,   color: '#fff5e0' },
    { name: 'Pillars',     position: 6500 * LY,      mass: 1e34,      radius: 4 * LY,   color: '#cc66aa' },
    { name: 'Sgr A*',      position: 26000 * LY,     mass: 8.26e36,   radius: 2.2e10,   color: '#ff4444' },
    { name: 'Andromeda',   position: 2.5e6 * LY,     mass: 2.5e42,    radius: 1.1e21,   color: '#aaccff' },
    { name: 'Supercluster', position: 1e8 * LY,      mass: 1e46,      radius: 5e22,     color: '#8866cc' },
    { name: 'Edge',        position: 46.5e9 * LY,    mass: 0,         radius: 0,        color: '#ff8800' },
];

export const SHIP_DEFAULTS = {
    position: 6.771e6,
    velocity: 0,
    totalMass: 1e6,
    fuelFraction: 0.9,
    exhaustVelocity: 0.1 * C,
};
