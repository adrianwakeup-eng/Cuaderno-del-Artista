import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export interface FairySharedMotionState {
  initialized: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  roll: number;
  pitch: number;
  yaw: number;
  scale: number;
  facing: number;
  wingPhase: number;
  pluckImpulse: number;
  pluckPitch: number;
  musicSwayCurrent: number;
  musicNodCurrent: number;
  stringGlowOpacity: number;
  wingFlapAngle: number;
  bodyBobY: number;
}

interface Fairy3DCanvasProps {
  modelBuffer: ArrayBuffer;
  isFlying: boolean;
  motionRef: React.MutableRefObject<FairySharedMotionState>;
  onLoaded?: () => void;
  onError?: (message: string) => void;
}

interface DetectedWingNode {
  object: THREE.Object3D;
  side: -1 | 1;
  baseRotY: number;
  baseRotZ: number;
}

function detectSoftwareWebGL(renderer: THREE.WebGLRenderer): boolean {
  try {
    const gl = renderer.getContext();
    const dbg = gl.getExtension('WEBGL_debug_renderer_info');
    if (!dbg) return false;
    const rendererStr = String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) || '');
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(rendererStr);
  } catch {
    return false;
  }
}

function disposeObject3D(root: THREE.Object3D): void {
  root.traverse((node) => {
    const mesh = node as THREE.Mesh;
    if (mesh.isMesh) {
      if (mesh.geometry) {
        mesh.geometry.dispose();
      }
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const mat of materials) {
        if (!mat) continue;
        const stdMat = mat as THREE.MeshStandardMaterial;
        const texKeys: Array<keyof THREE.MeshStandardMaterial> = [
          'map',
          'normalMap',
          'roughnessMap',
          'metalnessMap',
          'emissiveMap',
          'aoMap',
          'alphaMap',
          'bumpMap',
          'envMap',
        ];
        for (const key of texKeys) {
          const tex = stdMat[key];
          if (tex instanceof THREE.Texture) {
            tex.dispose();
          }
        }
        mat.dispose();
      }
    }
  });
}

