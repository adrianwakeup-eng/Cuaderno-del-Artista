// Lightweight, zero-dependency Canvas 2D "Polvo Dorado Mágico" particle engine.
// Uses pre-rendered offscreen golden glow sprites + additive blending ('lighter'),
// wing-vortex curl turbulence, a delicate golden stardust wake ribbon, and
// harp-pluck celestial star bursts at a rock-solid 60fps.

export type DustParticleKind = 'micro' | 'orb' | 'star' | 'ring' | 'bokeh';

interface DustParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rotation: number;
  vRot: number;
  alpha: number;
  life: number;
  maxLife: number;
  twinklePhase: number;
  twinkleSpeed: number;
  curlSeed: number;
  kind: DustParticleKind;
  tintIndex: number; // 0 = champagne white-gold, 1 = warm honey gold, 2 = deep amber gold, 3 = iridescent emerald-gold
}

interface TrailPoint {
  x: number;
  y: number;
  life: number;
  maxLife: number;
  width: number;
}

interface SpriteBank {
  orbs: HTMLCanvasElement[];
  stars: HTMLCanvasElement[];
}

function createOrbSprite(coreHex: string, midHex: string, outerRgba: string): HTMLCanvasElement {
  const size = 64;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d');
  if (!ctx) return c;

  const r = size / 2;
  const grad = ctx.createRadialGradient(r, r, 0, r, r, r);
  grad.addColorStop(0, coreHex);
  grad.addColorStop(0.24, midHex);
  grad.addColorStop(0.58, outerRgba);
  grad.addColorStop(1, 'rgba(245, 185, 48, 0)');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(r, r, r, 0, Math.PI * 2);
  ctx.fill();
  return c;
}

