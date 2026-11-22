import * as THREE from 'three';
import type { GarmentStitchPattern } from '../types/crochet';

/* ============================================================================
   COUTURE PROCEDURAL PBR TEXTILE & ANATOMICAL TEXTURE ENGINE
   Generates 512x512 multi-ply crochet yarn textures:
   - Albedo map (SRGBColorSpace) with deep stitch crevice shading & yarn plies
   - True Sobel Tangent-Space NormalMap (Linear) for dramatic raking 3D relief
   - BumpMap (Linear) & RoughnessMap (Linear) for matte crevices vs soft crests
   - Garment-specific Ambient Occlusion map (UV2) for collars, waist, armholes & seams
   - Sculpted human skin albedo & micro-pore normal map
============================================================================ */

export function adjustHex(hex: string, factor: number): string {
  const c = new THREE.Color(hex || '#c9a67a');
  c.multiplyScalar(factor);
  return `#${c.getHexString()}`;
}

export function mixHex(hexA: string, hexB: string, t: number): string {
  const a = new THREE.Color(hexA || '#d4b88c');
  const b = new THREE.Color(hexB || '#4a3018');
  return `#${a.lerp(b, t).getHexString()}`;
}

export interface CrochetPbrTextureSet {
  albedo: THREE.CanvasTexture;
  normal: THREE.DataTexture;
  bump: THREE.CanvasTexture;
  roughness: THREE.CanvasTexture;
}

/**
 * Converts a grayscale heightfield canvas into a true Tangent-Space Normal Map
 * using a 3x3 Sobel operator so every yarn strand, cable twist, and crochet loop
 * catches directional studio lighting with crisp 3D depth.
 */
function heightCanvasToNormalTexture(
  heightCanvas: HTMLCanvasElement,
  strength: number,
  repeatX: number,
  repeatY: number,
  maxAnisotropy: number
): THREE.DataTexture {
  const w = heightCanvas.width;
  const h = heightCanvas.height;
  const ctx = heightCanvas.getContext('2d')!;
  const src = ctx.getImageData(0, 0, w, h).data;
  const out = new Uint8Array(w * h * 4);

  const sample = (x: number, y: number): number => {
    const wx = ((x % w) + w) % w;
    const wy = ((y % h) + h) % h;
    return src[(wy * w + wx) * 4] / 255;
  };

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const tl = sample(x - 1, y - 1);
      const t = sample(x, y - 1);
      const tr = sample(x + 1, y - 1);
      const l = sample(x - 1, y);
      const r = sample(x + 1, y);
      const bl = sample(x - 1, y + 1);
      const b = sample(x, y + 1);
      const br = sample(x + 1, y + 1);

      const dX = (tr + 2 * r + br - (tl + 2 * l + bl)) * strength;
      const dY = (bl + 2 * b + br - (tl + 2 * t + tr)) * strength;
      const dZ = 1.0;

      const invLen = 1 / Math.hypot(dX, dY, dZ);
      const nx = -dX * invLen;
      const ny = -dY * invLen;
      const nz = dZ * invLen;

      const idx = (y * w + x) * 4;
      out[idx] = Math.round((nx * 0.5 + 0.5) * 255);
      out[idx + 1] = Math.round((ny * 0.5 + 0.5) * 255);
      out[idx + 2] = Math.round((nz * 0.5 + 0.5) * 255);
      out[idx + 3] = 255;
    }
  }

  const tex = new THREE.DataTexture(out, w, h, THREE.RGBAFormat);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.anisotropy = maxAnisotropy;
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Generates a full PBR texture suite for any crochet stitch pattern in the catalog.
 */