export const Fairy3DCanvas: React.FC<Fairy3DCanvasProps> = ({
  modelBuffer,
  isFlying,
  motionRef,
  onLoaded,
  onError,
}) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const isFlyingRef = useRef(isFlying);
  const onLoadedRef = useRef(onLoaded);
  const onErrorRef = useRef(onError);

  isFlyingRef.current = isFlying;
  onLoadedRef.current = onLoaded;
  onErrorRef.current = onError;

  useEffect(() => {
    const container = hostRef.current;
    if (!container) return;

    let disposed = false;
    let rafId = 0;
    let softTimeoutId = 0;

    const scene = new THREE.Scene();
    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight);

    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 100);
    camera.position.set(0, 0, 12);
    camera.lookAt(0, 0, 0);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch {
      onErrorRef.current?.('No se pudo iniciar WebGL para mostrar el modelo 3D.');
      return;
    }

    const isSoftwareGl = detectSoftwareWebGL(renderer);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height, false);
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;

    const domEl = renderer.domElement;
    domEl.style.width = '100%';
    domEl.style.height = '100%';
    domEl.style.display = 'block';
    domEl.style.pointerEvents = 'none';
    container.appendChild(domEl);

    // Environment lighting (PBR reflections for metallic harp & woodland armor)
    const pmrem = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envTarget = pmrem.fromScene(roomEnv, 0.04);
    scene.environment = envTarget.texture;
    roomEnv.dispose();
    pmrem.dispose();

    // Warm workshop key light + woodland hemisphere fill + emerald rim + dynamic golden harp light
    const hemiLight = new THREE.HemisphereLight(0xd9f7e0, 0x4b2f19, 0.95);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff1d2, 2.05);
    keyLight.position.set(5, 7, 8);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x88ffb3, 0.9);
    rimLight.position.set(-6, 4, -5);
    scene.add(rimLight);

    const harpPointLight = new THREE.PointLight(0xffd76a, 0.65, 6.5, 1.6);
    harpPointLight.position.set(0.8, 0.2, 1.5);
    scene.add(harpPointLight);

    // Hierarchy: fairyAnchor (world flight position) -> fairyTiltGroup (3D flight & musical sway) -> model
    const fairyAnchor = new THREE.Group();
    const fairyTiltGroup = new THREE.Group();
    fairyAnchor.add(fairyTiltGroup);
    scene.add(fairyAnchor);

    // Subtle magical ground/air shadow halo behind the fairy so he anchors visually over the desk
    let mixer: THREE.AnimationMixer | null = null;
    let activeAction: THREE.AnimationAction | null = null;
    let loadedRoot: THREE.Object3D | null = null;
    const detectedWings: DetectedWingNode[] = [];
    let hasEmbeddedAnimations = false;

    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
    const gltfLoader = new GLTFLoader();
    gltfLoader.setDRACOLoader(dracoLoader);

    const parseBuffer = modelBuffer.slice(0);
    gltfLoader.parse(
      parseBuffer,
      '',
      (gltf) => {
        if (disposed) {
          disposeObject3D(gltf.scene);
          return;
        }
        const model = gltf.scene;

        // Normalize model bounds so any exported GLB scale centers cleanly
        const box = new THREE.Box3().setFromObject(model);
        const size = new THREE.Vector3();
        const center = new THREE.Vector3();
        box.getSize(size);
        box.getCenter(center);

        const maxHeight = Math.max(size.y, size.x * 0.85, size.z * 0.85, 0.001);
        const targetWorldHeight = 2.65;
        const normScale = targetWorldHeight / maxHeight;

        model.scale.setScalar(normScale);
        model.position.set(-center.x * normScale, -center.y * normScale, -center.z * normScale);

        // Enhance PBR materials & locate any separable wing nodes
        const tempPos = new THREE.Vector3();
        model.traverse((child) => {
          const mesh = child as THREE.Mesh;
          if (mesh.isMesh && mesh.material) {
            const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            for (const m of mats) {
              const std = m as THREE.MeshStandardMaterial;
              if ('envMapIntensity' in std) {
                std.envMapIntensity = 0.85;
              }
              if (std.transparent || /wing|ala/i.test(child.name)) {
                std.side = THREE.DoubleSide;
              }
            }
          }

          if (/wing|ala/i.test(child.name) && child !== model) {
            child.getWorldPosition(tempPos);
            const isLeft = /left|_l\b|\.l\b|izq/i.test(child.name) || tempPos.x < 0;
            detectedWings.push({
              object: child,
              side: isLeft ? -1 : 1,
              baseRotY: child.rotation.y,
              baseRotZ: child.rotation.z,
            });
          }
        });

        fairyTiltGroup.add(model);
        loadedRoot = model;

        if (gltf.animations && gltf.animations.length > 0) {
          hasEmbeddedAnimations = true;
          mixer = new THREE.AnimationMixer(model);
          const preferredClip =
            gltf.animations.find((c) => /fly|flight|hover|idle|harp|float/i.test(c.name)) ||
            gltf.animations[0];
          activeAction = mixer.clipAction(preferredClip);
          activeAction.play();
        }

        onLoadedRef.current?.();
      },
      () => {
        if (!disposed) {
          onErrorRef.current?.(
            'El archivo no se pudo leer como modelo 3D (.glb/.gltf). Descárgalo en formato GLB desde 3D AI Studio.'
          );
        }
      }
    );

    // Pre-allocated state variables outside the render loop (zero per-frame GC)
    let viewW = width;
    let viewH = height;
    let visibleHeightAtZ0 = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) * 0.5) * camera.position.z;
    let visibleWidthAtZ0 = visibleHeightAtZ0 * camera.aspect;

    const updateViewportMetrics = () => {
      viewW = Math.max(1, container.clientWidth);
      viewH = Math.max(1, container.clientHeight);
      camera.aspect = viewW / viewH;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(viewW, viewH, false);
      visibleHeightAtZ0 =
        2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) * 0.5) * camera.position.z;
      visibleWidthAtZ0 = visibleHeightAtZ0 * camera.aspect;
    };

    const ro = new ResizeObserver(updateViewportMetrics);
    ro.observe(container);

    // Smooth internal 3D rotation state
    let curRotX = 0;
    let curRotY = -0.35;
    let curRotZ = 0;
    let lastTs = performance.now();

    const gl2 = renderer.getContext() as WebGL2RenderingContext;
    const afterDraw = (next: () => void) => {
      if (disposed) return;
      if (isSoftwareGl && typeof gl2.fenceSync === 'function') {
        const fence = gl2.fenceSync(gl2.SYNC_GPU_COMMANDS_COMPLETE, 0);
        gl2.flush();
        const waitFence = () => {
          if (disposed) {
            if (fence) gl2.deleteSync(fence);
            return;
          }
          if (!fence || gl2.getSyncParameter(fence, gl2.SYNC_STATUS) === gl2.SIGNALED) {
            if (fence) gl2.deleteSync(fence);
            softTimeoutId = window.setTimeout(next, 80);
          } else {
            rafId = window.requestAnimationFrame(waitFence);
          }
        };
        rafId = window.requestAnimationFrame(waitFence);
      } else {
        rafId = window.requestAnimationFrame(next);
      }
    };

    const renderFrame = () => {
      if (disposed) return;

      const now = performance.now();
      const dt = Math.min(0.05, Math.max(0.001, (now - lastTs) / 1000));
      lastTs = now;
      const tSec = now * 0.001;

      const m = motionRef.current;
      const flying = isFlyingRef.current;

      // Map shared 2D stage pixel coordinates to the exact PerspectiveCamera world plane at z=0
      const nx = viewW > 0 ? m.x / viewW : 0.88;
      const ny = viewH > 0 ? m.y / viewH : 0.8;
      const worldX = (nx - 0.5) * visibleWidthAtZ0;
      const worldY = (0.5 - ny) * visibleHeightAtZ0 - (m.bodyBobY / Math.max(1, viewH)) * visibleHeightAtZ0;
      const worldZ = flying ? Math.sin(tSec * 0.55 + 0.4) * 0.85 : 0.25;

      fairyAnchor.position.set(worldX, worldY, worldZ);

      // Keep visual scale proportional to viewport so the 3D fairy never overwhelms small screens
      const responsiveScale = THREE.MathUtils.clamp(visibleHeightAtZ0 / 7.8, 0.78, 1.15);
      const breathScale = 1 + Math.sin(tSec * 2.1) * 0.012 + m.pluckImpulse * 0.015;
      fairyAnchor.scale.set(
        responsiveScale * m.scale,
        responsiveScale * m.scale * breathScale,
        responsiveScale * m.scale
      );

      // Expressive 3D flight banking, turning, and Celtic-harp musical gestures
      let targetRotY: number;
      let targetRotX: number;
      let targetRotZ: number;

      if (flying) {
        const turnYaw = THREE.MathUtils.clamp(m.vx * 0.0042, -0.58, 0.58);
        const facingBias = m.facing > 0 ? 0.14 : -0.14;
        const gentleTour = Math.sin(tSec * 0.65) * 0.24 + m.musicSwayCurrent * 0.025;
        targetRotY = facingBias + turnYaw + gentleTour;
        targetRotX =
          THREE.MathUtils.clamp(-m.vy * 0.0018 + 0.06, -0.22, 0.24) +
          m.musicNodCurrent * 0.022;
        targetRotZ =
          THREE.MathUtils.clamp(-m.vx * 0.0021, -0.24, 0.24) -
          m.musicSwayCurrent * 0.018;
      } else {
        // Calmly leaning toward the leather notebook in the bottom-right corner
        const breath = Math.sin(tSec * 1.5);
        targetRotY = -0.44 + Math.sin(tSec * 0.6) * 0.1;
        targetRotX = 0.04 + breath * 0.025;
        targetRotZ = 0.1 + breath * 0.02;
      }

      const rotLerp = 1 - Math.exp(-dt * 4.5);
      curRotX += (targetRotX - curRotX) * rotLerp;
      curRotY += (targetRotY - curRotY) * rotLerp;
      curRotZ += (targetRotZ - curRotZ) * rotLerp;

      fairyTiltGroup.rotation.set(curRotX, curRotY, curRotZ);

      // Animate embedded GLTF clips if present
      if (mixer) {
        if (activeAction) {
          activeAction.timeScale = flying ? 1.05 : 0.45;
        }
        mixer.update(dt);
      }

      // Procedural wing flap for separable wing meshes if the GLB has no embedded clip
      if (!hasEmbeddedAnimations && detectedWings.length > 0) {
        const flapRad = THREE.MathUtils.degToRad((m.wingFlapAngle - 42) * 0.85);
        for (const w of detectedWings) {
          w.object.rotation.y = w.baseRotY + w.side * flapRad;
          w.object.rotation.z = w.baseRotZ + w.side * flapRad * 0.16;
        }
      }

      // Dynamic golden harp glow synchronized with live Celtic harp plucks
      harpPointLight.position.set(
        worldX + m.facing * 0.75,
        worldY + 0.15,
        worldZ + 1.35
      );
      harpPointLight.intensity = flying
        ? 0.85 + m.stringGlowOpacity * 2.1
        : 0.45 + Math.sin(tSec * 1.6) * 0.12;

      renderer.render(scene, camera);
      afterDraw(renderFrame);
    };

    renderFrame();

    return () => {
      disposed = true;
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(softTimeoutId);
      ro.disconnect();
      if (mixer) {
        mixer.stopAllAction();
      }
      if (loadedRoot) {
        disposeObject3D(loadedRoot);
        fairyTiltGroup.remove(loadedRoot);
      }
      dracoLoader.dispose();
      envTarget.dispose();
      renderer.dispose();
      if (domEl.parentNode === container) {
        container.removeChild(domEl);
      }
    };
  }, [modelBuffer, motionRef]);

  return (
    <div
      ref={hostRef}
      className="pointer-events-none absolute inset-0 z-10 w-full h-full"
    />
  );
};