function createStarSprite(coreHex: string, midHex: string): HTMLCanvasElement {
  const size = 64;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d');
  if (!ctx) return c;

  const cx = size / 2;
  const cy = size / 2;

  // Soft outer golden halo
  const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, cx);
  halo.addColorStop(0, 'rgba(255, 250, 214, 0.92)');
  halo.addColorStop(0.32, 'rgba(255, 214, 92, 0.45)');
  halo.addColorStop(1, 'rgba(245, 180, 42, 0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(cx, cy, cx, 0, Math.PI * 2);
  ctx.fill();

  // Crisp 4-point diamond star flare
  ctx.fillStyle = midHex;
  ctx.beginPath();
  const outer = cx * 0.92;
  const inner = cx * 0.14;
  for (let i = 0; i < 8; i++) {
    const rad = i % 2 === 0 ? outer : inner;
    const a = (i * Math.PI) / 4;
    const px = cx + Math.cos(a) * rad;
    const py = cy + Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();

  // Bright champagne core
  ctx.fillStyle = coreHex;
  ctx.beginPath();
  ctx.arc(cx, cy, cx * 0.16, 0, Math.PI * 2);
  ctx.fill();

  return c;
}

let cachedSprites: SpriteBank | null = null;

function getSpriteBank(): SpriteBank {
  if (!cachedSprites) {
    cachedSprites = {
      orbs: [
        createOrbSprite('#FFFDF0', '#FFEFA8', 'rgba(255, 214, 94, 0.44)'),
        createOrbSprite('#FFF8D4', '#FFD966', 'rgba(246, 184, 48, 0.40)'),
        createOrbSprite('#FFEFA6', '#F4B637', 'rgba(222, 146, 24, 0.35)'),
        createOrbSprite('#F4FFEC', '#B8F7BA', 'rgba(124, 245, 162, 0.32)'),
      ],
      stars: [
        createStarSprite('#FFFFFF', '#FFF1B5'),
        createStarSprite('#FFFBE0', '#FFD86B'),
        createStarSprite('#FFF2BD', '#F7BC3D'),
        createStarSprite('#F8FFF6', '#B9FFD0'),
      ],
    };
  }
  return cachedSprites;
}

export class GoldenFairyDustEngine {
  private particles: DustParticle[] = [];
  private trail: TrailPoint[] = [];
  private maxParticles = 460;
  private trailAccum = 0;

  public clear() {
    this.particles = [];
    this.trail = [];
  }

  /**
   * Emits silky golden stardust from the fairy's beating wings along his trajectory.
   */
  public emitWingDust(
    x: number,
    y: number,
    fairyVx: number,
    fairyVy: number,
    wingSpanPx: number,
    intensity: number
  ) {
    const count = Math.max(1, Math.min(6, Math.round(intensity)));
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) {
        this.particles.shift();
      }
      const side = Math.random() < 0.5 ? -1 : 1;
      const offsetX = side * (0.15 + Math.random() * 0.42) * wingSpanPx;
      const offsetY = (Math.random() - 0.45) * wingSpanPx * 0.32;

      const roll = Math.random();
      const kind: DustParticleKind =
        roll < 0.50
          ? 'micro'
          : roll < 0.78
            ? 'orb'
            : roll < 0.90
              ? 'bokeh'
              : 'star';

      const size =
        kind === 'micro'
          ? 2.0 + Math.random() * 2.8
          : kind === 'orb'
            ? 5.2 + Math.random() * 7.2
            : kind === 'bokeh'
              ? 11 + Math.random() * 12
              : 8.5 + Math.random() * 11;

      // 84% warm 24k gold tints + 16% iridescent sunlit emerald-gold wing pollen
      const tintRoll = Math.random();
      const tintIndex = tintRoll < 0.30 ? 0 : tintRoll < 0.62 ? 1 : tintRoll < 0.84 ? 2 : 3;

      this.particles.push({
        x: x + offsetX,
        y: y + offsetY,
        vx: -fairyVx * (0.12 + Math.random() * 0.08) + side * (10 + Math.random() * 20),
        vy: -fairyVy * 0.06 + 5 + Math.random() * 20,
        size,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 2.6,
        alpha: kind === 'bokeh' ? 0.24 + Math.random() * 0.22 : 0.74 + Math.random() * 0.26,
        life: 0,
        maxLife:
          kind === 'micro'
            ? 0.95 + Math.random() * 1.15
            : kind === 'bokeh'
              ? 1.55 + Math.random() * 1.4
              : kind === 'orb'
                ? 1.2 + Math.random() * 1.35
                : 0.95 + Math.random() * 1.05,
        twinklePhase: Math.random() * Math.PI * 2,
        twinkleSpeed:
          kind === 'micro'
            ? 11 + Math.random() * 12
            : kind === 'bokeh'
              ? 2.5 + Math.random() * 3.2
              : 5 + Math.random() * 8,
        curlSeed: Math.random() * 100,
        kind,
        tintIndex,
      });
    }
  }

  /**
   * Adds a smooth luminous mist node to the fairy's golden wake ribbon.
   */
  public pushFlightTrail(x: number, y: number, dt: number, speedNorm: number) {
    this.trailAccum += dt * (24 + speedNorm * 22);
    if (this.trailAccum < 1) return;
    this.trailAccum = 0;

    this.trail.push({
      x,
      y,
      life: 0,
      maxLife: 0.72 + speedNorm * 0.38,
      width: 10 + speedNorm * 14,
    });
    if (this.trail.length > 44) {
      this.trail.shift();
    }
  }

  /**
   * Emits a concentrated burst of twinkling golden stardust & optional harmonic ring
   * directly from the fairy's Celtic harp strings on every plucked note.
   */
  public emitHarpNoteBurst(
    x: number,
    y: number,
    facing: number,
    fairyVx: number,
    isChord: boolean
  ) {
    const count = isChord ? 11 : 5;
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) {
        this.particles.shift();
      }
      const angle = Math.random() * Math.PI * 2;
      const speed = 10 + Math.random() * (isChord ? 38 : 22);
      const kind: DustParticleKind =
        i < (isChord ? 3 : 1) ? 'star' : i % 2 === 0 ? 'orb' : 'micro';

      this.particles.push({
        x: x + Math.cos(angle) * 8,
        y: y + Math.sin(angle) * 10,
        vx: facing * (10 + Math.random() * 20) + Math.cos(angle) * speed * 0.65,
        vy: -14 - Math.random() * 22 + Math.sin(angle) * speed * 0.4,
        size:
          kind === 'star'
            ? 10 + Math.random() * 11
            : kind === 'orb'
              ? 5 + Math.random() * 6
              : 2.5 + Math.random() * 2.5,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 3.2,
        alpha: 0.88 + Math.random() * 0.12,
        life: 0,
        maxLife: 0.95 + Math.random() * 1.05,
        twinklePhase: Math.random() * Math.PI * 2,
        twinkleSpeed: 8 + Math.random() * 10,
        curlSeed: Math.random() * 100,
        kind,
        tintIndex: i % 3,
      });
    }

    if (isChord) {
      if (this.particles.length >= this.maxParticles) {
        this.particles.shift();
      }
      this.particles.push({
        x,
        y,
        vx: fairyVx * 0.08,
        vy: -4,
        size: 10,
        rotation: 0,
        vRot: 0,
        alpha: 0.52,
        life: 0,
        maxLife: 1.05,
        twinklePhase: 0,
        twinkleSpeed: 0,
        curlSeed: 0,
        kind: 'ring',
        tintIndex: 0,
      });
    }
  }

  /**
   * Advances physics and draws the golden ribbon wake + additive glowing dust onto the 2D canvas.
   */
  public updateAndRender(
    ctx: CanvasRenderingContext2D,
    stageW: number,
    stageH: number,
    dt: number,
    timeSec: number
  ) {
    ctx.clearRect(0, 0, stageW, stageH);

    const sprites = getSpriteBank();

    ctx.save();
    // Additive blending creates authentic sunlit golden bloom where dust particles overlap
    ctx.globalCompositeOperation = 'lighter';

    // 1. Render soft golden stardust wake ribbon behind his flight path
    for (let i = this.trail.length - 1; i >= 0; i--) {
      const pt = this.trail[i];
      pt.life += dt;
      pt.y += 5 * dt;
      if (pt.life >= pt.maxLife) {
        this.trail.splice(i, 1);
      }
    }

    if (this.trail.length >= 3) {
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      for (let i = 1; i < this.trail.length - 1; i++) {
        const p0 = this.trail[i - 1];
        const p1 = this.trail[i];
        const p2 = this.trail[i + 1];
        const ageRatio = 1 - p1.life / p1.maxLife;
        if (ageRatio <= 0.02) continue;

        const m1x = (p0.x + p1.x) * 0.5;
        const m1y = (p0.y + p1.y) * 0.5;
        const m2x = (p1.x + p2.x) * 0.5;
        const m2y = (p1.y + p2.y) * 0.5;

        const w = p1.width * ageRatio;
        // Soft wide outer amber mist (silky quadratic curve)
        ctx.strokeStyle = `rgba(246, 190, 58, ${(ageRatio * 0.11).toFixed(3)})`;
        ctx.lineWidth = w * 1.95;
        ctx.beginPath();
        ctx.moveTo(m1x, m1y);
        ctx.quadraticCurveTo(p1.x, p1.y, m2x, m2y);
        ctx.stroke();

        // Delicate luminous champagne core thread
        ctx.strokeStyle = `rgba(255, 244, 194, ${(ageRatio * 0.24).toFixed(3)})`;
        ctx.lineWidth = Math.max(1.2, w * 0.4);
        ctx.beginPath();
        ctx.moveTo(m1x, m1y);
        ctx.quadraticCurveTo(p1.x, p1.y, m2x, m2y);
        ctx.stroke();

        // Subtle emerald-gold vortex shimmer woven along the wake
        const swirl = Math.sin(timeSec * 5.2 + i * 0.65) * w * 0.48;
        ctx.strokeStyle = `rgba(176, 255, 198, ${(ageRatio * 0.09).toFixed(3)})`;
        ctx.lineWidth = Math.max(0.8, w * 0.22);
        ctx.beginPath();
        ctx.moveTo(m1x, m1y + swirl * 0.65);
        ctx.quadraticCurveTo(p1.x, p1.y + swirl, m2x, m2y + swirl * 0.65);
        ctx.stroke();
      }
    }

    // 2. Update & draw golden fairy dust particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;
      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
        continue;
      }

      const progress = p.life / p.maxLife;

      if (p.kind === 'ring') {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        const radius = p.size + progress * 44;
        const alpha = p.alpha * Math.pow(1 - progress, 1.55);
        if (alpha <= 0.012) continue;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = '#FFE999';
        ctx.lineWidth = 1.6 * (1 - progress * 0.65);
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        continue;
      }

      // Organic curl-like air turbulence + soft golden powder settling
      const curlAngle =
        Math.sin(p.y * 0.018 + timeSec * 1.6 + p.curlSeed) * 1.8 +
        Math.cos(p.x * 0.015 - timeSec * 1.2 + p.curlSeed) * 1.4;
      p.vx += Math.cos(curlAngle) * 16 * dt;
      p.vy += (9.5 + Math.sin(curlAngle) * 8) * dt;
      p.vx *= 0.984;
      p.vy *= 0.986;

      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rotation += p.vRot * dt;

      const fadeIn = Math.min(1, progress * 7);
      const fadeOut = Math.pow(1 - progress, 1.5);
      // Glittering sparkle pulse (especially sharp on micro specks & stars)
      const rawWave = 0.5 + 0.5 * Math.sin(timeSec * p.twinkleSpeed + p.twinklePhase);
      const twinkle = p.kind === 'micro' ? 0.25 + 0.75 * Math.pow(rawWave, 2.4) : 0.52 + 0.48 * rawWave;
      const alpha = p.alpha * fadeIn * fadeOut * twinkle;
      if (alpha <= 0.014) continue;

      const drawSize = p.size * (1 - progress * 0.28);

      if (p.kind === 'star') {
        const starImg = sprites.stars[p.tintIndex];
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.drawImage(starImg, -drawSize, -drawSize, drawSize * 2, drawSize * 2);
        ctx.restore();
      } else {
        const orbImg = sprites.orbs[p.tintIndex];
        ctx.globalAlpha = alpha;
        ctx.drawImage(orbImg, p.x - drawSize, p.y - drawSize, drawSize * 2, drawSize * 2);
      }
    }

    ctx.restore();
  }
}