export function buildCrochetPbrTextureSet(
  palette: string[],
  stitch: GarmentStitchPattern,
  opts: {
    hasGrannyFloral?: boolean;
    repeatX: number;
    repeatY: number;
    maxAnisotropy: number;
  }
): CrochetPbrTextureSet {
  const size = 512;
  const colCanvas = document.createElement('canvas');
  colCanvas.width = size;
  colCanvas.height = size;
  const cctx = colCanvas.getContext('2d')!;

  const hCanvas = document.createElement('canvas');
  hCanvas.width = size;
  hCanvas.height = size;
  const hctx = hCanvas.getContext('2d')!;

  const rCanvas = document.createElement('canvas');
  rCanvas.width = size;
  rCanvas.height = size;
  const rctx = rCanvas.getContext('2d')!;

  const baseHex = palette[0] || '#DEC098';
  const trimHex = palette[1] || adjustHex(baseHex, 0.72);
  const accentHex = palette[2] || '#D9A441';
  const yarnLight = mixHex(baseHex, '#fff8eb', 0.32);
  const yarnMidDark = adjustHex(baseHex, 0.76);
  const yarnDeep = adjustHex(baseHex, 0.42);

  // Base fill (slightly richer, deeper base so studio lighting never washes out fabric)
  cctx.fillStyle = adjustHex(baseHex, 0.94);
  cctx.fillRect(0, 0, size, size);

  hctx.fillStyle = '#525252';
  hctx.fillRect(0, 0, size, size);

  // Matte wool base roughness (~0.92)
  rctx.fillStyle = '#e8e8e8';
  rctx.fillRect(0, 0, size, size);

  // 1. Color pattern layer (stripes, jacquard frieze, argyle, chevron, granny floral)
  if (stitch === 'striped') {
    const bandH = 64;
    for (let y = 0; y < size; y += bandH) {
      const idx = Math.floor(y / bandH) % 4;
      cctx.fillStyle =
        idx === 0
          ? adjustHex(baseHex, 0.94)
          : idx === 1
            ? adjustHex(trimHex, 0.94)
            : idx === 2
              ? adjustHex(baseHex, 0.94)
              : adjustHex(accentHex, 0.94);
      cctx.fillRect(0, y, size, bandH);
    }
  } else if (stitch === 'jacquard' || stitch === 'heraldic') {
    // Rich Nordic/Andean diamond chest tapestry band
    const bandY = 172;
    const bandH = 168;
    cctx.fillStyle = adjustHex(trimHex, 0.92);
    cctx.fillRect(0, bandY, size, bandH);

    // Subtle geometric border bars
    cctx.fillStyle = accentHex;
    cctx.fillRect(0, bandY + 10, size, 12);
    cctx.fillRect(0, bandY + bandH - 22, size, 12);
    cctx.fillStyle = baseHex;
    for (let x = 0; x < size; x += 16) {
      cctx.fillRect(x + 4, bandY + 13, 8, 6);
      cctx.fillRect(x + 4, bandY + bandH - 19, 8, 6);
    }

    const step = 64;
    for (let x = 0; x < size; x += step) {
      const cx = x + step * 0.5;
      const cy = bandY + bandH * 0.5;
      cctx.fillStyle = accentHex;
      cctx.beginPath();
      cctx.moveTo(cx, cy - 48);
      cctx.lineTo(cx + 30, cy);
      cctx.lineTo(cx, cy + 48);
      cctx.lineTo(cx - 30, cy);
      cctx.closePath();
      cctx.fill();

      cctx.fillStyle = baseHex;
      cctx.beginPath();
      cctx.moveTo(cx, cy - 26);
      cctx.lineTo(cx + 16, cy);
      cctx.lineTo(cx, cy + 26);
      cctx.lineTo(cx - 16, cy);
      cctx.closePath();
      cctx.fill();

      cctx.fillStyle = trimHex;
      cctx.beginPath();
      cctx.arc(cx, cy, 7, 0, Math.PI * 2);
      cctx.fill();
    }
  } else if (stitch === 'argyle') {
    const step = 128;
    for (let y = 0; y < size; y += step) {
      for (let x = 0; x < size; x += step) {
        const cx = x + step * 0.5;
        const cy = y + step * 0.5;
        cctx.fillStyle =
          (Math.floor(x / step) + Math.floor(y / step)) % 2 === 0 ? trimHex : accentHex;
        cctx.globalAlpha = 0.42;
        cctx.beginPath();
        cctx.moveTo(cx, y + 6);
        cctx.lineTo(x + step - 6, cy);
        cctx.lineTo(cx, y + step - 6);
        cctx.lineTo(x + 6, cy);
        cctx.closePath();
        cctx.fill();
        cctx.globalAlpha = 1;
        cctx.strokeStyle = accentHex;
        cctx.lineWidth = 3.5;
        cctx.setLineDash([7, 5]);
        cctx.beginPath();
        cctx.moveTo(x, y);
        cctx.lineTo(x + step, y + step);
        cctx.moveTo(x + step, y);
        cctx.lineTo(x, y + step);
        cctx.stroke();
        cctx.setLineDash([]);
      }
    }
  } else if (stitch === 'chevron') {
    const stepX = 64;
    const stepY = 44;
    for (let y = 0; y < size + stepY; y += stepY) {
      const isAlt = Math.floor(y / stepY) % 2 === 1;
      cctx.strokeStyle = isAlt ? trimHex : accentHex;
      cctx.globalAlpha = 0.55;
      cctx.lineWidth = 11;
      cctx.lineJoin = 'round';
      cctx.beginPath();
      for (let x = 0; x <= size; x += stepX) {
        const py = y + ((x / stepX) % 2 === 0 ? 0 : 20);
        if (x === 0) cctx.moveTo(x, py);
        else cctx.lineTo(x, py);
      }
      cctx.stroke();
      cctx.globalAlpha = 1;
    }
  }

  // Optional woven Granny-Square Sunflower / Floral Crochet Tapestry
  if (opts.hasGrannyFloral) {
    const tile = 128;
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        const x = col * tile;
        const y = row * tile;
        const cx = x + tile * 0.5;
        const cy = y + tile * 0.5;

        // Deep crocheted join trench between granny squares
        cctx.strokeStyle = yarnDeep;
        cctx.lineWidth = 6;
        cctx.strokeRect(x + 4, y + 4, tile - 8, tile - 8);
        hctx.strokeStyle = '#1d1d1d';
        hctx.lineWidth = 7;
        hctx.strokeRect(x + 4, y + 4, tile - 8, tile - 8);

        // Raised contrast square frame
        cctx.strokeStyle = trimHex;
        cctx.lineWidth = 4;
        cctx.strokeRect(x + 13, y + 13, tile - 26, tile - 26);
        hctx.strokeStyle = '#dcdcdc';
        hctx.lineWidth = 5;
        hctx.strokeRect(x + 13, y + 13, tile - 26, tile - 26);

        // 8 raised crochet petals
        for (let k = 0; k < 8; k++) {
          const ang = (k * Math.PI) / 4;
          const px = cx + Math.cos(ang) * 25;
          const py = cy + Math.sin(ang) * 25;
          cctx.fillStyle = accentHex;
          cctx.beginPath();
          cctx.ellipse(px, py, 14, 9, ang, 0, Math.PI * 2);
          cctx.fill();
          cctx.strokeStyle = adjustHex(accentHex, 0.55);
          cctx.lineWidth = 2;
          cctx.stroke();

          hctx.fillStyle = '#efefef';
          hctx.beginPath();
          hctx.ellipse(px, py, 13, 8, ang, 0, Math.PI * 2);
          hctx.fill();
        }
        // Raised rosette center
        cctx.fillStyle = trimHex;
        cctx.beginPath();
        cctx.arc(cx, cy, 13, 0, Math.PI * 2);
        cctx.fill();
        hctx.fillStyle = '#ffffff';
        hctx.beginPath();
        hctx.arc(cx, cy, 13, 0, Math.PI * 2);
        hctx.fill();
      }
    }
  }

  // Helper: draws a detailed 2-ply crochet V-stitch knot in albedo, height, and roughness
  const drawCrochetVStitch = (x: number, y: number, w: number, h: number) => {
    // Deep recessed pore between loops (creates tactile knit look!)
    cctx.fillStyle = yarnDeep;
    cctx.globalAlpha = 0.42;
    cctx.beginPath();
    cctx.arc(x + w * 0.5, y + h * 0.16, w * 0.14, 0, Math.PI * 2);
    cctx.fill();

    hctx.fillStyle = '#181818';
    hctx.beginPath();
    hctx.arc(x + w * 0.5, y + h * 0.16, w * 0.16, 0, Math.PI * 2);
    hctx.fill();

    // Left strand of V-loop (catchlight)
    cctx.strokeStyle = yarnLight;
    cctx.globalAlpha = 0.34;
    cctx.lineWidth = w * 0.22;
    cctx.lineCap = 'round';
    cctx.beginPath();
    cctx.moveTo(x + w * 0.22, y + h * 0.14);
    cctx.quadraticCurveTo(x + w * 0.14, y + h * 0.56, x + w * 0.46, y + h * 0.9);
    cctx.stroke();

    // Right strand of V-loop (shaded side)
    cctx.strokeStyle = yarnMidDark;
    cctx.globalAlpha = 0.48;
    cctx.lineWidth = w * 0.22;
    cctx.beginPath();
    cctx.moveTo(x + w * 0.78, y + h * 0.14);
    cctx.quadraticCurveTo(x + w * 0.86, y + h * 0.56, x + w * 0.54, y + h * 0.9);
    cctx.stroke();

    // Fine twisted ply notch across strand
    cctx.strokeStyle = yarnDeep;
    cctx.globalAlpha = 0.32;
    cctx.lineWidth = 1.2;
    cctx.beginPath();
    cctx.moveTo(x + w * 0.5, y + h * 0.18);
    cctx.lineTo(x + w * 0.5, y + h * 0.88);
    cctx.stroke();
    cctx.globalAlpha = 1;

    // Heightfield rounded yarn ridges (high brightness = protruding yarn)
    hctx.strokeStyle = '#ececec';
    hctx.lineWidth = w * 0.25;
    hctx.lineCap = 'round';
    hctx.beginPath();
    hctx.moveTo(x + w * 0.22, y + h * 0.14);
    hctx.quadraticCurveTo(x + w * 0.14, y + h * 0.56, x + w * 0.46, y + h * 0.9);
    hctx.moveTo(x + w * 0.78, y + h * 0.14);
    hctx.quadraticCurveTo(x + w * 0.86, y + h * 0.56, x + w * 0.54, y + h * 0.9);
    hctx.stroke();

    hctx.strokeStyle = '#202020';
    hctx.lineWidth = 1.8;
    hctx.beginPath();
    hctx.moveTo(x + w * 0.5, y + h * 0.1);
    hctx.lineTo(x + w * 0.5, y + h * 0.92);
    hctx.stroke();

    // Slightly smoother crests on roughness map
    rctx.strokeStyle = '#c8c8c8';
    rctx.lineWidth = w * 0.2;
    rctx.beginPath();
    rctx.moveTo(x + w * 0.24, y + h * 0.2);
    rctx.lineTo(x + w * 0.46, y + h * 0.84);
    rctx.stroke();
  };

  // 2. Sculptural stitch relief layer matching each catalog stitch type
  if (stitch === 'cable') {
    // Authentic Aran/Irish chunky braided cables alternating with deep purl gutters & moss knit!
    const colW = 64;
    for (let x = 0; x < size; x += colW) {
      const isCable = Math.floor(x / colW) % 2 === 0;
      if (isCable) {
        // Dark vertical purl gutters framing the braided cable
        cctx.fillStyle = yarnDeep;
        cctx.globalAlpha = 0.52;
        cctx.fillRect(x, 0, 7, size);
        cctx.fillRect(x + colW - 7, 0, 7, size);
        cctx.globalAlpha = 1;

        hctx.fillStyle = '#181818';
        hctx.fillRect(x, 0, 8, size);
        hctx.fillRect(x + colW - 8, 0, 8, size);

        // Interlocking braided rope segments
        for (let y = 0; y < size; y += 32) {
          // Under-rope
          cctx.strokeStyle = yarnDeep;
          cctx.globalAlpha = 0.48;
          cctx.lineWidth = 15;
          cctx.lineCap = 'round';
          cctx.beginPath();
          cctx.moveTo(x + 15, y);
          cctx.bezierCurveTo(x + 54, y + 10, x + 10, y + 22, x + 49, y + 32);
          cctx.stroke();

          cctx.strokeStyle = yarnMidDark;
          cctx.globalAlpha = 0.6;
          cctx.lineWidth = 10;
          cctx.stroke();

          // Over-rope with bright yarn highlight ridge
          cctx.strokeStyle = yarnDeep;
          cctx.globalAlpha = 0.44;
          cctx.lineWidth = 15;
          cctx.beginPath();
          cctx.moveTo(x + 49, y);
          cctx.bezierCurveTo(x + 10, y + 10, x + 54, y + 22, x + 15, y + 32);
          cctx.stroke();

          cctx.strokeStyle = yarnLight;
          cctx.globalAlpha = 0.55;
          cctx.lineWidth = 8;
          cctx.stroke();
          cctx.globalAlpha = 1;

          // Deep 3D height relief for braided rope
          hctx.strokeStyle = '#9a9a9a';
          hctx.lineWidth = 13;
          hctx.lineCap = 'round';
          hctx.beginPath();
          hctx.moveTo(x + 15, y);
          hctx.bezierCurveTo(x + 54, y + 10, x + 10, y + 22, x + 49, y + 32);
          hctx.stroke();

          hctx.strokeStyle = '#fafafa';
          hctx.lineWidth = 13;
          hctx.beginPath();
          hctx.moveTo(x + 49, y);
          hctx.bezierCurveTo(x + 10, y + 10, x + 54, y + 22, x + 15, y + 32);
          hctx.stroke();
        }
      } else {
        for (let y = 0; y < size; y += 16) {
          for (let sx = x; sx < x + colW; sx += 16) {
            drawCrochetVStitch(sx, y, 16, 16);
          }
        }
      }
    }
  } else if (stitch === 'waffle') {
    const cell = 24;
    for (let y = 0; y < size; y += cell) {
      for (let x = 0; x < size; x += cell) {
        // Deep recessed waffle pocket
        cctx.fillStyle = yarnDeep;
        cctx.globalAlpha = 0.45;
        cctx.fillRect(x + 5, y + 5, cell - 10, cell - 10);
        cctx.globalAlpha = 1;
        cctx.strokeStyle = yarnLight;
        cctx.globalAlpha = 0.42;
        cctx.lineWidth = 4;
        cctx.strokeRect(x + 2, y + 2, cell - 4, cell - 4);
        cctx.globalAlpha = 1;

        hctx.fillStyle = '#181818';
        hctx.fillRect(x + 5, y + 5, cell - 10, cell - 10);
        hctx.strokeStyle = '#f5f5f5';
        hctx.lineWidth = 5.5;
        hctx.strokeRect(x + 2, y + 2, cell - 4, cell - 4);
      }
    }
  } else if (stitch === 'honeycomb') {
    const step = 28;
    for (let y = 0; y < size + step; y += step) {
      const odd = Math.floor(y / step) % 2 === 1;
      for (let x = -step; x < size + step; x += step) {
        const cx = x + (odd ? step * 0.5 : 0);
        const cy = y;
        cctx.fillStyle = yarnDeep;
        cctx.globalAlpha = 0.44;
        cctx.beginPath();
        cctx.arc(cx, cy, step * 0.26, 0, Math.PI * 2);
        cctx.fill();
        cctx.strokeStyle = yarnLight;
        cctx.globalAlpha = 0.42;
        cctx.lineWidth = 4;
        cctx.beginPath();
        cctx.arc(cx, cy, step * 0.42, 0, Math.PI * 2);
        cctx.stroke();
        cctx.globalAlpha = 1;

        hctx.fillStyle = '#1c1c1c';
        hctx.beginPath();
        hctx.arc(cx, cy, step * 0.26, 0, Math.PI * 2);
        hctx.fill();
        hctx.strokeStyle = '#f4f4f4';
        hctx.lineWidth = 5;
        hctx.beginPath();
        hctx.arc(cx, cy, step * 0.42, 0, Math.PI * 2);
        hctx.stroke();
      }
    }
  } else if (stitch === 'ribbed') {
    const col = 16;
    for (let x = 0; x < size; x += col) {
      const raised = Math.floor(x / col) % 2 === 0;
      cctx.fillStyle = raised ? yarnLight : yarnDeep;
      cctx.globalAlpha = raised ? 0.2 : 0.36;
      cctx.fillRect(x, 0, col - 2, size);
      cctx.globalAlpha = 1;

      hctx.fillStyle = raised ? '#e5e5e5' : '#242424';
      hctx.fillRect(x + 1, 0, col - 2, size);
      for (let y = 0; y < size; y += 16) {
        drawCrochetVStitch(x, y, col, 16);
      }
    }
  } else if (stitch === 'herringbone') {
    const colW = 32;
    for (let x = 0; x < size; x += colW) {
      const dir = Math.floor(x / colW) % 2 === 0 ? 1 : -1;
      // Subtle column gutter
      cctx.fillStyle = yarnDeep;
      cctx.globalAlpha = 0.32;
      cctx.fillRect(x, 0, 2.5, size);
      cctx.globalAlpha = 1;

      for (let y = 0; y < size; y += 12) {
        cctx.strokeStyle = yarnDeep;
        cctx.globalAlpha = 0.38;
        cctx.lineWidth = 4.5;
        cctx.beginPath();
        cctx.moveTo(x + (dir > 0 ? 3 : colW - 3), y + 2);
        cctx.lineTo(x + (dir > 0 ? colW - 3 : 3), y + 11);
        cctx.stroke();

        cctx.strokeStyle = yarnLight;
        cctx.globalAlpha = 0.36;
        cctx.lineWidth = 2.6;
        cctx.beginPath();
        cctx.moveTo(x + (dir > 0 ? 3 : colW - 3), y);
        cctx.lineTo(x + (dir > 0 ? colW - 3 : 3), y + 9);
        cctx.stroke();
        cctx.globalAlpha = 1;

        hctx.strokeStyle = '#ededed';
        hctx.lineWidth = 4.2;
        hctx.beginPath();
        hctx.moveTo(x + (dir > 0 ? 3 : colW - 3), y);
        hctx.lineTo(x + (dir > 0 ? colW - 3 : 3), y + 10);
        hctx.stroke();
      }
    }
  } else {
    const step = 16;
    for (let y = 0; y < size; y += step) {
      const off = (Math.floor(y / step) % 2) * 3;
      for (let x = -step; x < size + step; x += step) {
        drawCrochetVStitch(x + off, y, step, step);
      }
    }
  }

  // Organic multi-ply yarn fuzz grain so fibers look genuinely handcrafted up close
  for (let i = 0; i < 3600; i++) {
    const rx = (i * 197 + 13) % size;
    const ry = (i * 353 + 29) % size;
    cctx.fillStyle = i % 3 === 0 ? 'rgba(255,250,240,0.09)' : 'rgba(22,12,4,0.10)';
    cctx.fillRect(rx, ry, 2, 1);
  }

  const albedo = new THREE.CanvasTexture(colCanvas);
  albedo.wrapS = THREE.RepeatWrapping;
  albedo.wrapT = THREE.RepeatWrapping;
  albedo.repeat.set(opts.repeatX, opts.repeatY);
  albedo.colorSpace = THREE.SRGBColorSpace;
  albedo.anisotropy = opts.maxAnisotropy;

  const bump = new THREE.CanvasTexture(hCanvas);
  bump.wrapS = THREE.RepeatWrapping;
  bump.wrapT = THREE.RepeatWrapping;
  bump.repeat.set(opts.repeatX, opts.repeatY);
  bump.anisotropy = opts.maxAnisotropy;

  const roughness = new THREE.CanvasTexture(rCanvas);
  roughness.wrapS = THREE.RepeatWrapping;
  roughness.wrapT = THREE.RepeatWrapping;
  roughness.repeat.set(opts.repeatX, opts.repeatY);
  roughness.anisotropy = opts.maxAnisotropy;

  const normal = heightCanvasToNormalTexture(
    hCanvas,
    2.8,
    opts.repeatX,
    opts.repeatY,
    opts.maxAnisotropy
  );

  return { albedo, normal, bump, roughness };
}

