import * as THREE from 'three';
import type { DressingRoomGarment, GarmentStitchPattern } from '../types/crochet';
import {
  adjustHex,
  buildCrochetPbrTextureSet,
  buildGarmentAoMap,
  mixHex,
} from './crochetPbrTextures';
import {
  createSkinnedLoftGeometry,
  evalTorsoAnatomyShape,
  getArmBaseProfile,
  getLegBaseProfile,
  TORSO_BASE_PROFILE,
  type SkinnedHumanRig,
  type SkinnedLoftRing,
} from './professionalAvatarRig';

/* ============================================================================
   SKINNED COUTURE CROCHET GARMENT BUILDER
   - Builds every top & bottom garment as continuous THREE.SkinnedMesh shells
     bound directly to the avatar's 20-bone THREE.Skeleton.
   - Uses mathematically guaranteed radial clearance (r_garment >= r_bare + ease)
     so skin NEVER clips through knitwear in any of the 12 poses or 360° angles.
   - ZERO shoulder puffballs, ZERO elbow/knee spheres, seamless tailoring!
 ============================================================================ */

export interface GarmentBuildContext {
  rig: SkinnedHumanRig;
  /** Parent container inside rig.garmentRoot for SkinnedMesh shells */
  skinnedContainer: THREE.Group;
  /** Parent container attached to boneMap.spine2 (origin = world 0, 2.74, 0) */
  spine2DetailGroup: THREE.Group;
  /** Parent container attached to boneMap.hips (origin = world 0, 1.94, 0) */
  hipsDetailGroup: THREE.Group;
  knitRelief: boolean;
  maxAnisotropy: number;
  textureLoader: THREE.TextureLoader;
  isDisposed: () => boolean;
}

const SPINE2_WORLD_Y = 2.74;
const HIPS_WORLD_Y = 1.94;

function createYarnMaterial(
  ctx: GarmentBuildContext,
  palette: string[],
  stitch: GarmentStitchPattern,
  opts: {
    hasGrannyFloral?: boolean;
    repeatX: number;
    repeatY: number;
    aoKind: 'torso' | 'sleeve' | 'trouser';
    customPhotoUrl?: string;
    doubleSided?: boolean;
  }
): THREE.MeshPhysicalMaterial {
  const texSet = buildCrochetPbrTextureSet(palette, stitch, {
    hasGrannyFloral: opts.hasGrannyFloral,
    repeatX: opts.repeatX,
    repeatY: opts.repeatY,
    maxAnisotropy: ctx.maxAnisotropy,
  });

  const aoMap = buildGarmentAoMap(opts.aoKind);
  const sheenTint = mixHex(palette[0] || '#DEC098', '#fff5e4', 0.48);

  const mat = new THREE.MeshPhysicalMaterial({
    color: '#ffffff',
    map: texSet.albedo,
    normalMap: texSet.normal,
    normalScale: new THREE.Vector2(ctx.knitRelief ? 1.45 : 0.18, ctx.knitRelief ? 1.45 : 0.18),
    bumpMap: texSet.bump,
    bumpScale: ctx.knitRelief ? 0.015 : 0.002,
    roughnessMap: texSet.roughness,
    roughness: 1.0,
    metalness: 0.0,
    aoMap,
    aoMapIntensity: 0.72,
    sheen: 0.85,
    sheenRoughness: 0.68,
    sheenColor: new THREE.Color(sheenTint),
    envMapIntensity: 0.26,
    side: opts.doubleSided ? THREE.DoubleSide : THREE.FrontSide,
  });

  if (opts.customPhotoUrl) {
    ctx.textureLoader.load(opts.customPhotoUrl, (photoTex) => {
      if (ctx.isDisposed()) {
        photoTex.dispose();
        return;
      }
      photoTex.colorSpace = THREE.SRGBColorSpace;
      photoTex.wrapS = THREE.RepeatWrapping;
      photoTex.wrapT = THREE.RepeatWrapping;
      photoTex.anisotropy = ctx.maxAnisotropy;
      texSet.albedo.dispose();
      mat.map = photoTex;
      mat.needsUpdate = true;
    });
  }

  return mat;
}

function createTrimMaterial(
  ctx: GarmentBuildContext,
  trimHex: string
): THREE.MeshPhysicalMaterial {
  const texSet = buildCrochetPbrTextureSet([trimHex, adjustHex(trimHex, 0.74)], 'ribbed', {
    repeatX: 4,
    repeatY: 1.2,
    maxAnisotropy: ctx.maxAnisotropy,
  });

  return new THREE.MeshPhysicalMaterial({
    color: '#ffffff',
    map: texSet.albedo,
    normalMap: texSet.normal,
    normalScale: new THREE.Vector2(ctx.knitRelief ? 1.25 : 0.15, ctx.knitRelief ? 1.25 : 0.15),
    bumpMap: texSet.bump,
    bumpScale: ctx.knitRelief ? 0.012 : 0.002,
    roughnessMap: texSet.roughness,
    roughness: 1.0,
    metalness: 0.0,
    sheen: 0.78,
    sheenRoughness: 0.7,
    sheenColor: new THREE.Color(mixHex(trimHex, '#fff4e0', 0.42)),
    envMapIntensity: 0.26,
    side: THREE.DoubleSide,
  });
}

function addSkinnedPart(
  ctx: GarmentBuildContext,
  geo: THREE.BufferGeometry,
  mat: THREE.Material,
  name: string
): THREE.SkinnedMesh {
  const sm = new THREE.SkinnedMesh(geo, mat);
  sm.name = name;
  sm.castShadow = true;
  sm.receiveShadow = true;
  sm.frustumCulled = false;
  sm.bind(ctx.rig.skeleton, new THREE.Matrix4());
  ctx.skinnedContainer.add(sm);
  return sm;
}

