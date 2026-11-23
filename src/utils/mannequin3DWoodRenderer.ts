import * as THREE from 'three';

export type MannequinGender = 'male' | 'female';

export interface MannequinRenderOptions {
  gender: MannequinGender;
  yawDeg: number;
  color?: string;
  width?: number;
  height?: number;
}

interface LoftStation {
  y: number;
  cx?: number;
  cz?: number;
  rx: number;
  rz: number;
  /** Optional angular radius modulation; theta=0 is front (+Z), PI/2 is +X, PI is back (-Z) */
  sculpt?: (theta: number) => number;
  /** Optional subtle Z-shift modulation as a function of theta */
  sculptZ?: (theta: number) => number;
  /** Optional darker wood seam groove factor (0..1), either uniform or per-angle */
  seamDark?: number | ((theta: number) => number);
}

/** Angular shortest distance on circle [-PI, PI] */
function angDiff(a: number, b: number): number {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

/** Gaussian bump in angular space */
function angGauss(theta: number, center: number, width: number): number {
  const d = angDiff(theta, center) / width;
  return Math.exp(-d * d);
}

/** Build a smooth outward-facing lofted BufferGeometry with anatomical vertex colors & wood UVs */
function createLoftedGeometry(
  stations: LoftStation[],
  radialSegs = 44,
  capBottom = true,
  capTop = true
): THREE.BufferGeometry {
  const rows = stations.length;
  const cols = radialSegs + 1;

  const positions: number[] = [];
  const uvs: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];

  const minY = stations[0].y;
  const maxY = stations[rows - 1].y;
  const spanY = Math.max(0.001, maxY - minY);

  for (let i = 0; i < rows; i++) {
    const st = stations[i];
    const cx = st.cx ?? 0;
    const cz = st.cz ?? 0;
    const v = (st.y - minY) / spanY;

    for (let j = 0; j < cols; j++) {
      const u = j / radialSegs;
      const theta = u * Math.PI * 2;
      const mod = st.sculpt ? st.sculpt(theta) : 1;
      const zShift = st.sculptZ ? st.sculptZ(theta) : 0;
      const seam =
        typeof st.seamDark === 'function' ? st.seamDark(theta) : (st.seamDark ?? 0);

      const x = cx + Math.sin(theta) * st.rx * mod;
      const z = cz + Math.cos(theta) * st.rz * mod + zShift;

      positions.push(x, st.y, z);
      uvs.push(u * 1.4, v * Math.max(0.6, spanY * 2.2));

      // Subtle warm wood shading + carved seam darkening in vertex color
      const shade = Math.max(0.42, 1 - seam * 0.52);
      colors.push(shade, shade * (1 - seam * 0.12), shade * (1 - seam * 0.2));
    }
  }

  for (let i = 0; i < rows - 1; i++) {
    for (let j = 0; j < radialSegs; j++) {
      const a = i * cols + j;
      const b = i * cols + (j + 1);
      const c = (i + 1) * cols + j;
      const d = (i + 1) * cols + (j + 1);
      indices.push(a, b, d);
      indices.push(a, d, c);
    }
  }

  if (capBottom) {
    const first = stations[0];
    const centerIdx = positions.length / 3;
    positions.push(first.cx ?? 0, first.y, first.cz ?? 0);
    uvs.push(0.5, 0);
    colors.push(0.68, 0.58, 0.5);
    for (let j = 0; j < radialSegs; j++) {
      indices.push(centerIdx, j + 1, j);
    }
  }

  if (capTop) {
    const last = stations[rows - 1];
    const baseRow = (rows - 1) * cols;
    const centerIdx = positions.length / 3;
    positions.push(last.cx ?? 0, last.y, last.cz ?? 0);
    uvs.push(0.5, 1);
    colors.push(0.76, 0.68, 0.62);
    for (let j = 0; j < radialSegs; j++) {
      indices.push(centerIdx, baseRow + j, baseRow + j + 1);
    }
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geom.setIndex(indices);
  geom.computeVertexNormals();
  return geom;
}

/** Generate high-resolution carved honey/pear wood diffuse + bump + roughness maps */
function createCarvedWoodMaps(): {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
} {
  const size = 512;

  const diffCanvas = document.createElement('canvas');
  diffCanvas.width = size;
  diffCanvas.height = size;
  const dCtx = diffCanvas.getContext('2d')!;

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bCtx = bumpCanvas.getContext('2d')!;

  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = size;
  roughCanvas.height = size;
  const rCtx = roughCanvas.getContext('2d')!;

  const dImg = dCtx.createImageData(size, size);
  const bImg = bCtx.createImageData(size, size);
  const rImg = rCtx.createImageData(size, size);

  for (let y = 0; y < size; y++) {
    const ny = (y / size) * Math.PI * 2;
    for (let x = 0; x < size; x++) {
      const nx = (x / size) * Math.PI * 2;

      // Seamless tileable vertical wood grain with cathedral rings & fine pores
      const warp =
        Math.sin(ny * 2 + Math.sin(nx * 2) * 1.4) * 0.45 +
        Math.cos(ny * 1 - nx * 1) * 0.25;
      const ringCoord = nx * 11 + warp * 4.5 + Math.sin(ny * 3) * 0.7;
      const rings = Math.sin(ringCoord) * 0.5 + 0.5;
      const sharpRings = Math.pow(rings, 2.2);

      // Fine vertical wood fibers
      const fiber =
        Math.sin(nx * 46 + Math.sin(ny * 4) * 1.2) * 0.5 +
        Math.sin(nx * 91 + ny * 2) * 0.25 +
        Math.sin(nx * 163 - ny * 3) * 0.15;

      // Subtle medullary flecks
      const fleck = Math.max(0, Math.sin(nx * 29 + ny * 17) * Math.sin(nx * 13 - ny * 23));
      const grain = sharpRings * 0.58 + (fiber * 0.5 + 0.5) * 0.28 + fleck * 0.14;

      // Warm golden carved honey-beech wood palette matching classic atelier lay figures
      const r = Math.min(255, Math.max(0, Math.round(166 + grain * 66)));
      const g = Math.min(255, Math.max(0, Math.round(108 + grain * 58)));
      const b = Math.min(255, Math.max(0, Math.round(58 + grain * 42)));

      const idx = (y * size + x) * 4;
      dImg.data[idx] = r;
      dImg.data[idx + 1] = g;
      dImg.data[idx + 2] = b;
      dImg.data[idx + 3] = 255;

      const bumpVal = Math.min(255, Math.max(0, Math.round(115 + grain * 110)));
      bImg.data[idx] = bumpVal;
      bImg.data[idx + 1] = bumpVal;
      bImg.data[idx + 2] = bumpVal;
      bImg.data[idx + 3] = 255;

      const roughVal = Math.min(255, Math.max(0, Math.round(125 + (1 - grain) * 65)));
      rImg.data[idx] = roughVal;
      rImg.data[idx + 1] = roughVal;
      rImg.data[idx + 2] = roughVal;
      rImg.data[idx + 3] = 255;
    }
  }

  dCtx.putImageData(dImg, 0, 0);
  bCtx.putImageData(bImg, 0, 0);
  rCtx.putImageData(rImg, 0, 0);

  const map = new THREE.CanvasTexture(diffCanvas);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.colorSpace = THREE.SRGBColorSpace;
  map.needsUpdate = true;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.needsUpdate = true;

  const roughnessMap = new THREE.CanvasTexture(roughCanvas);
  roughnessMap.wrapS = THREE.RepeatWrapping;
  roughnessMap.wrapT = THREE.RepeatWrapping;
  roughnessMap.needsUpdate = true;

  return { map, bumpMap, roughnessMap };
}

/** Soft translucent contact shadow disc placed under feet */
function createShadowDisc(): THREE.Mesh {
  const s = 128;
  const c = document.createElement('canvas');
  c.width = s;
  c.height = s;
  const ctx = c.getContext('2d')!;
  const grad = ctx.createRadialGradient(s / 2, s / 2, 4, s / 2, s / 2, s / 2);
  grad.addColorStop(0, 'rgba(54, 28, 10, 0.24)');
  grad.addColorStop(0.52, 'rgba(54, 28, 10, 0.11)');
  grad.addColorStop(1, 'rgba(54, 28, 10, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, s, s);
  const tex = new THREE.CanvasTexture(c);
  const mat = new THREE.MeshBasicMaterial({
    map: tex,
    transparent: true,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 0.44), mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(0, -0.885, 0.01);
  return mesh;
}

/** Add a dark carved wooden panel seam line around a ring or vertical channel */
function createSeamRing(
  rx: number,
  rz: number,
  tube: number,
  y: number,
  cz: number,
  mat: THREE.Material
): THREE.Mesh {
  const geom = new THREE.TorusGeometry(1, tube, 10, 40);
  geom.scale(rx, rz, 1);
  const mesh = new THREE.Mesh(geom, mat);
  mesh.rotation.x = Math.PI / 2;
  mesh.position.set(0, y, cz);
  return mesh;
}

/** Build sculpted articulated wooden hand (palm + thumb + 4 slightly curved fingers) */
function buildWoodenHand(
  side: -1 | 1,
  isFemale: boolean,
  woodMat: THREE.Material,
  jointMat: THREE.Material
): THREE.Group {
  const hand = new THREE.Group();
  const s = isFemale ? 0.87 : 1.0;

  // Wrist articulation ball
  const wristBall = new THREE.Mesh(new THREE.SphereGeometry(0.025 * s, 16, 14), jointMat);
  hand.add(wristBall);

  // Sculpted beveled wooden palm (lofted vertically downwards from y=0 to y=-0.088*s)
  const palmStations: LoftStation[] = [
    { y: -0.088 * s, rx: 0.013 * s, rz: 0.036 * s, seamDark: 0.22 },
    { y: -0.072 * s, rx: 0.0155 * s, rz: 0.041 * s },
    { y: -0.044 * s, rx: 0.0165 * s, rz: 0.038 * s },
    { y: -0.018 * s, rx: 0.0145 * s, rz: 0.031 * s },
    { y: -0.004 * s, rx: 0.012 * s, rz: 0.024 * s, seamDark: 0.25 },
  ];
  const palm = new THREE.Mesh(createLoftedGeometry(palmStations, 24), woodMat);
  // Orient palm naturally inward toward thigh (thin along X, wider front-to-back along Z)
  hand.add(palm);

  // 4 sculpted gently curved wooden fingers (index, middle, ring, pinky)
  const fingerDefs = [
    { z: 0.028 * s, len: 0.068 * s, r: 0.0072 * s, curl: 0.16 }, // index
    { z: 0.010 * s, len: 0.076 * s, r: 0.0076 * s, curl: 0.19 }, // middle
    { z: -0.009 * s, len: 0.070 * s, r: 0.0071 * s, curl: 0.21 }, // ring
    { z: -0.026 * s, len: 0.056 * s, r: 0.0061 * s, curl: 0.23 }, // pinky
  ];

  for (const f of fingerDefs) {
    const fGroup = new THREE.Group();
    fGroup.position.set(0, -0.084 * s, f.z);

    // Knuckle joint
    const kn = new THREE.Mesh(new THREE.SphereGeometry(f.r * 0.96, 10, 8), jointMat);
    fGroup.add(kn);

    // Proximal phalanx
    const p1 = new THREE.Mesh(
      new THREE.CylinderGeometry(f.r * 0.92, f.r * 0.84, f.len * 0.56, 12),
      woodMat
    );
    p1.position.set(-side * 0.003 * s, -f.len * 0.28, 0);
    p1.rotation.z = -side * f.curl;
    fGroup.add(p1);

    // Distal phalanx slightly curved inward
    const p2 = new THREE.Mesh(
      new THREE.CapsuleGeometry(f.r * 0.72, f.len * 0.34, 6, 10),
      woodMat
    );
    p2.position.set(-side * (0.008 + f.curl * 0.024) * s, -f.len * 0.72, 0);
    p2.rotation.z = -side * (f.curl * 1.8);
    fGroup.add(p2);

    hand.add(fGroup);
  }

  // Sculpted articulated wooden thumb (forward + slight inward curve)
  const thumbGroup = new THREE.Group();
  thumbGroup.position.set(-side * 0.006 * s, -0.044 * s, 0.036 * s);
  thumbGroup.rotation.x = -0.34;
  thumbGroup.rotation.z = -side * 0.26;

  const tJoint = new THREE.Mesh(new THREE.SphereGeometry(0.0085 * s, 10, 8), jointMat);
  thumbGroup.add(tJoint);

  const t1 = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.0076 * s, 0.036 * s, 6, 10),
    woodMat
  );
  t1.position.set(0, -0.025 * s, 0.004 * s);
  thumbGroup.add(t1);

  hand.add(thumbGroup);
  return hand;
}

/** Build sculpted articulated wooden foot (heel, arch, instep, forefoot & toe bevel) */
function buildWoodenFoot(
  side: -1 | 1,
  isFemale: boolean,
  woodMat: THREE.Material,
  jointMat: THREE.Material
): THREE.Group {
  const foot = new THREE.Group();
  const sX = isFemale ? 0.88 : 1.0;
  const sZ = isFemale ? 0.90 : 1.0;

  // Ankle ball joint at origin (y = 0 -> world y = -0.785)
  const ankleBall = new THREE.Mesh(new THREE.SphereGeometry(0.032 * sX, 16, 14), jointMat);
  foot.add(ankleBall);

  // Sculpted foot lofted along height from sole (y = -0.095) up to ankle collar (y = -0.008)
  const footStations: LoftStation[] = [
    {
      y: -0.095,
      cx: side * 0.004,
      cz: 0.056 * sZ,
      rx: 0.043 * sX,
      rz: 0.106 * sZ,
      seamDark: 0.22,
      sculpt: (t) => 1 + 0.09 * angGauss(t, 0, 0.7) - 0.14 * angGauss(t, Math.PI, 0.9),
    },
    {
      y: -0.082,
      cx: side * 0.004,
      cz: 0.058 * sZ,
      rx: 0.046 * sX,
      rz: 0.112 * sZ,
      sculpt: (t) =>
        1 +
        0.08 * angGauss(t, 0, 0.65) -
        0.16 * angGauss(t, Math.PI, 0.85) -
        0.09 * angGauss(t, -side * Math.PI * 0.5, 0.6),
    },
    {
      y: -0.062,
      cx: side * 0.002,
      cz: 0.044 * sZ,
      rx: 0.041 * sX,
      rz: 0.092 * sZ,
      sculpt: (t) => 1 - 0.12 * angGauss(t, Math.PI, 0.85),
    },
    {
      y: -0.038,
      cx: 0,
      cz: 0.018 * sZ,
      rx: 0.036 * sX,
      rz: 0.056 * sZ,
    },
    {
      y: -0.014,
      cx: 0,
      cz: 0.004 * sZ,
      rx: 0.032 * sX,
      rz: 0.037 * sZ,
      seamDark: 0.34,
    },
  ];
  const footMesh = new THREE.Mesh(createLoftedGeometry(footStations, 32), woodMat);
  foot.add(footMesh);

  // Subtle carved wooden toe-block seam line across forefoot
  const toeSeam = new THREE.Mesh(
    new THREE.BoxGeometry(0.084 * sX, 0.0035, 0.0035),
    jointMat
  );
  toeSeam.position.set(side * 0.004, -0.068, 0.118 * sZ);
  toeSeam.rotation.y = -side * 0.12;
  foot.add(toeSeam);

  // Natural poised slight outward turnout (~7 degrees)
  foot.rotation.y = side * 0.12;
  return foot;
}

/** Build a complete full-body carved wooden articulated arm (shoulder -> fingertips) */
function buildFullArticulatedArm(
  side: -1 | 1,
  isFemale: boolean,
  woodMat: THREE.Material,
  jointMat: THREE.Material
): THREE.Group {
  const armRoot = new THREE.Group();
  const s = isFemale ? 0.84 : 1.0;

  // Shoulder ball joint
  const shoulderBall = new THREE.Mesh(
    new THREE.SphereGeometry(isFemale ? 0.041 : 0.051, 20, 16),
    jointMat
  );
  armRoot.add(shoulderBall);

  // Upper arm (y = 0 down to y = -0.275)
  const upperLen = isFemale ? 0.268 : 0.282;
  const upperStations: LoftStation[] = [
    { y: -upperLen, rx: 0.035 * s, rz: 0.037 * s, seamDark: 0.35 },
    {
      y: -upperLen * 0.82,
      rx: 0.041 * s,
      rz: 0.044 * s,
      sculpt: (t) => 1 + (isFemale ? 0.03 : 0.09) * angGauss(t, 0, 0.7),
    },
    {
      y: -upperLen * 0.52,
      rx: 0.047 * s,
      rz: 0.052 * s,
      sculpt: (t) =>
        1 +
        (isFemale ? 0.04 : 0.14) * angGauss(t, 0, 0.75) +
        (isFemale ? 0.03 : 0.11) * angGauss(t, Math.PI, 0.75),
    },
    {
      y: -upperLen * 0.22,
      cx: side * 0.004,
      rx: 0.053 * s,
      rz: 0.055 * s,
      sculpt: (t) => 1 + (isFemale ? 0.05 : 0.15) * angGauss(t, side * Math.PI * 0.5, 0.85),
    },
    {
      y: -0.012,
      cx: side * 0.003,
      rx: 0.047 * s,
      rz: 0.048 * s,
      seamDark: 0.32,
    },
  ];
  const upperArm = new THREE.Mesh(createLoftedGeometry(upperStations, 30), woodMat);
  armRoot.add(upperArm);

  // Elbow articulation group
  const elbowGroup = new THREE.Group();
  elbowGroup.position.set(0, -upperLen - 0.01, 0);
  // Subtle natural relaxed forward elbow bend
  elbowGroup.rotation.x = -0.11;
  elbowGroup.rotation.z = -side * 0.045;

  const elbowBall = new THREE.Mesh(new THREE.SphereGeometry(0.034 * s, 18, 14), jointMat);
  elbowGroup.add(elbowBall);

  // Carved bronze elbow ring
  const elbowRing = createSeamRing(0.037 * s, 0.039 * s, 0.0032, 0.009, 0, jointMat);
  elbowGroup.add(elbowRing);

  // Forearm (missing part added! y = -0.012 down to y = -foreLen)
  const foreLen = isFemale ? 0.238 : 0.248;
  const foreStations: LoftStation[] = [
    { y: -foreLen, rx: 0.024 * s, rz: 0.029 * s, seamDark: 0.34 },
    { y: -foreLen * 0.74, rx: 0.029 * s, rz: 0.033 * s },
    {
      y: -foreLen * 0.42,
      rx: 0.037 * s,
      rz: 0.041 * s,
      sculpt: (t) => 1 + (isFemale ? 0.03 : 0.1) * angGauss(t, side * Math.PI * 0.35, 0.8),
    },
    {
      y: -foreLen * 0.18,
      rx: 0.042 * s,
      rz: 0.045 * s,
      sculpt: (t) => 1 + (isFemale ? 0.04 : 0.12) * angGauss(t, side * Math.PI * 0.4, 0.85),
    },
    { y: -0.014, rx: 0.035 * s, rz: 0.037 * s, seamDark: 0.34 },
  ];
  const forearm = new THREE.Mesh(createLoftedGeometry(foreStations, 28), woodMat);
  elbowGroup.add(forearm);

  // Hand attached to wrist
  const hand = buildWoodenHand(side, isFemale, woodMat, jointMat);
  hand.position.set(0, -foreLen - 0.01, 0.004);
  elbowGroup.add(hand);

  armRoot.add(elbowGroup);

  // Natural poised downward arm hang angled slightly clear of the hips
  armRoot.rotation.z = side * (isFemale ? 0.145 : 0.125);
  armRoot.rotation.x = 0.03;
  return armRoot;
}

/** Build a complete full-body carved wooden articulated leg (hip -> foot) */
function buildFullArticulatedLeg(
  side: -1 | 1,
  isFemale: boolean,
  woodMat: THREE.Material,
  jointMat: THREE.Material
): THREE.Group {
  const leg = new THREE.Group();

  // Hip ball joint (world y = -0.042)
  const hipBall = new THREE.Mesh(
    new THREE.SphereGeometry(isFemale ? 0.056 : 0.059, 20, 16),
    jointMat
  );
  hipBall.position.set(0, -0.042, 0);
  leg.add(hipBall);

  // Sculpted Thigh (y = -0.415 up to y = -0.05)
  const thighStations: LoftStation[] = [
    {
      y: -0.415,
      cx: side * -0.004,
      cz: 0.002,
      rx: isFemale ? 0.047 : 0.052,
      rz: isFemale ? 0.051 : 0.055,
      seamDark: 0.36,
    },
    {
      y: -0.34,
      cx: side * -0.003,
      cz: 0.006,
      rx: isFemale ? 0.057 : 0.062,
      rz: isFemale ? 0.062 : 0.067,
      sculpt: (t) => 1 + (isFemale ? 0.05 : 0.11) * angGauss(t, 0, 0.8),
    },
    {
      y: -0.22,
      cx: side * 0.002,
      cz: 0.007,
      rx: isFemale ? 0.072 : 0.074,
      rz: isFemale ? 0.076 : 0.079,
      sculpt: (t) =>
        1 +
        (isFemale ? 0.05 : 0.12) * angGauss(t, 0, 0.8) +
        (isFemale ? 0.09 : 0.05) * angGauss(t, side * Math.PI * 0.5, 0.85) +
        0.06 * angGauss(t, Math.PI, 0.85),
    },
    {
      y: -0.11,
      cx: side * 0.006,
      cz: 0.002,
      rx: isFemale ? 0.082 : 0.081,
      rz: isFemale ? 0.084 : 0.084,
      sculpt: (t) =>
        1 +
        (isFemale ? 0.1 : 0.06) * angGauss(t, side * Math.PI * 0.5, 0.8) +
        (isFemale ? 0.09 : 0.06) * angGauss(t, Math.PI, 0.85),
    },
    {
      y: -0.052,
      cx: side * 0.004,
      cz: 0,
      rx: isFemale ? 0.070 : 0.071,
      rz: isFemale ? 0.071 : 0.073,
      seamDark: 0.34,
    },
  ];
  const thigh = new THREE.Mesh(createLoftedGeometry(thighStations, 34), woodMat);
  leg.add(thigh);

  // Articulated Knee Joint + Sculpted Wooden Patella Cap (y = -0.435)
  const kneeBall = new THREE.Mesh(
    new THREE.SphereGeometry(isFemale ? 0.044 : 0.049, 18, 16),
    jointMat
  );
  kneeBall.position.set(side * -0.005, -0.436, 0.0);
  leg.add(kneeBall);

  const patella = new THREE.Mesh(
    new THREE.SphereGeometry(isFemale ? 0.032 : 0.036, 16, 14),
    woodMat
  );
  patella.scale.set(0.95, 1.12, 0.58);
  patella.position.set(side * -0.005, -0.432, 0.034);
  leg.add(patella);

  // Sculpted Calf & Shin (y = -0.772 up to y = -0.456)
  const calfStations: LoftStation[] = [
    {
      y: -0.772,
      cx: side * -0.007,
      cz: -0.008,
      rx: isFemale ? 0.030 : 0.035,
      rz: isFemale ? 0.035 : 0.040,
      seamDark: 0.35,
    },
    {
      y: -0.68,
      cx: side * -0.007,
      cz: -0.010,
      rx: isFemale ? 0.038 : 0.043,
      rz: isFemale ? 0.044 : 0.049,
      sculpt: (t) => 1 + 0.08 * angGauss(t, Math.PI, 0.75),
    },
    {
      y: -0.57,
      cx: side * -0.005,
      cz: -0.014,
      rx: isFemale ? 0.052 : 0.058,
      rz: isFemale ? 0.058 : 0.065,
      sculpt: (t) =>
        1 +
        (isFemale ? 0.14 : 0.19) * angGauss(t, Math.PI, 0.75) +
        0.07 * angGauss(t, side * Math.PI * 0.65, 0.7) +
        0.04 * angGauss(t, 0, 0.45), // shin crest
    },
    {
      y: -0.50,
      cx: side * -0.005,
      cz: -0.008,
      rx: isFemale ? 0.050 : 0.056,
      rz: isFemale ? 0.054 : 0.060,
      sculpt: (t) => 1 + (isFemale ? 0.1 : 0.14) * angGauss(t, Math.PI, 0.8),
    },
    {
      y: -0.456,
      cx: side * -0.005,
      cz: -0.002,
      rx: isFemale ? 0.044 : 0.049,
      rz: isFemale ? 0.047 : 0.052,
      seamDark: 0.35,
    },
  ];
  const calf = new THREE.Mesh(createLoftedGeometry(calfStations, 34), woodMat);
  leg.add(calf);

  // Articulated Ankle + Sculpted Wooden Foot
  const foot = buildWoodenFoot(side, isFemale, woodMat, jointMat);
  foot.position.set(side * -0.007, -0.785, -0.008);
  leg.add(foot);

  return leg;
}

/** Build sculpted full-body carved wooden mannequin (Male or Female) */
function buildSculptedMannequin(
  gender: MannequinGender,
  woodMat: THREE.Material,
  jointMat: THREE.Material,
  seamMat: THREE.Material
): THREE.Group {
  const isFemale = gender === 'female';
  const root = new THREE.Group();

  // ---------------- 1. SCULPTED CLASSICAL ARTIST HEAD ----------------
  const headScale = isFemale ? 0.93 : 1.0;
  const headStations: LoftStation[] = [
    {
      y: 0.656,
      cz: 0.016,
      rx: 0.036 * headScale,
      rz: 0.045 * headScale,
      seamDark: 0.25,
      sculpt: (t) => 1 + 0.14 * angGauss(t, 0, 0.55), // chin point
    },
    {
      y: 0.684,
      cz: 0.015,
      rx: 0.058 * headScale,
      rz: 0.072 * headScale,
      sculpt: (t) =>
        1 +
        0.1 * angGauss(t, 0, 0.5) -
        0.04 * angGauss(t, Math.PI * 0.5, 0.55) -
        0.04 * angGauss(t, -Math.PI * 0.5, 0.55),
    },
    {
      y: 0.722,
      cz: 0.011,
      rx: 0.071 * headScale,
      rz: 0.088 * headScale,
      // Cheekbone planes & sculpted central nose ridge
      sculpt: (t) =>
        1 +
        0.13 * angGauss(t, 0, 0.2) -
        0.05 * angGauss(t, 0.42, 0.26) -
        0.05 * angGauss(t, -0.42, 0.26),
    },
    {
      y: 0.758,
      cz: 0.006,
      rx: 0.075 * headScale,
      rz: 0.095 * headScale,
      // Subtle eye socket plane + nose bridge + brow ridge
      sculpt: (t) =>
        1 +
        0.11 * angGauss(t, 0, 0.18) -
        0.07 * angGauss(t, 0.36, 0.24) -
        0.07 * angGauss(t, -0.36, 0.24) +
        0.03 * angGauss(t, Math.PI, 0.9),
    },
    {
      y: 0.788,
      cz: 0.003,
      rx: 0.077 * headScale,
      rz: 0.098 * headScale,
      // Brow ridge & smooth forehead
      sculpt: (t) => 1 + (isFemale ? 0.025 : 0.055) * angGauss(t, 0, 0.55),
    },
    {
      y: 0.832,
      cz: -0.004,
      rx: 0.072 * headScale,
      rz: 0.091 * headScale,
    },
    {
      y: 0.864,
      cz: -0.008,
      rx: 0.048 * headScale,
      rz: 0.062 * headScale,
    },
    {
      y: 0.878,
      cz: -0.009,
      rx: 0.016 * headScale,
      rz: 0.020 * headScale,
    },
  ];
  const head = new THREE.Mesh(createLoftedGeometry(headStations, 40), woodMat);
  root.add(head);

  // Subtle carved wooden ears
  for (const side of [-1, 1] as const) {
    const ear = new THREE.Mesh(
      new THREE.SphereGeometry(0.016 * headScale, 12, 10),
      woodMat
    );
    ear.scale.set(0.42, 1.35, 0.72);
    ear.position.set(side * 0.074 * headScale, 0.742, -0.004);
    root.add(ear);
  }

  // ---------------- 2. NECK & ARTICULATED COLLAR ----------------
  const neckStations: LoftStation[] = [
    {
      y: 0.562,
      cz: -0.005,
      rx: isFemale ? 0.050 : 0.064,
      rz: isFemale ? 0.049 : 0.062,
      seamDark: 0.4,
    },
    {
      y: 0.596,
      cz: -0.003,
      rx: isFemale ? 0.044 : 0.055,
      rz: isFemale ? 0.045 : 0.055,
    },
    {
      y: 0.642,
      cz: 0.001,
      rx: isFemale ? 0.042 : 0.052,
      rz: isFemale ? 0.044 : 0.053,
    },
    {
      y: 0.662,
      cz: 0.003,
      rx: isFemale ? 0.039 : 0.048,
      rz: isFemale ? 0.041 : 0.049,
      seamDark: 0.38,
    },
  ];
  const neck = new THREE.Mesh(createLoftedGeometry(neckStations, 32), woodMat);
  root.add(neck);
  root.add(createSeamRing(isFemale ? 0.049 : 0.063, isFemale ? 0.048 : 0.061, 0.003, 0.566, -0.005, seamMat));

  // Subtle carved wooden seam shading along front centerline (theta=0) and back spine (theta=PI)
  const torsoLineSeam = (base = 0) => (t: number) =>
    Math.min(
      1,
      base +
        0.52 * angGauss(t, Math.PI, 0.055) +
        0.38 * angGauss(t, 0, 0.055)
    );

  // ---------------- 3. UPPER TORSO (CHEST / PECTORALS OR BUST / BACK) ----------------
  const upperTorsoStations: LoftStation[] = isFemale
    ? [
        // Female graceful ribcage -> sculpted bust -> delicate collar/shoulders
        {
          y: 0.295,
          cz: 0.004,
          rx: 0.118,
          rz: 0.088,
          seamDark: torsoLineSeam(0.45),
          sculpt: (t) => 1 - 0.08 * angGauss(t, Math.PI, 0.28), // spinal furrow
        },
        {
          y: 0.34,
          cz: 0.008,
          rx: 0.132,
          rz: 0.097,
          seamDark: torsoLineSeam(0.08),
          sculpt: (t) =>
            1 +
            0.09 * angGauss(t, 0.44, 0.34) +
            0.09 * angGauss(t, -0.44, 0.34) -
            0.06 * angGauss(t, 0, 0.2) -
            0.09 * angGauss(t, Math.PI, 0.28),
        },
        {
          y: 0.385,
          cz: 0.012,
          rx: 0.145,
          rz: 0.105,
          seamDark: torsoLineSeam(0),
          // Sculpted feminine bust fullness (twin smooth curves with central sternum channel)
          sculpt: (t) =>
            1 +
            0.29 * angGauss(t, 0.44, 0.33) +
            0.29 * angGauss(t, -0.44, 0.33) -
            0.08 * angGauss(t, 0, 0.18) -
            0.1 * angGauss(t, Math.PI, 0.28) +
            0.05 * angGauss(t, Math.PI - 0.52, 0.36) +
            0.05 * angGauss(t, -Math.PI + 0.52, 0.36),
        },
        {
          y: 0.432,
          cz: 0.01,
          rx: 0.154,
          rz: 0.102,
          seamDark: torsoLineSeam(0),
          sculpt: (t) =>
            1 +
            0.24 * angGauss(t, 0.45, 0.34) +
            0.24 * angGauss(t, -0.45, 0.34) -
            0.07 * angGauss(t, 0, 0.19) -
            0.09 * angGauss(t, Math.PI, 0.26) +
            0.07 * angGauss(t, Math.PI - 0.55, 0.38) +
            0.07 * angGauss(t, -Math.PI + 0.55, 0.38),
        },
        {
          y: 0.482,
          cz: 0.002,
          rx: 0.165,
          rz: 0.092,
          seamDark: torsoLineSeam(0),
          sculpt: (t) =>
            1 +
            0.07 * angGauss(t, 0.44, 0.4) +
            0.07 * angGauss(t, -0.44, 0.4) -
            0.08 * angGauss(t, Math.PI, 0.26) +
            0.07 * angGauss(t, Math.PI - 0.55, 0.4) +
            0.07 * angGauss(t, -Math.PI + 0.55, 0.4),
        },
        {
          y: 0.532,
          cz: -0.004,
          rx: 0.152,
          rz: 0.076,
          seamDark: torsoLineSeam(0),
          sculpt: (t) => 1 - 0.05 * angGauss(t, Math.PI, 0.28),
        },
        {
          y: 0.562,
          cz: -0.005,
          rx: 0.088,
          rz: 0.056,
          seamDark: 0.32,
        },
      ]
    : [
        // Male broad athletic V-taper ribcage -> sculpted pectorals -> broad shoulders
        {
          y: 0.295,
          cz: 0.004,
          rx: 0.152,
          rz: 0.106,
          seamDark: torsoLineSeam(0.46),
          sculpt: (t) =>
            1 +
            0.06 * angGauss(t, 0.36, 0.32) +
            0.06 * angGauss(t, -0.36, 0.32) -
            0.06 * angGauss(t, 0, 0.18) -
            0.1 * angGauss(t, Math.PI, 0.26),
        },
        {
          y: 0.352,
          cz: 0.009,
          rx: 0.172,
          rz: 0.116,
          seamDark: torsoLineSeam(0.12),
          sculpt: (t) =>
            1 +
            0.12 * angGauss(t, 0.42, 0.36) +
            0.12 * angGauss(t, -0.42, 0.36) -
            0.07 * angGauss(t, 0, 0.18) -
            0.11 * angGauss(t, Math.PI, 0.26) +
            0.08 * angGauss(t, Math.PI - 0.58, 0.42) +
            0.08 * angGauss(t, -Math.PI + 0.58, 0.42),
        },
        {
          y: 0.418,
          cz: 0.012,
          rx: 0.194,
          rz: 0.122,
          seamDark: torsoLineSeam(0),
          // Strong sculpted male pectorals + latissimus width + sculpted scapulae on back
          sculpt: (t) =>
            1 +
            0.22 * angGauss(t, 0.44, 0.38) +
            0.22 * angGauss(t, -0.44, 0.38) -
            0.09 * angGauss(t, 0, 0.16) -
            0.12 * angGauss(t, Math.PI, 0.24) +
            0.11 * angGauss(t, Math.PI - 0.56, 0.4) +
            0.11 * angGauss(t, -Math.PI + 0.56, 0.4),
        },
        {
          y: 0.476,
          cz: 0.007,
          rx: 0.208,
          rz: 0.114,
          seamDark: torsoLineSeam(0),
          sculpt: (t) =>
            1 +
            0.16 * angGauss(t, 0.45, 0.4) +
            0.16 * angGauss(t, -0.45, 0.4) -
            0.07 * angGauss(t, 0, 0.16) -
            0.11 * angGauss(t, Math.PI, 0.24) +
            0.1 * angGauss(t, Math.PI - 0.55, 0.42) +
            0.1 * angGauss(t, -Math.PI + 0.55, 0.42),
        },
        {
          y: 0.528,
          cz: -0.002,
          rx: 0.192,
          rz: 0.094,
          seamDark: torsoLineSeam(0),
          sculpt: (t) => 1 - 0.07 * angGauss(t, Math.PI, 0.26),
        },
        {
          y: 0.562,
          cz: -0.005,
          rx: 0.108,
          rz: 0.068,
          seamDark: 0.32,
        },
      ];

  const upperTorso = new THREE.Mesh(createLoftedGeometry(upperTorsoStations, 48), woodMat);
  root.add(upperTorso);

  // Dark carved wooden ribcage articulation seam ring (just like screenshot!)
  root.add(
    createSeamRing(
      isFemale ? 0.118 : 0.152,
      isFemale ? 0.088 : 0.106,
      0.0036,
      0.295,
      0.004,
      seamMat
    )
  );

  // ---------------- 4. MID-TORSO / WAIST & ABDOMEN SEGMENT ----------------
  const midTorsoStations: LoftStation[] = isFemale
    ? [
        {
          y: 0.100,
          cz: 0.004,
          rx: 0.118,
          rz: 0.088,
          seamDark: torsoLineSeam(0.45),
          sculpt: (t) => 1 - 0.09 * angGauss(t, Math.PI, 0.3),
        },
        {
          y: 0.158,
          cz: 0.009,
          rx: 0.108,
          rz: 0.084,
          seamDark: torsoLineSeam(0),
          // Narrow sculpted female hourglass waist + graceful lumbar arch
          sculpt: (t) =>
            1 +
            0.05 * angGauss(t, 0, 0.55) -
            0.11 * angGauss(t, Math.PI, 0.32),
        },
        {
          y: 0.215,
          cz: 0.008,
          rx: 0.107,
          rz: 0.084,
          seamDark: torsoLineSeam(0),
          sculpt: (t) =>
            1 +
            0.04 * angGauss(t, 0, 0.5) -
            0.1 * angGauss(t, Math.PI, 0.3),
        },
        {
          y: 0.262,
          cz: 0.006,
          rx: 0.114,
          rz: 0.087,
          seamDark: torsoLineSeam(0),
          sculpt: (t) => 1 - 0.09 * angGauss(t, Math.PI, 0.28),
        },
        {
          y: 0.296,
          cz: 0.004,
          rx: 0.118,
          rz: 0.088,
          seamDark: torsoLineSeam(0.42),
        },
      ]
    : [
        // Male athletic sculpted abs & obliques
        {
          y: 0.100,
          cz: 0.005,
          rx: 0.144,
          rz: 0.100,
          seamDark: torsoLineSeam(0.45),
          sculpt: (t) =>
            1 +
            0.07 * angGauss(t, 0.28, 0.24) +
            0.07 * angGauss(t, -0.28, 0.24) -
            0.06 * angGauss(t, 0, 0.13) -
            0.1 * angGauss(t, Math.PI, 0.28),
        },
        {
          y: 0.155,
          cz: 0.008,
          rx: 0.137,
          rz: 0.098,
          seamDark: torsoLineSeam(0.06),
          sculpt: (t) =>
            1 +
            0.1 * angGauss(t, 0.28, 0.24) +
            0.1 * angGauss(t, -0.28, 0.24) -
            0.07 * angGauss(t, 0, 0.13) -
            0.11 * angGauss(t, Math.PI, 0.28),
        },
        {
          y: 0.205,
          cz: 0.008,
          rx: 0.139,
          rz: 0.099,
          seamDark: torsoLineSeam(0.18),
          sculpt: (t) =>
            1 +
            0.08 * angGauss(t, 0.28, 0.24) +
            0.08 * angGauss(t, -0.28, 0.24) -
            0.06 * angGauss(t, 0, 0.13) -
            0.1 * angGauss(t, Math.PI, 0.26),
        },
        {
          y: 0.252,
          cz: 0.007,
          rx: 0.147,
          rz: 0.103,
          seamDark: torsoLineSeam(0.06),
          sculpt: (t) =>
            1 +
            0.1 * angGauss(t, 0.3, 0.26) +
            0.1 * angGauss(t, -0.3, 0.26) -
            0.07 * angGauss(t, 0, 0.13) -
            0.1 * angGauss(t, Math.PI, 0.26),
        },
        {
          y: 0.296,
          cz: 0.004,
          rx: 0.151,
          rz: 0.105,
          seamDark: torsoLineSeam(0.42),
        },
      ];

  const midTorso = new THREE.Mesh(createLoftedGeometry(midTorsoStations, 46), woodMat);
  root.add(midTorso);

  // Articulated waist bronze/dark seam ring between abdomen and pelvis
  root.add(
    createSeamRing(
      isFemale ? 0.118 : 0.144,
      isFemale ? 0.088 : 0.100,
      0.0038,
      0.104,
      0.004,
      seamMat
    )
  );

  // ---------------- 5. PELVIS & HIPS SEGMENT (MISSING LOWER-BODY BRIDGE ADDED!) ----------------
  const pelvisStations: LoftStation[] = isFemale
    ? [
        {
          y: -0.072,
          cz: -0.002,
          rx: 0.068,
          rz: 0.064,
          seamDark: 0.36,
        },
        {
          y: -0.036,
          cz: -0.004,
          rx: 0.154,
          rz: 0.104,
          // Rounded sculpted feminine glutes & hip sweep
          sculpt: (t) =>
            1 +
            0.2 * angGauss(t, Math.PI - 0.44, 0.42) +
            0.2 * angGauss(t, -Math.PI + 0.44, 0.42) -
            0.1 * angGauss(t, Math.PI, 0.18),
        },
        {
          y: 0.014,
          cz: -0.002,
          rx: 0.172,
          rz: 0.108,
          sculpt: (t) =>
            1 +
            0.18 * angGauss(t, Math.PI - 0.44, 0.44) +
            0.18 * angGauss(t, -Math.PI + 0.44, 0.44) -
            0.09 * angGauss(t, Math.PI, 0.18) +
            0.05 * angGauss(t, 0, 0.6),
        },
        {
          y: 0.062,
          cz: 0.002,
          rx: 0.152,
          rz: 0.098,
          sculpt: (t) =>
            1 +
            0.09 * angGauss(t, Math.PI - 0.44, 0.44) +
            0.09 * angGauss(t, -Math.PI + 0.44, 0.44) -
            0.08 * angGauss(t, Math.PI, 0.24),
        },
        {
          y: 0.101,
          cz: 0.004,
          rx: 0.120,
          rz: 0.088,
          seamDark: 0.38,
        },
      ]
    : [
        // Athletic male pelvis & glutes
        {
          y: -0.072,
          cz: -0.002,
          rx: 0.068,
          rz: 0.066,
          seamDark: 0.36,
        },
        {
          y: -0.036,
          cz: -0.003,
          rx: 0.148,
          rz: 0.102,
          sculpt: (t) =>
            1 +
            0.14 * angGauss(t, Math.PI - 0.44, 0.42) +
            0.14 * angGauss(t, -Math.PI + 0.44, 0.42) -
            0.09 * angGauss(t, Math.PI, 0.18),
        },
        {
          y: 0.015,
          cz: 0.0,
          rx: 0.158,
          rz: 0.106,
          sculpt: (t) =>
            1 +
            0.13 * angGauss(t, Math.PI - 0.44, 0.44) +
            0.13 * angGauss(t, -Math.PI + 0.44, 0.44) -
            0.09 * angGauss(t, Math.PI, 0.18),
        },
        {
          y: 0.064,
          cz: 0.003,
          rx: 0.151,
          rz: 0.102,
          sculpt: (t) => 1 - 0.09 * angGauss(t, Math.PI, 0.24),
        },
        {
          y: 0.101,
          cz: 0.005,
          rx: 0.144,
          rz: 0.100,
          seamDark: 0.38,
        },
      ];

  const pelvis = new THREE.Mesh(createLoftedGeometry(pelvisStations, 46), woodMat);
  root.add(pelvis);

  // ---------------- 6. FULL ARTICULATED ARMS (SHOULDER -> HANDS) ----------------
  const shoulderX = isFemale ? 0.172 : 0.214;
  const shoulderY = isFemale ? 0.495 : 0.502;
  for (const side of [-1, 1] as const) {
    const arm = buildFullArticulatedArm(side, isFemale, woodMat, jointMat);
    arm.position.set(side * shoulderX, shoulderY, -0.004);
    root.add(arm);
  }

  // ---------------- 7. FULL ARTICULATED LEGS (HIPS -> FEET) ----------------
  const hipX = isFemale ? 0.092 : 0.090;
  for (const side of [-1, 1] as const) {
    const leg = buildFullArticulatedLeg(side, isFemale, woodMat, jointMat);
    leg.position.set(side * hipX, 0, 0);
    root.add(leg);
  }

  // Subtle contact shadow disc beneath feet
  root.add(createShadowDisc());

  // Slightly refine female overall proportion (graceful stature)
  if (isFemale) {
    root.scale.set(0.97, 0.985, 0.97);
  }

  return root;
}

/* ---------- Singleton Shared WebGL Renderer + Model Cache ---------- */

interface RendererSingleton {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  maleModel: THREE.Group;
  femaleModel: THREE.Group;
  woodMat: THREE.MeshStandardMaterial;
  jointMat: THREE.MeshStandardMaterial;
  seamMat: THREE.MeshStandardMaterial;
}

let singleton: RendererSingleton | null = null;
const dataUrlCache = new Map<string, string>();
const MAX_CACHE_ENTRIES = 160;

function getSingleton(): RendererSingleton | null {
  if (singleton) return singleton;
  if (typeof document === 'undefined') return null;

  try {
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.14;
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();

    // Classic studio 3-point warm atelier lighting
    const hemi = new THREE.HemisphereLight(0xfff6e8, 0x7b4a24, 1.18);
    scene.add(hemi);

    const keyLight = new THREE.DirectionalLight(0xfff1da, 1.95);
    keyLight.position.set(-2.2, 3.1, 3.8);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xf6dfc2, 0.78);
    fillLight.position.set(2.8, 1.2, 2.2);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffd596, 1.22);
    rimLight.position.set(1.6, 2.6, -3.4);
    scene.add(rimLight);

    const maps = createCarvedWoodMaps();

    const woodMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#ffffff'),
      map: maps.map,
      bumpMap: maps.bumpMap,
      bumpScale: 0.0085,
      roughnessMap: maps.roughnessMap,
      roughness: 0.56,
      metalness: 0.04,
      vertexColors: true,
    });

    const jointMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#5a391e'),
      roughness: 0.36,
      metalness: 0.54,
    });

    const seamMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#3b1e0c'),
      roughness: 0.68,
      metalness: 0.12,
    });

    const maleModel = buildSculptedMannequin('male', woodMat, jointMat, seamMat);
    const femaleModel = buildSculptedMannequin('female', woodMat, jointMat, seamMat);
    maleModel.visible = false;
    femaleModel.visible = false;
    scene.add(maleModel);
    scene.add(femaleModel);

    // Narrow tele-lens portrait FOV (26°) avoids perspective distortion on head/feet
    const camera = new THREE.PerspectiveCamera(26, 7 / 16, 0.1, 20);
    camera.position.set(0, 0.0, 4.35);
    camera.lookAt(0, -0.01, 0);

    singleton = {
      renderer,
      scene,
      camera,
      maleModel,
      femaleModel,
      woodMat,
      jointMat,
      seamMat,
    };
    return singleton;
  } catch {
    return null;
  }
}