/**
 * Generates a dedicated UV2 Ambient Occlusion map for garments (torso, sleeves, trousers)
 * darkening collar hollows, armhole edges, waistlines, cuffs, and inner leg seams
 * so 3D garments match the rich tonal depth of the editorial lookbook cards.
 */
export function buildGarmentAoMap(kind: 'torso' | 'sleeve' | 'trouser'): THREE.CanvasTexture {
  const w = 256;
  const h = 256;
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  const ctx = cv.getContext('2d')!;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);

  if (kind === 'torso') {
    // Bottom hem shadow + subtle waist contour + deep neck/collar shadow
    const vGrad = ctx.createLinearGradient(0, 0, 0, h);
    vGrad.addColorStop(0.0, 'rgb(165,165,165)'); // bottom hem shadow (v = 0)
    vGrad.addColorStop(0.12, 'rgb(236,236,236)');
    vGrad.addColorStop(0.45, 'rgb(252,252,252)');
    vGrad.addColorStop(0.84, 'rgb(235,235,235)');
    vGrad.addColorStop(1.0, 'rgb(155,155,155)'); // neckline shadow (v = 1)
    ctx.fillStyle = vGrad;
    ctx.fillRect(0, 0, w, h);

    // Side seam / underarm ambient occlusion at u = 0.25 (right side) & u = 0.75 (left side)
    const sideXs = [w * 0.25, w * 0.75];
    for (const sx of sideXs) {
      const g = ctx.createRadialGradient(sx, h * 0.68, 4, sx, h * 0.68, w * 0.16);
      g.addColorStop(0, 'rgba(95,95,95,0.68)');
      g.addColorStop(0.6, 'rgba(165,165,165,0.28)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(sx - w * 0.2, h * 0.3, w * 0.4, h * 0.6);
    }

    // Subtle vertical side seam crease
    ctx.fillStyle = 'rgba(130,130,130,0.32)';
    ctx.fillRect(w * 0.25 - 3, 0, 6, h);
    ctx.fillRect(w * 0.75 - 3, 0, 6, h);
  } else if (kind === 'sleeve') {
    const vGrad = ctx.createLinearGradient(0, 0, 0, h);
    vGrad.addColorStop(0.0, 'rgb(175,175,175)'); // cuff crease
    vGrad.addColorStop(0.14, 'rgb(245,245,245)');
    vGrad.addColorStop(0.88, 'rgb(240,240,240)');
    vGrad.addColorStop(1.0, 'rgb(160,160,160)'); // shoulder/elbow join
    ctx.fillStyle = vGrad;
    ctx.fillRect(0, 0, w, h);
  } else {
    // Trouser: darken upper crotch/waist shadow + inner thigh + lower hem
    const vGrad = ctx.createLinearGradient(0, 0, 0, h);
    vGrad.addColorStop(0.0, 'rgb(178,178,178)'); // ankle hem
    vGrad.addColorStop(0.15, 'rgb(245,245,245)');
    vGrad.addColorStop(0.75, 'rgb(240,240,240)');
    vGrad.addColorStop(1.0, 'rgb(148,148,148)'); // hip / crotch / waistband shadow
    ctx.fillStyle = vGrad;
    ctx.fillRect(0, 0, w, h);

    // Subtle inner/outer leg tailored seam lines
    ctx.fillStyle = 'rgba(130,130,130,0.28)';
    ctx.fillRect(w * 0.25 - 2, 0, 4, h);
    ctx.fillRect(w * 0.75 - 2, 0, 4, h);
  }

  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

/**
 * Generates a warm painted anatomical skin texture + micro-pore normal map
 * so the sculpted human mannequin has natural warmth and subsurface tonal variation
 * instead of flat uniform plastic peach.
 */
export function buildHumanSkinTextures(maxAnisotropy: number): {
  albedo: THREE.CanvasTexture;
  normal: THREE.DataTexture;
} {
  const size = 256;
  const col = document.createElement('canvas');
  col.width = size;
  col.height = size;
  const ctx = col.getContext('2d')!;

  const g = ctx.createLinearGradient(0, 0, 0, size);
  g.addColorStop(0, '#b57b58');
  g.addColorStop(0.5, '#c28864');
  g.addColorStop(1, '#ba7f5b');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);

  const hCv = document.createElement('canvas');
  hCv.width = size;
  hCv.height = size;
  const hctx = hCv.getContext('2d')!;
  hctx.fillStyle = '#808080';
  hctx.fillRect(0, 0, size, size);

  // Subtle organic skin mottling & micro-pores
  for (let i = 0; i < 2600; i++) {
    const x = (i * 173 + 11) % size;
    const y = (i * 293 + 37) % size;
    ctx.fillStyle =
      i % 2 === 0 ? 'rgba(232, 178, 146, 0.06)' : 'rgba(132, 74, 46, 0.06)';
    ctx.fillRect(x, y, 3, 2);

    const v = 122 + ((i * 31) % 13);
    hctx.fillStyle = `rgb(${v},${v},${v})`;
    hctx.fillRect(x, y, 2, 2);
  }

  const albedo = new THREE.CanvasTexture(col);
  albedo.wrapS = THREE.RepeatWrapping;
  albedo.wrapT = THREE.RepeatWrapping;
  albedo.repeat.set(2, 2);
  albedo.colorSpace = THREE.SRGBColorSpace;
  albedo.anisotropy = maxAnisotropy;

  const normal = heightCanvasToNormalTexture(hCv, 0.45, 4, 4, maxAnisotropy);
  return { albedo, normal };
}

