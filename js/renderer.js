import { LY, AU } from './constants.js';

const TEXTURES = {
    'Earth':     'img/earth.jpg',
    'Moon':      'img/moon.jpg',
    'Sun':       'img/sun.jpg',
};

export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.pixelsPerDecade = 45;
        this.shipScreenFrac = 0.7;
        this.shipScreenX = 0;
        this.shipScreenY = 0;
        this.stars = [];
        for (let i = 0; i < 200; i++) {
            this.stars.push({
                x: Math.random(),
                y: Math.random(),
                b: Math.random() * 0.7 + 0.3,
                s: Math.random() * 1.5 + 0.5,
            });
        }
        this.images = {};
        this.loadTextures();
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    loadTextures() {
        for (const [name, src] of Object.entries(TEXTURES)) {
            const img = new Image();
            img.src = src;
            this.images[name] = img;
        }
        this.shipImg = new Image();
        this.shipImg.src = 'img/ship_creativecommons.png';
    }

    resize() {
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        this.shipScreenX = this.canvas.width * this.shipScreenFrac;
        this.shipScreenY = this.canvas.height * 0.5;
    }

    worldToScreen(objPos, shipPos) {
        const delta = objPos - shipPos;
        const abs = Math.abs(delta);
        if (abs < 1) return this.shipScreenX;
        const sign = Math.sign(delta);
        const logDist = Math.log10(1 + abs) * this.pixelsPerDecade;
        return this.shipScreenX - sign * logDist;
    }

    bodyScreenRadius(radius, distance) {
        if (radius <= 0) return 3;
        if (distance < radius) return this.canvas.height * 0.4;
        const angular = radius / distance;
        return Math.max(3, Math.min(angular * this.canvas.height * 0.3, this.canvas.height * 0.4));
    }

    render(ship, bodies, paused, autopilot) {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        ctx.fillStyle = '#0a0a1a';
        ctx.fillRect(0, 0, w, h);

        for (const star of this.stars) {
            ctx.fillStyle = `rgba(255,255,255,${star.b})`;
            ctx.beginPath();
            ctx.arc(star.x * w, star.y * h, star.s, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.strokeStyle = 'rgba(100,100,200,0.15)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, this.shipScreenY);
        ctx.lineTo(w, this.shipScreenY);
        ctx.stroke();

        const mapped = bodies.map(b => ({
            body: b,
            sx: this.worldToScreen(b.position, ship.position),
            dist: Math.abs(b.position - ship.position),
        })).sort((a, b) => a.sx - b.sx);

        const groups = [];
        let cur = null;
        for (const m of mapped) {
            if (!cur || Math.abs(m.sx - cur.sx) > 20) {
                cur = { sx: m.sx, items: [m] };
                groups.push(cur);
            } else {
                cur.items.push(m);
                cur.sx = cur.items.reduce((s, i) => s + i.sx, 0) / cur.items.length;
            }
        }

        const leftArrows = [];
        const rightArrows = [];

        for (const g of groups) {
            if (g.sx < -30) { leftArrows.push(g); continue; }
            if (g.sx > w + 30) { rightArrows.push(g); continue; }

            const nearest = g.items.reduce((a, b) => a.dist < b.dist ? a : b);
            const r = this.bodyScreenRadius(nearest.body.radius, nearest.dist);

            this.drawBody(ctx, g.sx, this.shipScreenY, r, nearest.body);

            ctx.fillStyle = '#ffffff';
            ctx.font = '11px monospace';
            ctx.textAlign = 'center';
            g.items.forEach((item, i) => {
                ctx.fillText(item.body.name, g.sx, this.shipScreenY + r + 15 + i * 13);
            });
            ctx.fillStyle = '#888888';
            ctx.font = '9px monospace';
            ctx.fillText(this.fmtDist(nearest.dist), g.sx, this.shipScreenY + r + 15 + g.items.length * 13);
        }

        this.drawArrows(ctx, leftArrows, true, h);
        this.drawArrows(ctx, rightArrows, false, h);
        this.drawShip(ctx, ship, autopilot);

        if (paused) {
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.fillRect(0, 0, w, h);
            ctx.fillStyle = '#4488cc';
            ctx.font = 'bold 24px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('PAUSED', w / 2, h / 2);
        }
    }

    drawBody(ctx, x, y, r, body) {
        const img = this.images[body.name];
        if (img && img.complete && img.naturalWidth > 0 && r >= 5) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();
            const srcSize = Math.min(img.naturalWidth, img.naturalHeight);
            const srcX = (img.naturalWidth - srcSize) / 2;
            const srcY = (img.naturalHeight - srcSize) / 2;
            ctx.drawImage(img, srcX, srcY, srcSize, srcSize, x - r, y - r, r * 2, r * 2);
            ctx.restore();
        } else {
            if (r > 10) {
                const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
                grad.addColorStop(0, body.color);
                grad.addColorStop(0.7, body.color);
                grad.addColorStop(1, 'transparent');
                ctx.fillStyle = grad;
            } else {
                ctx.fillStyle = body.color;
            }
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    drawArrows(ctx, groups, isLeft, h) {
        const x = isLeft ? 12 : this.canvas.width - 12;
        let y = 20;
        for (const g of groups) {
            const names = g.items.map(i => i.body.name).join(', ');
            const color = g.items[0].body.color;

            ctx.fillStyle = color;
            ctx.beginPath();
            if (isLeft) {
                ctx.moveTo(x - 6, y);
                ctx.lineTo(x + 2, y - 4);
                ctx.lineTo(x + 2, y + 4);
            } else {
                ctx.moveTo(x + 6, y);
                ctx.lineTo(x - 2, y - 4);
                ctx.lineTo(x - 2, y + 4);
            }
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = color;
            ctx.font = '9px monospace';
            ctx.textAlign = isLeft ? 'left' : 'right';
            ctx.fillText(names, isLeft ? x + 8 : x - 8, y + 3);
            y += 16;
        }
    }

    drawShip(ctx, ship, autopilot) {
        const x = this.shipScreenX;
        const y = this.shipScreenY;
        const g0 = 9.80665;
        const phase = autopilot ? autopilot.phase : '';
        const isBraking = phase === 'brake' || phase === 'correct';

        if (ship.thrustLevel > 0 && ship.hasFuel) {
            const flameLen = {1: 10, 2: 20, 55: 100, 250: 200};
            const len = flameLen[Math.round(ship.thrustLevel / g0)] || 50;
            let bx, tx;
            if (ship.thrustDirection > 0) {
                bx = x + 18; tx = bx + len;
            } else {
                bx = x - 18; tx = bx - len;
            }
            ctx.fillStyle = '#ff6600';
            ctx.globalAlpha = 0.5 + Math.random() * 0.4;
            ctx.beginPath();
            ctx.moveTo(bx, y - 5);
            ctx.lineTo(tx, y);
            ctx.lineTo(bx, y + 5);
            ctx.closePath();
            ctx.fill();
            ctx.globalAlpha = 1;
        }

        const img = this.shipImg;
        if (img && img.complete && img.naturalWidth > 0) {
            const shipW = 35;
            const shipH = shipW * (img.naturalHeight / img.naturalWidth);
            ctx.save();
            ctx.translate(x, y);
            if (isBraking) ctx.scale(-1, 1);
            ctx.drawImage(img, -shipW / 2, -shipH / 2, shipW, shipH);
            ctx.restore();
        } else {
            ctx.fillStyle = '#cccccc';
            ctx.beginPath();
            if (isBraking) {
                ctx.moveTo(x + 15, y);
                ctx.lineTo(x - 10, y - 8);
                ctx.lineTo(x - 10, y + 8);
            } else {
                ctx.moveTo(x - 15, y);
                ctx.lineTo(x + 10, y - 8);
                ctx.lineTo(x + 10, y + 8);
            }
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        if (phase === 'accel') {
            ctx.fillStyle = '#44ff88';
            ctx.font = '10px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('ACCELERATING', x, y - 20);
        } else if (phase === 'coast') {
            ctx.fillStyle = '#44ccff';
            ctx.font = '10px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('COASTING', x, y - 20);
        } else if (isBraking) {
            ctx.fillStyle = '#ff8844';
            ctx.font = '10px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('DECELERATING', x, y - 20);
        } else if (ship.parked) {
            ctx.fillStyle = '#44ff88';
            ctx.font = '10px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('Parked in stable orbit', x, y - 16);
        }
    }

    setZoom(ppd) {
        this.pixelsPerDecade = Math.max(10, Math.min(200, ppd));
    }

    fmtDist(d) {
        if (d < 1e3) return d.toFixed(0) + ' m';
        if (d < 1e6) return (d / 1e3).toFixed(1) + ' km';
        if (d < 1e9) return (d / 1e6).toFixed(1) + 'K km';
        if (d < AU * 0.1) return (d / 1e9).toFixed(2) + 'M km';
        if (d < LY * 0.1) return (d / AU).toFixed(2) + ' AU';
        if (d < 1000 * LY) return (d / LY).toFixed(2) + ' ly';
        if (d < 1e6 * LY) return (d / (1000 * LY)).toFixed(1) + 'K ly';
        if (d < 1e9 * LY) return (d / (1e6 * LY)).toFixed(1) + 'M ly';
        return (d / (1e9 * LY)).toFixed(1) + 'B ly';
    }
}