export function normalizeYawDeg(deg: number): number {
  const n = Math.round(deg) % 360;
  return n < 0 ? n + 360 : n;
}

function renderInternal(opts: MannequinRenderOptions): HTMLCanvasElement | null {
  const s = getSingleton();
  if (!s) return null;

  const width = opts.width ?? 448;
  const height = opts.height ?? 1024;
  const yawRad = (normalizeYawDeg(opts.yawDeg) * Math.PI) / 180;

  if (s.renderer.domElement.width !== width || s.renderer.domElement.height !== height) {
    s.renderer.setSize(width, height, false);
  }
  s.camera.aspect = width / height;
  s.camera.updateProjectionMatrix();

  // Apply natural wood or custom sketch tint while preserving carved wood grain
  if (opts.color && opts.color !== 'natural') {
    s.woodMat.color.set(opts.color);
    s.woodMat.color.lerp(new THREE.Color('#ffffff'), 0.22);
  } else {
    s.woodMat.color.set('#ffffff');
  }

  s.maleModel.visible = opts.gender === 'male';
  s.femaleModel.visible = opts.gender === 'female';

  const active = opts.gender === 'male' ? s.maleModel : s.femaleModel;
  active.rotation.set(0, yawRad, 0);

  s.renderer.clear(true, true, true);
  s.renderer.render(s.scene, s.camera);
  return s.renderer.domElement;
}