/**
 * Generates a dedicated sculpted face albedo texture (soft eye-socket shading, warm cheek blush,
 * subtle nose-wing shading, natural soft beard/goatee stubble — zero cartoon floating shapes!).
 */
export function buildSculptedFaceTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const w = 512;
  const h = 512;
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  const ctx = cv.getContext('2d')!;

  // UV convention for our head loft: u = 0 & 1 is front center (+Z), u = 0.5 is back (-Z), v = 0 chin, v = 1 crown
  // Note: canvas Y=0 corresponds to v=1 (top/crown), canvas Y=h corresponds to v=0 (chin)
  ctx.fillStyle = '#c28864';
  ctx.fillRect(0, 0, w, h);

  // Helper to paint symmetrically around front seam (u = 0 and u = 1)
  const paintFrontRadial = (
    uOffset: number,
    vCenter: number,
    rx: number,
    ry: number,
    innerColor: string,
    outerColor: string
  ) => {
    const cy = (1 - vCenter) * h;
    const centers = [uOffset * w, (1 + uOffset) * w, (uOffset - 1) * w];
    for (const cx of centers) {
      if (cx < -rx * 2 || cx > w + rx * 2) continue;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(1, ry / rx);
      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
      grad.addColorStop(0, innerColor);
      grad.addColorStop(1, outerColor);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, rx, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  };

  // Warm sun-kissed cheekbone glow
  paintFrontRadial(0.085, 0.44, 38, 28, 'rgba(196, 114, 84, 0.24)', 'rgba(196, 114, 84, 0)');
  paintFrontRadial(-0.085, 0.44, 38, 28, 'rgba(196, 114, 84, 0.24)', 'rgba(196, 114, 84, 0)');

  // Subtle brow/eye-socket depth shadow
  paintFrontRadial(0.068, 0.54, 28, 20, 'rgba(116, 68, 44, 0.28)', 'rgba(116, 68, 44, 0)');
  paintFrontRadial(-0.068, 0.54, 28, 20, 'rgba(116, 68, 44, 0.28)', 'rgba(116, 68, 44, 0)');

  // Soft jaw & under-chin shadow
  const chinGrad = ctx.createLinearGradient(0, h * 0.78, 0, h);
  chinGrad.addColorStop(0, 'rgba(92, 52, 32, 0)');
  chinGrad.addColorStop(1, 'rgba(84, 46, 28, 0.34)');
  ctx.fillStyle = chinGrad;
  ctx.fillRect(0, h * 0.78, w, h * 0.22);

  // Soft, realistic groomed light beard / goatee & mustache shadow (NOT a harsh black sphere!)
  paintFrontRadial(0, 0.2, 42, 34, 'rgba(48, 34, 24, 0.48)', 'rgba(48, 34, 24, 0)');
  paintFrontRadial(0.036, 0.3, 24, 10, 'rgba(46, 32, 22, 0.42)', 'rgba(46, 32, 22, 0)');
  paintFrontRadial(-0.036, 0.3, 24, 10, 'rgba(46, 32, 22, 0.42)', 'rgba(46, 32, 22, 0)');

  // Subtle sideburns fading into temples
  paintFrontRadial(0.21, 0.48, 22, 56, 'rgba(42, 30, 22, 0.34)', 'rgba(42, 30, 22, 0)');
  paintFrontRadial(-0.21, 0.48, 22, 56, 'rgba(42, 30, 22, 0.34)', 'rgba(42, 30, 22, 0)');

  // Natural warm lip tint
  paintFrontRadial(0, 0.275, 28, 12, 'rgba(154, 86, 74, 0.46)', 'rgba(154, 86, 74, 0)');

  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}