/**
 * Evaluates a smooth, strictly non-clipping torso garment radius modulation:
 * softens sharp muscle indentations for realistic knitted wool drape while
 * guaranteeing radial clearance >= minClearance over the bare anatomy everywhere.
 */
function makeNonClippingTorsoShape(
  yWorld: number,
  bareRx: number,
  garmentRx: number,
  bareRz: number,
  garmentRz: number,
  minClearance = 0.018
): (theta: number) => number {
  const ratioX = bareRx / Math.max(0.01, garmentRx);
  const ratioZ = bareRz / Math.max(0.01, garmentRz);
  const worstRatio = Math.max(ratioX, ratioZ);
  const clearBoost = minClearance / Math.max(0.08, Math.min(garmentRx, garmentRz));

  return (theta: number) => {
    const bareMod = evalTorsoAnatomyShape(yWorld, theta, false);
    const smoothMod = evalTorsoAnatomyShape(yWorld, theta, true);
    const minNeeded = bareMod * worstRatio + clearBoost;
    return Math.max(smoothMod, minNeeded);
  };
}

/**
 * Interpolates a ring from a sorted vertical profile at any arbitrary world Y.
 */
function sampleProfileAtY(
  profile: Array<{
    y: number;
    rx: number;
    rz: number;
    cx?: number;
    cz?: number;
    shape?: (theta: number) => number;
    weights: Array<[number, number]>;
  }>,
  targetY: number
): {
  y: number;
  rx: number;
  rz: number;
  cx: number;
  cz: number;
  shape?: (theta: number) => number;
  weights: Array<[number, number]>;
} {
  if (targetY <= profile[0].y) {
    const p = profile[0];
    return {
      y: targetY,
      rx: p.rx,
      rz: p.rz,
      cx: p.cx ?? 0,
      cz: p.cz ?? 0,
      shape: p.shape,
      weights: p.weights,
    };
  }
  const last = profile[profile.length - 1];
  if (targetY >= last.y) {
    return {
      y: targetY,
      rx: last.rx,
      rz: last.rz,
      cx: last.cx ?? 0,
      cz: last.cz ?? 0,
      shape: last.shape,
      weights: last.weights,
    };
  }
  for (let i = 0; i < profile.length - 1; i++) {
    const a = profile[i];
    const b = profile[i + 1];
    if (targetY >= a.y && targetY <= b.y) {
      const t = (targetY - a.y) / Math.max(1e-5, b.y - a.y);
      const mergedW = new Map<number, number>();
      for (const [bi, bw] of a.weights) {
        mergedW.set(bi, (mergedW.get(bi) ?? 0) + bw * (1 - t));
      }
      for (const [bi, bw] of b.weights) {
        mergedW.set(bi, (mergedW.get(bi) ?? 0) + bw * t);
      }
      const weights = Array.from(mergedW.entries())
        .sort((x, y) => y[1] - x[1])
        .slice(0, 4);

      const shapeA = a.shape;
      const shapeB = b.shape;
      const shape =
        shapeA || shapeB
          ? (theta: number) =>
              THREE.MathUtils.lerp(shapeA ? shapeA(theta) : 1, shapeB ? shapeB(theta) : 1, t)
          : undefined;

      return {
        y: targetY,
        rx: THREE.MathUtils.lerp(a.rx, b.rx, t),
        rz: THREE.MathUtils.lerp(a.rz, b.rz, t),
        cx: THREE.MathUtils.lerp(a.cx ?? 0, b.cx ?? 0, t),
        cz: THREE.MathUtils.lerp(a.cz ?? 0, b.cz ?? 0, t),
        shape,
        weights,
      };
    }
  }
  return {
    y: targetY,
    rx: last.rx,
    rz: last.rz,
    cx: last.cx ?? 0,
    cz: last.cz ?? 0,
    shape: last.shape,
    weights: last.weights,
  };
}

/**
 * Evaluates exact front-surface Z coordinate of a torso garment at world Y & theta
 * so buttons, lapels, shawl collars, and pockets sit flush without floating or sinking.
 */
function evalTorsoFrontPoint(
  yWorld: number,
  theta: number,
  easeX: number,
  easeZ: number
): THREE.Vector3 {
  const sample = sampleProfileAtY(TORSO_BASE_PROFILE, yWorld);
  const rx = sample.rx + easeX;
  const rz = sample.rz + easeZ;
  const mod = makeNonClippingTorsoShape(yWorld, sample.rx, rx, sample.rz, rz, 0.018)(theta);
  return new THREE.Vector3(
    Math.sin(theta) * rx * mod,
    yWorld - SPINE2_WORLD_Y,
    sample.cz + Math.cos(theta) * rz * mod
  );
}

/* ============================================================================
   TOP GARMENT BUILDER (Sweaters, Vests, Cardigans, Jackets, Hoodies, Polos, Scarves)
 ============================================================================ */