/** Render directly into a target 2D <canvas> at 60fps (zero WebGL context leaks!) */
export function renderMannequinToCanvas(
  targetCanvas: HTMLCanvasElement,
  opts: MannequinRenderOptions
): boolean {
  const width = opts.width ?? 448;
  const height = opts.height ?? 1024;
  const src = renderInternal({ ...opts, width, height });
  if (!src) return false;

  if (targetCanvas.width !== width || targetCanvas.height !== height) {
    targetCanvas.width = width;
    targetCanvas.height = height;
  }
  const ctx = targetCanvas.getContext('2d');
  if (!ctx) return false;
  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(src, 0, 0, width, height);
  return true;
}

/** Render and cache a transparent PNG data URL for miniatures or static snapshots */
export function renderMannequinToDataUrl(opts: MannequinRenderOptions): string | null {
  const width = opts.width ?? 224;
  const height = opts.height ?? 512;
  const yaw = normalizeYawDeg(opts.yawDeg);
  const colorKey = opts.color || 'natural';
  const key = `${opts.gender}|${yaw}|${colorKey}|${width}x${height}`;

  const cached = dataUrlCache.get(key);
  if (cached) return cached;

  const src = renderInternal({ ...opts, yawDeg: yaw, width, height });
  if (!src) return null;

  const url = src.toDataURL('image/png');
  if (dataUrlCache.size >= MAX_CACHE_ENTRIES) {
    const firstKey = dataUrlCache.keys().next().value;
    if (firstKey !== undefined) dataUrlCache.delete(firstKey);
  }
  dataUrlCache.set(key, url);
  return url;
}

/** Render a crisp 2K-grade transparent RGBA PNG Blob of the mannequin at its exact 360° angle */
export async function renderMannequinPngBlob(
  opts: Omit<MannequinRenderOptions, 'width' | 'height'>
): Promise<Blob | null> {
  const src = renderInternal({
    ...opts,
    width: 728,
    height: 1664,
  });
  if (!src) return null;

  return new Promise((resolve) => {
    src.toBlob((blob) => resolve(blob), 'image/png');
  });
}

/** Format human-friendly Spanish label for any 360° yaw angle */
export function getYawAngleLabel(yawDeg: number): string {
  const y = normalizeYawDeg(yawDeg);
  if (y <= 15 || y >= 345) return 'Frente';
  if (y >= 75 && y <= 105) return 'Perfil izq.';
  if (y >= 165 && y <= 195) return 'Espalda';
  if (y >= 255 && y <= 285) return 'Perfil der.';
  if (y > 15 && y < 75) return '¾ Frente';
  if (y > 105 && y < 165) return '¾ Espalda';
  if (y > 195 && y < 255) return '¾ Espalda';
  return '¾ Frente';
}