export function buildSkinnedTopGarment(
  ctx: GarmentBuildContext,
  garment: DressingRoomGarment
): void {
  const nameLower = `${garment.name} ${garment.subtitle} ${garment.stitchNote}`.toLowerCase();
  const sil = garment.silhouetteKind || 'sweater';
  const stitch: GarmentStitchPattern = garment.stitchPattern || 'cable';
  const palette =
    garment.palette.length >= 2 ? garment.palette : ['#DEC098', '#8B6239', '#D9A441'];
  const baseHex = palette[0];
  const trimHex = palette[1] || adjustHex(baseHex, 0.74);
  const accentHex = palette[2] || '#D9A441';
  const hasGrannyFloral = /girasol|granny|flor|botánic|margarita|jardin|jardín/.test(nameLower);

  const isVest = sil === 'vest' || garment.category === 'Chalecos';
  const isCardigan = sil === 'cardigan' || garment.category === 'Cardigans';
  const isJacket = sil === 'jacket' || sil === 'coat' || garment.category === 'Chaquetas';
  const isHoodie = sil === 'hoodie' || /capucha|sudadera|hoodie/.test(nameLower);
  const isPolo = sil === 'polo' || /polo|camisa|guayabera/.test(nameLower);
  const isScarf = sil === 'scarf' || garment.category === 'Accesorios';
  const isShortSleeve = isPolo || /manga corta|verano|playa|camiseta|brasil/.test(nameLower);
  const isLacedHenley = /túnica|tunica|lino|vitruvio|cordón|cordon|henley/.test(nameLower);

  const clothMat = createYarnMaterial(ctx, palette, stitch, {
    hasGrannyFloral,
    repeatX: stitch === 'jacquard' || stitch === 'heraldic' ? 1 : 3.2,
    repeatY: stitch === 'jacquard' || stitch === 'heraldic' ? 1 : 2.6,
    aoKind: 'torso',
    customPhotoUrl: garment.isCustom ? garment.photoDataUrl : undefined,
    doubleSided: isVest || isCardigan || isJacket || isHoodie,
  });

  const sleeveMat = createYarnMaterial(ctx, palette, stitch, {
    hasGrannyFloral,
    repeatX: 2.0,
    repeatY: 2.2,
    aoKind: 'sleeve',
    customPhotoUrl: garment.isCustom ? garment.photoDataUrl : undefined,
  });

  const trimMat = createTrimMaterial(ctx, trimHex);
  const pipeMat = createTrimMaterial(ctx, accentHex);

  const buttonMat = new THREE.MeshStandardMaterial({
    color: isJacket ? '#c89b44' : '#5a3a1e',
    metalness: isJacket ? 0.72 : 0.14,
    roughness: isJacket ? 0.28 : 0.48,
    envMapIntensity: 0.75,
  });

  // 1. Special Case: Draped Crochet Scarf Accessory (parented to Spine2)
  if (isScarf) {
    const scarfTorus = new THREE.Mesh(new THREE.TorusGeometry(0.175, 0.058, 18, 56), clothMat);
    scarfTorus.rotation.x = Math.PI / 2 + 0.14;
    scarfTorus.position.set(0, 3.12 - SPINE2_WORLD_Y, 0.015);
    scarfTorus.castShadow = true;
    scarfTorus.receiveShadow = true;
    ctx.spine2DetailGroup.add(scarfTorus);

    for (const side of [-1, 1]) {
      const tailCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(side * 0.1, 3.08 - SPINE2_WORLD_Y, 0.175),
        new THREE.Vector3(side * 0.13, 2.8 - SPINE2_WORLD_Y, 0.285),
        new THREE.Vector3(side * 0.115, 2.5 - SPINE2_WORLD_Y, 0.265),
        new THREE.Vector3(side * 0.12, 2.18 - SPINE2_WORLD_Y, 0.24),
      ]);
      const tail = new THREE.Mesh(new THREE.TubeGeometry(tailCurve, 22, 0.052, 12, false), clothMat);
      tail.scale.set(1.32, 1, 0.34);
      tail.castShadow = true;
      tail.receiveShadow = true;
      ctx.spine2DetailGroup.add(tail);

      for (let f = -2; f <= 2; f++) {
        const fringe = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.0045, 0.1, 6), trimMat);
        fringe.position.set(side * 0.12 + f * 0.022, 2.11 - SPINE2_WORLD_Y, 0.24);
        ctx.spine2DetailGroup.add(fringe);
      }
    }
    return;
  }

  // 2. Tailored Ease & Vertical Extent for Continuous Skinned Torso Shell
  const hemY = isJacket ? 1.84 : isCardigan ? 1.88 : isVest ? 1.98 : isHoodie ? 1.92 : 1.94;
  const collarTopY = isVest ? 3.07 : 3.115;

  const baseEaseX = isJacket ? 0.056 : isCardigan || isHoodie ? 0.048 : isVest ? 0.036 : 0.042;
  const baseEaseZ = isJacket ? 0.052 : isCardigan || isHoodie ? 0.044 : isVest ? 0.034 : 0.04;

  // Dense vertical sampling (16 rings) so garment bends seamlessly across Hips -> Spine -> Spine1 -> Spine2 -> Neck
  const ySamples: number[] = [];
  const ringSteps = 15;
  for (let i = 0; i <= ringSteps; i++) {
    ySamples.push(THREE.MathUtils.lerp(hemY, collarTopY, i / ringSteps));
  }

  const torsoRings: SkinnedLoftRing[] = ySamples.map((y) => {
    const s = sampleProfileAtY(TORSO_BASE_PROFILE, y);

    // Tailored waist suppression / jacket drape / vest armhole shaping
    let extraX = baseEaseX;
    let extraZ = baseEaseZ;

    // Slight tailored flare at jacket hem; snugger ribbed hem on sweaters/hoodies
    if (y < 2.08) {
      if (isJacket) {
        extraX += 0.012;
        extraZ += 0.008;
      } else if (!isVest && !isCardigan) {
        extraX -= 0.008;
        extraZ -= 0.006;
      }
    }

    // Smooth collar inward hug at neckline so collar never floats away from trapezius/neck
    if (y > 3.02) {
      const collarT = THREE.MathUtils.clamp((y - 3.02) / (collarTopY - 3.02), 0, 1);
      extraX = THREE.MathUtils.lerp(extraX, isVest ? 0.024 : 0.03, collarT);
      extraZ = THREE.MathUtils.lerp(extraZ, isVest ? 0.022 : 0.026, collarT);
    }

    // For sleeveless waistcoats, carve back the outer deltoid edge slightly for clean armholes
    if (isVest && y >= 2.72 && y <= 3.05) {
      extraX -= 0.014;
    }

    const rx = s.rx + extraX;
    const rz = s.rz + extraZ;

    // Pointed twin-tip bespoke waistcoat bottom hem
    const yOffset =
      isVest && y < 2.06
        ? (theta: number) => {
            const w = THREE.MathUtils.clamp((2.06 - y) / 0.08, 0, 1);
            const front = Math.max(0, Math.cos(theta));
            const tipL = Math.exp(-Math.pow((theta - 0.34) / 0.24, 2));
            const tipR = Math.exp(-Math.pow((theta - (Math.PI * 2 - 0.34)) / 0.24, 2));
            const centerNotch = Math.exp(-Math.pow(Math.sin(theta) / 0.14, 2)) * front;
            return w * (-0.055 * (tipL + tipR) + 0.03 * centerNotch);
          }
        : undefined;

    return {
      y,
      rx,
      rz,
      cz: s.cz,
      shape: makeNonClippingTorsoShape(y, s.rx, rx, s.rz, rz, 0.016),
      yOffset,
      weights: s.weights,
    };
  });

  // Neckline / front opening cutout
  const cutout = isVest
    ? { type: 'vneck' as const, yBottom: 2.66, yTop: collarTopY, maxHalfAngle: 0.44 }
    : isCardigan
      ? {
          type: 'open-front' as const,
          yBottom: 2.52,
          yTop: collarTopY,
          maxHalfAngle: 0.46,
          minHalfAngle: 0.09,
        }
      : isJacket
        ? {
            type: 'vneck' as const,
            yBottom: 2.58,
            yTop: collarTopY,
            maxHalfAngle: 0.42,
          }
        : isLacedHenley || isPolo
          ? {
              type: 'henley-v' as const,
              yBottom: 2.82,
              yTop: collarTopY,
              maxHalfAngle: 0.26,
            }
          : undefined;

  const torsoGeo = createSkinnedLoftGeometry(torsoRings, 64, false, false, cutout);
  addSkinnedPart(ctx, torsoGeo, clothMat, 'SkinnedTopTorso');

  // 3. Ribbed Bottom Hem Band (for Sweaters, Hoodies, Cardigans)
  if (!isVest && !isJacket && !isPolo) {
    const hemRings: SkinnedLoftRing[] = [hemY - 0.015, hemY + 0.055].map((y) => {
      const s = sampleProfileAtY(TORSO_BASE_PROFILE, y);
      const rx = s.rx + baseEaseX - 0.005;
      const rz = s.rz + baseEaseZ - 0.004;
      return {
        y,
        rx,
        rz,
        cz: s.cz,
        shape: makeNonClippingTorsoShape(y, s.rx, rx, s.rz, rz, 0.014),
        weights: s.weights,
      };
    });
    const hemCutout = isCardigan
      ? { type: 'open-front' as const, yBottom: 2.5, yTop: 3.12, maxHalfAngle: 0.1, minHalfAngle: 0.09 }
      : undefined;
    addSkinnedPart(
      ctx,
      createSkinnedLoftGeometry(hemRings, 64, false, false, hemCutout),
      trimMat,
      'SkinnedTopRibbedHem'
    );
  }

  // 4. Sculpted Neckline / Collar / Lapels / Plackets / Hood (parented cleanly to Spine2)
  if (isVest) {
    // V-neck ribbed binding & 5-button tailored placket
    for (const side of [-1, 1]) {
      const pts: THREE.Vector3[] = [];
      for (let k = 0; k <= 6; k++) {
        const t = k / 6;
        const yW = THREE.MathUtils.lerp(2.66, collarTopY, t);
        const ang = side * THREE.MathUtils.lerp(0.03, 0.44, Math.pow(t, 0.88));
        const p = evalTorsoFrontPoint(yW, ang, baseEaseX + 0.006, baseEaseZ + 0.006);
        pts.push(p);
      }
      const trimCurve = new THREE.CatmullRomCurve3(pts);
      const trimTube = new THREE.Mesh(new THREE.TubeGeometry(trimCurve, 18, 0.015, 8, false), trimMat);
      trimTube.castShadow = true;
      ctx.spine2DetailGroup.add(trimTube);
    }

    // Center button placket & 5 artisanal horn buttons
    for (let b = 0; b < 5; b++) {
      const yW = 2.61 - b * 0.135;
      const p = evalTorsoFrontPoint(yW, 0, baseEaseX + 0.008, baseEaseZ + 0.012);
      const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.009, 14), buttonMat);
      btn.rotation.x = Math.PI / 2;
      btn.position.copy(p);
      ctx.spine2DetailGroup.add(btn);
    }
  } else if (isCardigan) {
    // Plush sculpted shawl collar rolling gracefully down the open front
    for (const side of [-1, 1]) {
      const pts: THREE.Vector3[] = [];
      for (let k = 0; k <= 10; k++) {
        const t = k / 10;
        const yW = THREE.MathUtils.lerp(hemY + 0.02, collarTopY + 0.03, t);
        const ang =
          yW <= 2.52
            ? side * 0.1
            : side * THREE.MathUtils.lerp(0.1, 0.48, Math.pow((yW - 2.52) / (collarTopY - 2.52), 0.85));
        const p = evalTorsoFrontPoint(yW, ang, baseEaseX + 0.012, baseEaseZ + 0.014);
        pts.push(p);
      }
      // Wrap around back of neck
      pts.push(new THREE.Vector3(side * 0.12, 3.13 - SPINE2_WORLD_Y, -0.09));
      pts.push(new THREE.Vector3(0, 3.14 - SPINE2_WORLD_Y, -0.145));

      const shawlCurve = new THREE.CatmullRomCurve3(pts);
      const shawl = new THREE.Mesh(new THREE.TubeGeometry(shawlCurve, 28, 0.034, 12, false), trimMat);
      shawl.scale.set(1.0, 1.0, 0.68);
      shawl.castShadow = true;
      shawl.receiveShadow = true;
      ctx.spine2DetailGroup.add(shawl);

      // Contrasting accent piping along shawl edge
      const pipe = new THREE.Mesh(new THREE.TubeGeometry(shawlCurve, 24, 0.009, 6, false), pipeMat);
      pipe.position.z += 0.018;
      ctx.spine2DetailGroup.add(pipe);
    }

    // 4 cardigan buttons & twin ribbed patch pockets
    for (let b = 0; b < 4; b++) {
      const yW = 2.46 - b * 0.145;
      const p = evalTorsoFrontPoint(yW, 0.13, baseEaseX + 0.015, baseEaseZ + 0.024);
      const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.01, 14), buttonMat);
      btn.rotation.x = Math.PI / 2;
      btn.position.copy(p);
      ctx.spine2DetailGroup.add(btn);
    }

    for (const side of [-1, 1]) {
      const pkCenter = evalTorsoFrontPoint(2.09, side * 0.52, baseEaseX + 0.008, baseEaseZ + 0.01);
      const pocket = new THREE.Mesh(new THREE.BoxGeometry(0.155, 0.16, 0.024), clothMat);
      pocket.position.copy(pkCenter);
      pocket.rotation.y = side * 0.42;
      pocket.castShadow = true;
      ctx.spine2DetailGroup.add(pocket);

      const pTrim = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.024, 0.028), pipeMat);
      pTrim.position.set(pkCenter.x, pkCenter.y + 0.078, pkCenter.z + 0.002);
      pTrim.rotation.y = side * 0.42;
      ctx.spine2DetailGroup.add(pTrim);
    }
  } else if (isJacket) {
    // Double-breasted peak lapels + brass buttons + welt pockets
    for (const side of [-1, 1]) {
      const pts: THREE.Vector3[] = [
        evalTorsoFrontPoint(2.58, side * 0.06, baseEaseX + 0.012, baseEaseZ + 0.016),
        evalTorsoFrontPoint(2.76, side * 0.25, baseEaseX + 0.018, baseEaseZ + 0.022),
        evalTorsoFrontPoint(2.94, side * 0.42, baseEaseX + 0.015, baseEaseZ + 0.018),
        new THREE.Vector3(side * 0.155, 3.12 - SPINE2_WORLD_Y, 0.04),
        new THREE.Vector3(0, 3.135 - SPINE2_WORLD_Y, -0.145),
      ];
      const lapel = new THREE.Mesh(
        new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 22, 0.032, 10, false),
        trimMat
      );
      lapel.scale.set(1.15, 1, 0.48);
      lapel.castShadow = true;
      ctx.spine2DetailGroup.add(lapel);

      // Double-breasted twin columns of brushed-gold blazer buttons
      for (let row = 0; row < 3; row++) {
        const yW = 2.48 - row * 0.165;
        const p = evalTorsoFrontPoint(yW, side * 0.2, baseEaseX + 0.012, baseEaseZ + 0.014);
        const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.017, 0.017, 0.011, 16), buttonMat);
        btn.rotation.x = Math.PI / 2;
        btn.rotation.z = -side * 0.16;
        btn.position.copy(p);
        ctx.spine2DetailGroup.add(btn);
      }

      // Flap hip pockets
      const pk = evalTorsoFrontPoint(2.08, side * 0.56, baseEaseX + 0.012, baseEaseZ + 0.014);
      const flap = new THREE.Mesh(new THREE.BoxGeometry(0.165, 0.044, 0.022), trimMat);
      flap.position.copy(pk);
      flap.rotation.y = side * 0.48;
      flap.castShadow = true;
      ctx.spine2DetailGroup.add(flap);
    }
  } else if (isHoodie) {
    // Cozy resting crochet hood behind neck + drawstring cords + kangaroo pocket
    const hoodRing = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.048, 14, 40), clothMat);
    hoodRing.rotation.x = Math.PI / 2 + 0.24;
    hoodRing.position.set(0, 3.12 - SPINE2_WORLD_Y, -0.025);
    hoodRing.scale.set(1.06, 1.18, 0.85);
    hoodRing.castShadow = true;
    ctx.spine2DetailGroup.add(hoodRing);

    const hoodDraping = new THREE.Mesh(
      new THREE.SphereGeometry(0.215, 24, 18, 0, Math.PI * 2, 0.25, Math.PI * 0.56),
      clothMat
    );
    hoodDraping.position.set(0, 3.04 - SPINE2_WORLD_Y, -0.145);
    hoodDraping.rotation.x = -0.62;
    hoodDraping.scale.set(1.05, 0.92, 0.88);
    hoodDraping.castShadow = true;
    hoodDraping.receiveShadow = true;
    ctx.spine2DetailGroup.add(hoodDraping);

    for (const side of [-1, 1]) {
      const cordStart = evalTorsoFrontPoint(3.04, side * 0.16, baseEaseX + 0.01, baseEaseZ + 0.018);
      const cordMid = evalTorsoFrontPoint(2.84, side * 0.15, baseEaseX + 0.012, baseEaseZ + 0.024);
      const cordEnd = evalTorsoFrontPoint(2.64, side * 0.13, baseEaseX + 0.01, baseEaseZ + 0.022);
      const cord = new THREE.Mesh(
        new THREE.TubeGeometry(new THREE.CatmullRomCurve3([cordStart, cordMid, cordEnd]), 14, 0.0085, 8, false),
        trimMat
      );
      cord.castShadow = true;
      ctx.spine2DetailGroup.add(cord);
    }

    // Front kangaroo pocket
    const kCenter = evalTorsoFrontPoint(2.14, 0, baseEaseX + 0.012, baseEaseZ + 0.016);
    const kangaroo = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.175, 0.032), clothMat);
    kangaroo.position.copy(kCenter);
    kangaroo.castShadow = true;
    ctx.spine2DetailGroup.add(kangaroo);
  } else if (isLacedHenley) {
    // Signature laced Aran linen-crochet tunic placket with criss-cross leather cords!
    const collar = new THREE.Mesh(new THREE.TorusGeometry(0.148, 0.024, 12, 36), trimMat);
    collar.rotation.x = Math.PI / 2 + 0.1;
    collar.position.set(0, 3.12 - SPINE2_WORLD_Y, 0.006);
    collar.castShadow = true;
    ctx.spine2DetailGroup.add(collar);

    const cordMat = new THREE.MeshStandardMaterial({
      color: '#6b4222',
      roughness: 0.56,
      metalness: 0.08,
    });
    for (let k = 0; k < 4; k++) {
      const yA = 3.04 - k * 0.055;
      const yB = yA - 0.048;
      const pL1 = evalTorsoFrontPoint(yA, -0.17, baseEaseX + 0.008, baseEaseZ + 0.012);
      const pR2 = evalTorsoFrontPoint(yB, 0.16, baseEaseX + 0.008, baseEaseZ + 0.012);
      const pR1 = evalTorsoFrontPoint(yA, 0.17, baseEaseX + 0.008, baseEaseZ + 0.012);
      const pL2 = evalTorsoFrontPoint(yB, -0.16, baseEaseX + 0.008, baseEaseZ + 0.012);

      ctx.spine2DetailGroup.add(
        new THREE.Mesh(
          new THREE.TubeGeometry(new THREE.LineCurve3(pL1, pR2), 4, 0.006, 6, false),
          cordMat
        )
      );
      ctx.spine2DetailGroup.add(
        new THREE.Mesh(
          new THREE.TubeGeometry(new THREE.LineCurve3(pR1, pL2), 4, 0.006, 6, false),
          cordMat
        )
      );
    }
  } else {
    // Classic plush ribbed crew-neck / polo collar hugging neck base cleanly
    const collar = new THREE.Mesh(new THREE.TorusGeometry(0.148, 0.028, 14, 40), trimMat);
    collar.rotation.x = Math.PI / 2 + 0.1;
    collar.position.set(0, 3.125 - SPINE2_WORLD_Y, 0.005);
    collar.scale.set(1.06, 1.0, 0.96);
    collar.castShadow = true;
    collar.receiveShadow = true;
    ctx.spine2DetailGroup.add(collar);

    if (isPolo) {
      for (const side of [-1, 1]) {
        const wing = new THREE.Mesh(new THREE.BoxGeometry(0.115, 0.068, 0.018), trimMat);
        wing.position.set(side * 0.088, 3.085 - SPINE2_WORLD_Y, 0.155);
        wing.rotation.set(0.24, side * 0.42, -side * 0.3);
        wing.castShadow = true;
        ctx.spine2DetailGroup.add(wing);
      }
    }
  }

  // 5. Continuous Skinned Sleeves (ZERO shoulder puffball spheres, ZERO elbow balls!)
  if (!isVest) {
    const sleeveEase = isJacket ? 0.04 : isCardigan || isHoodie ? 0.036 : 0.03;
    const sleeveBottomY = isShortSleeve ? 2.58 : 1.985;

    for (const side of [-1, 1] as const) {
      const armProf = getArmBaseProfile(side);
      const yTop = armProf[armProf.length - 1].y; // 3.01 inside shoulder seam!
      const sSteps = isShortSleeve ? 7 : 13;

      const sleeveRings: SkinnedLoftRing[] = [];
      for (let i = 0; i <= sSteps; i++) {
        const y = THREE.MathUtils.lerp(sleeveBottomY, yTop, i / sSteps);
        const s = sampleProfileAtY(armProf, y);
        // Slightly taper toward wrist cuff for authentic knitwear drape
        const wristTaper =
          !isShortSleeve && y < 2.25
            ? THREE.MathUtils.lerp(0.76, 1.0, (y - sleeveBottomY) / (2.25 - sleeveBottomY))
            : 1.0;

        // Blend inner shoulder seam slightly tighter into torso so shoulder silhouette is crisp
        const shoulderBlend = y > 2.94 ? 0.82 : 1.0;
        const rx = s.rx + sleeveEase * wristTaper * shoulderBlend;
        const rz = s.rz + sleeveEase * wristTaper * shoulderBlend;

        const baseShape = s.shape;
        sleeveRings.push({
          y,
          cx: s.cx,
          cz: s.cz,
          rx,
          rz,
          shape: baseShape
            ? (t) => {
                const bare = baseShape(t);
                const smooth = 1 + (bare - 1) * 0.45;
                const ratio = Math.max(s.rx / rx, s.rz / rz);
                return Math.max(smooth, bare * ratio + 0.012 / Math.min(rx, rz));
              }
            : undefined,
          weights: s.weights,
        });
      }

      const sleeveGeo = createSkinnedLoftGeometry(sleeveRings, 36, false, true);
      addSkinnedPart(ctx, sleeveGeo, sleeveMat, side < 0 ? 'SkinnedSleeveL' : 'SkinnedSleeveR');

      // Ribbed wrist or short-sleeve cuff bound to the exact same arm bones!
      const cuffH = isShortSleeve ? 0.045 : 0.07;
      const cuffRings: SkinnedLoftRing[] = [sleeveBottomY - 0.01, sleeveBottomY + cuffH].map(
        (y) => {
          const s = sampleProfileAtY(armProf, y);
          const rx = s.rx + sleeveEase * 0.72;
          const rz = s.rz + sleeveEase * 0.72;
          return {
            y,
            cx: s.cx,
            cz: s.cz,
            rx,
            rz,
            weights: s.weights,
          };
        }
      );
      addSkinnedPart(
        ctx,
        createSkinnedLoftGeometry(cuffRings, 32, false, false),
        trimMat,
        side < 0 ? 'SkinnedCuffL' : 'SkinnedCuffR'
      );
    }
  }
}

/* ============================================================================
   BOTTOM GARMENT BUILDER (Tailored Trousers, Joggers, Shorts / Bermudas)
 ============================================================================ */

export function buildSkinnedBottomGarment(
  ctx: GarmentBuildContext,
  garment: DressingRoomGarment
): { isLongTrouser: boolean } {
  const nameLower = `${garment.name} ${garment.subtitle} ${garment.stitchNote}`.toLowerCase();
  const sil = garment.silhouetteKind || 'trousers';
  const stitch: GarmentStitchPattern = garment.stitchPattern || 'ribbed';
  const palette =
    garment.palette.length >= 2 ? garment.palette : ['#D9C5A0', '#8C6E48', '#B89B6E'];
  const baseHex = palette[0];
  const trimHex = palette[1] || adjustHex(baseHex, 0.74);

  const isShorts =
    sil === 'shorts' ||
    garment.category === 'Bermudas' ||
    /bermuda|short|corto|playa|verano/.test(nameLower);
  const isJoggers = sil === 'joggers' || /jogger|puño|cordón|relajado|deportiv/.test(nameLower);
  const hasGrannyFloral = /girasol|granny|flor|botánic/.test(nameLower);

  const clothMat = createYarnMaterial(ctx, palette, stitch, {
    hasGrannyFloral,
    repeatX: 2.8,
    repeatY: isShorts ? 1.8 : 3.4,
    aoKind: 'trouser',
    customPhotoUrl: garment.isCustom ? garment.photoDataUrl : undefined,
    doubleSided: true,
  });

  const trimMat = createTrimMaterial(ctx, trimHex);
  const cordMat = new THREE.MeshStandardMaterial({
    color: mixHex(baseHex, '#fff8ea', 0.45),
    roughness: 0.82,
    envMapIntensity: 0.25,
  });

  const ease = isJoggers ? 0.04 : isShorts ? 0.036 : 0.034;

  // 1. Continuous Skinned Pelvis / Waistblock (y = 1.67 to 2.13)
  const pelvisYs = [1.67, 1.75, 1.84, 1.94, 2.04, 2.13];
  const pelvisRings: SkinnedLoftRing[] = pelvisYs.map((y) => {
    const s = sampleProfileAtY(TORSO_BASE_PROFILE, y);
    const rx = s.rx + ease;
    const rz = s.rz + ease * 0.94;
    return {
      y,
      rx,
      rz,
      cz: s.cz,
      shape: makeNonClippingTorsoShape(y, s.rx, rx, s.rz, rz, 0.015),
      weights: s.weights,
    };
  });
  addSkinnedPart(
    ctx,
    createSkinnedLoftGeometry(pelvisRings, 56, true, false),
    clothMat,
    'SkinnedBottomPelvis'
  );

  // Ribbed / Tailored Waistband (y = 2.08 to 2.16)
  const bandRings: SkinnedLoftRing[] = [2.08, 2.16].map((y) => {
    const s = sampleProfileAtY(TORSO_BASE_PROFILE, y);
    const rx = s.rx + ease + 0.005;
    const rz = s.rz + ease * 0.94 + 0.005;
    return {
      y,
      rx,
      rz,
      cz: s.cz,
      shape: makeNonClippingTorsoShape(y, s.rx, rx, s.rz, rz, 0.016),
      weights: s.weights,
    };
  });
  addSkinnedPart(
    ctx,
    createSkinnedLoftGeometry(bandRings, 56, false, false),
    trimMat,
    'SkinnedBottomWaistband'
  );

  // Waist details parented to Hips bone (origin = world y = 1.94)
  const waistBase = sampleProfileAtY(TORSO_BASE_PROFILE, 2.12);
  const waistZ = waistBase.cz + waistBase.rz + ease * 0.94 + 0.012;

  if (isJoggers || isShorts) {
    const knot = new THREE.Mesh(new THREE.SphereGeometry(0.018, 12, 10), cordMat);
    knot.position.set(0, 2.12 - HIPS_WORLD_Y, waistZ);
    ctx.hipsDetailGroup.add(knot);
    for (const s of [-1, 1]) {
      const cordCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(s * 0.012, 2.12 - HIPS_WORLD_Y, waistZ),
        new THREE.Vector3(s * 0.036, 2.02 - HIPS_WORLD_Y, waistZ + 0.022),
        new THREE.Vector3(s * 0.028, 1.91 - HIPS_WORLD_Y, waistZ + 0.015),
      ]);
      const cord = new THREE.Mesh(new THREE.TubeGeometry(cordCurve, 12, 0.0075, 8, false), cordMat);
      cord.castShadow = true;
      ctx.hipsDetailGroup.add(cord);
    }
  } else {
    // Tailored trouser button, subtle J-fly stitch & 4 belt loops
    const btn = new THREE.Mesh(
      new THREE.CylinderGeometry(0.017, 0.017, 0.01, 14),
      new THREE.MeshStandardMaterial({ color: '#6b4724', metalness: 0.35, roughness: 0.38 })
    );
    btn.rotation.x = Math.PI / 2;
    btn.position.set(0, 2.12 - HIPS_WORLD_Y, waistZ);
    ctx.hipsDetailGroup.add(btn);

    const flyCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.012, 2.08 - HIPS_WORLD_Y, waistZ),
      new THREE.Vector3(0.012, 1.96 - HIPS_WORLD_Y, waistZ + 0.008),
      new THREE.Vector3(0.002, 1.88 - HIPS_WORLD_Y, waistZ - 0.004),
    ]);
    ctx.hipsDetailGroup.add(
      new THREE.Mesh(new THREE.TubeGeometry(flyCurve, 10, 0.0042, 6, false), trimMat)
    );

    for (const ang of [-0.55, 0.55, -2.2, 2.2]) {
      const loop = new THREE.Mesh(new THREE.BoxGeometry(0.017, 0.068, 0.015), trimMat);
      loop.position.set(
        Math.sin(ang) * (waistBase.rx + ease + 0.006),
        2.12 - HIPS_WORLD_Y,
        waistBase.cz + Math.cos(ang) * (waistBase.rz + ease * 0.94 + 0.006)
      );
      loop.rotation.y = ang;
      ctx.hipsDetailGroup.add(loop);
    }
  }

  // 2. Continuous Seamless Skinned Pant Legs (ZERO hip spheres, ZERO knee spheres!)
  const legBottomY = isShorts ? 1.32 : isJoggers ? 0.32 : 0.275;
  const legSteps = isShorts ? 8 : 16;

  for (const side of [-1, 1] as const) {
    const legProf = getLegBaseProfile(side);
    const yTop = legProf[legProf.length - 1].y; // 1.94 inside pelvis!

    const pantRings: SkinnedLoftRing[] = [];
    for (let i = 0; i <= legSteps; i++) {
      const y = THREE.MathUtils.lerp(legBottomY, yTop, i / legSteps);
      const s = sampleProfileAtY(legProf, y);

      // Tailored trouser silhouette: relaxed straight drape past knee & calf (no sausage tightness!)
      let extraX = ease;
      let extraZ = ease;
      if (!isShorts) {
        if (y < 1.05 && y > 0.36) {
          // Tailored straight/slightly-tapered trouser room around knee & lower calf
          extraX += isJoggers ? 0.012 : 0.016;
          extraZ += isJoggers ? 0.012 : 0.016;
        } else if (y <= 0.36) {
          // Jogger tapers snugly into ankle cuff; trouser hangs neatly over sneaker collar
          extraX += isJoggers ? -0.006 : 0.022;
          extraZ += isJoggers ? -0.006 : 0.022;
        }
      } else if (y < 1.48) {
        extraX += 0.008;
        extraZ += 0.008;
      }

      const rx = s.rx + extraX;
      const rz = s.rz + extraZ;
      const baseShape = s.shape;

      pantRings.push({
        y,
        cx: s.cx,
        cz: s.cz,
        rx,
        rz,
        shape: (t) => {
          const bare = baseShape ? baseShape(t) : 1.0;
          const smooth = 1 + (bare - 1) * 0.35;
          // Subtle tailored vertical front trouser press crease
          const crease =
            !isShorts && !isJoggers
              ? 0.028 * Math.exp(-Math.pow(Math.sin(t) / 0.14, 2)) * Math.max(0, Math.cos(t))
              : 0;
          const ratio = Math.max(s.rx / rx, s.rz / rz);
          return Math.max(smooth + crease, bare * ratio + 0.014 / Math.min(rx, rz));
        },
        weights: s.weights,
      });
    }

    const legGeo = createSkinnedLoftGeometry(pantRings, 40, false, false);
    addSkinnedPart(ctx, legGeo, clothMat, side < 0 ? 'SkinnedLegGarmentL' : 'SkinnedLegGarmentR');

    // Bottom hem / jogger ribbed ankle cuff
    if (isShorts || isJoggers) {
      const cuffTop = legBottomY + (isShorts ? 0.055 : 0.075);
      const cuffRings: SkinnedLoftRing[] = [legBottomY - 0.01, cuffTop].map((y) => {
        const s = sampleProfileAtY(legProf, y);
        const rx = s.rx + (isJoggers ? ease * 0.65 : ease + 0.008);
        const rz = s.rz + (isJoggers ? ease * 0.65 : ease + 0.008);
        return {
          y,
          cx: s.cx,
          cz: s.cz,
          rx,
          rz,
          weights: s.weights,
        };
      });
      addSkinnedPart(
        ctx,
        createSkinnedLoftGeometry(cuffRings, 36, false, false),
        trimMat,
        side < 0 ? 'SkinnedLegCuffL' : 'SkinnedLegCuffR'
      );
    }
  }

  return { isLongTrouser: !isShorts };
}
