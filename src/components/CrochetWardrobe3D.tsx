import React, { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { audioEngine } from '../utils/audioEngine';

export const WARDROBE_SPRITE_SRC = '/assets/aistudio/image_ec75fa8f.png';

// Exact geometry measured from image_ec75fa8f.png (1488 x 1004, pure transparent RGBA)
// Closed wardrobe tight bounds: x = 0..685 (686 x 1004)
// Transparent gap: x = 686..714 (split = 700)
// Open wardrobe bounds: x = 715..1487 (773 x 1004)
const STAGE_W = 686;
const STAGE_H = 1004;
const SPLIT_X = 700;

// Exact closed door cavity on closed wardrobe (width = 467px, height = 684px)
const LEFT_HINGE_X = 116;
const CENTER_SEAM_X = 346;
const RIGHT_HINGE_X = 583;
const DOOR_TOP_Y = 152;
const DOOR_BOTTOM_Y = 836;
const DOOR_H = DOOR_BOTTOM_Y - DOOR_TOP_Y; // 684px
const CAVITY_W = RIGHT_HINGE_X - LEFT_HINGE_X; // 467px
const LEFT_DOOR_W = CENTER_SEAM_X - LEFT_HINGE_X; // 230px
const RIGHT_DOOR_W = RIGHT_HINGE_X - CENTER_SEAM_X; // 237px

// Exact matching open wardrobe interior cavity (865..1332 = 467px wide, 152..836 = 684px tall!)
const OPEN_CAVITY_X = 865;
const OPEN_CAVITY_Y = 152;

// Exact painted inner-door panels from the open wardrobe (used for realistic 3D door back-faces)
const OPEN_LEFT_INNER_DOOR = { x: 736, y: 136, w: 112, h: 720 };
const OPEN_RIGHT_INNER_DOOR = { x: 1354, y: 136, w: 112, h: 720 };

// Normalized percentages on the exact 686x1004 cabinet stage
const CAVITY_PCT = {
  left: `${(LEFT_HINGE_X / STAGE_W) * 100}%`,
  top: `${(DOOR_TOP_Y / STAGE_H) * 100}%`,
  width: `${(CAVITY_W / STAGE_W) * 100}%`,
  height: `${(DOOR_H / STAGE_H) * 100}%`,
};

const LEFT_DOOR_PCT = {
  left: `${(LEFT_HINGE_X / STAGE_W) * 100}%`,
  top: `${(DOOR_TOP_Y / STAGE_H) * 100}%`,
  width: `${(LEFT_DOOR_W / STAGE_W) * 100}%`,
  height: `${(DOOR_H / STAGE_H) * 100}%`,
};

const RIGHT_DOOR_PCT = {
  left: `${(CENTER_SEAM_X / STAGE_W) * 100}%`,
  top: `${(DOOR_TOP_Y / STAGE_H) * 100}%`,
  width: `${(RIGHT_DOOR_W / STAGE_W) * 100}%`,
  height: `${(DOOR_H / STAGE_H) * 100}%`,
};

export interface WardrobeSprites {
  cabinetWithInterior: string;
  leftDoorFront: string;
  rightDoorFront: string;
  leftDoorBack: string;
  rightDoorBack: string;
  openFull: string;
}

let cachedSpritesPromise: Promise<WardrobeSprites> | null = null;

export function loadWardrobeSprites(): Promise<WardrobeSprites> {
  if (cachedSpritesPromise) return cachedSpritesPromise;

  cachedSpritesPromise = new Promise<WardrobeSprites>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        // 1. Unified stationary cabinet body (closed outer gilded frame + real open crochet interior inside the 467x684 cavity)
        // This guarantees zero jumping, zero double doors, and pixel-identical columns/crown/feet at every angle from 0° to 130°!
        const cabCanvas = document.createElement('canvas');
        cabCanvas.width = STAGE_W;
        cabCanvas.height = STAGE_H;
        const cabCtx = cabCanvas.getContext('2d');
        if (!cabCtx) throw new Error('2D context unavailable');

        // Draw pristine closed cabinet frame (686x1004)
        cabCtx.drawImage(img, 0, 0, STAGE_W, STAGE_H, 0, 0, STAGE_W, STAGE_H);

        // Composite the real open interior cleanly inside the exact 467x684 door cavity
        cabCtx.save();
        cabCtx.beginPath();
        cabCtx.rect(LEFT_HINGE_X, DOOR_TOP_Y, CAVITY_W, DOOR_H);
        cabCtx.clip();
        cabCtx.drawImage(
          img,
          OPEN_CAVITY_X,
          OPEN_CAVITY_Y,
          CAVITY_W,
          DOOR_H,
          LEFT_HINGE_X,
          DOOR_TOP_Y,
          CAVITY_W,
          DOOR_H
        );
        // Subtle recessed inner wooden frame shadow around the interior perimeter for genuine 3D depth
        const topGrad = cabCtx.createLinearGradient(0, DOOR_TOP_Y, 0, DOOR_TOP_Y + 26);
        topGrad.addColorStop(0, 'rgba(28, 12, 2, 0.55)');
        topGrad.addColorStop(1, 'rgba(28, 12, 2, 0)');
        cabCtx.fillStyle = topGrad;
        cabCtx.fillRect(LEFT_HINGE_X, DOOR_TOP_Y, CAVITY_W, 26);

        const leftGrad = cabCtx.createLinearGradient(LEFT_HINGE_X, 0, LEFT_HINGE_X + 18, 0);
        leftGrad.addColorStop(0, 'rgba(28, 12, 2, 0.45)');
        leftGrad.addColorStop(1, 'rgba(28, 12, 2, 0)');
        cabCtx.fillStyle = leftGrad;
        cabCtx.fillRect(LEFT_HINGE_X, DOOR_TOP_Y, 18, DOOR_H);

        const rightGrad = cabCtx.createLinearGradient(RIGHT_HINGE_X - 18, 0, RIGHT_HINGE_X, 0);
        rightGrad.addColorStop(0, 'rgba(28, 12, 2, 0)');
        rightGrad.addColorStop(1, 'rgba(28, 12, 2, 0.45)');
        cabCtx.fillStyle = rightGrad;
        cabCtx.fillRect(RIGHT_HINGE_X - 18, DOOR_TOP_Y, 18, DOOR_H);
        cabCtx.restore();

        const cabinetWithInterior = cabCanvas.toDataURL('image/png');

        // 2. Left painted front door (230 x 684)
        const lFrontCanvas = document.createElement('canvas');
        lFrontCanvas.width = LEFT_DOOR_W;
        lFrontCanvas.height = DOOR_H;
        const lfCtx = lFrontCanvas.getContext('2d');
        if (!lfCtx) throw new Error('2D context unavailable');
        lfCtx.drawImage(
          img,
          LEFT_HINGE_X,
          DOOR_TOP_Y,
          LEFT_DOOR_W,
          DOOR_H,
          0,
          0,
          LEFT_DOOR_W,
          DOOR_H
        );
        const leftDoorFront = lFrontCanvas.toDataURL('image/png');

        // 3. Right painted front door (237 x 684)
        const rFrontCanvas = document.createElement('canvas');
        rFrontCanvas.width = RIGHT_DOOR_W;
        rFrontCanvas.height = DOOR_H;
        const rfCtx = rFrontCanvas.getContext('2d');
        if (!rfCtx) throw new Error('2D context unavailable');
        rfCtx.drawImage(
          img,
          CENTER_SEAM_X,
          DOOR_TOP_Y,
          RIGHT_DOOR_W,
          DOOR_H,
          0,
          0,
          RIGHT_DOOR_W,
          DOOR_H
        );
        const rightDoorFront = rFrontCanvas.toDataURL('image/png');

        // 4. Left door back-face (real gilded floral & cherub inner panel from open wardrobe)
        const lBackCanvas = document.createElement('canvas');
        lBackCanvas.width = LEFT_DOOR_W;
        lBackCanvas.height = DOOR_H;
        const lbCtx = lBackCanvas.getContext('2d');
        if (!lbCtx) throw new Error('2D context unavailable');
        lbCtx.drawImage(
          img,
          OPEN_LEFT_INNER_DOOR.x,
          OPEN_LEFT_INNER_DOOR.y,
          OPEN_LEFT_INNER_DOOR.w,
          OPEN_LEFT_INNER_DOOR.h,
          0,
          0,
          LEFT_DOOR_W,
          DOOR_H
        );
        // Crisp antique gilded inner border trim
        lbCtx.strokeStyle = 'rgba(132, 78, 16, 0.72)';
        lbCtx.lineWidth = 4;
        lbCtx.strokeRect(2, 2, LEFT_DOOR_W - 4, DOOR_H - 4);
        const leftDoorBack = lBackCanvas.toDataURL('image/png');

        // 5. Right door back-face (real gilded floral & cherub inner panel from open wardrobe)
        const rBackCanvas = document.createElement('canvas');
        rBackCanvas.width = RIGHT_DOOR_W;
        rBackCanvas.height = DOOR_H;
        const rbCtx = rBackCanvas.getContext('2d');
        if (!rbCtx) throw new Error('2D context unavailable');
        rbCtx.drawImage(
          img,
          OPEN_RIGHT_INNER_DOOR.x,
          OPEN_RIGHT_INNER_DOOR.y,
          OPEN_RIGHT_INNER_DOOR.w,
          OPEN_RIGHT_INNER_DOOR.h,
          0,
          0,
          RIGHT_DOOR_W,
          DOOR_H
        );
        rbCtx.strokeStyle = 'rgba(132, 78, 16, 0.72)';
        rbCtx.lineWidth = 4;
        rbCtx.strokeRect(2, 2, RIGHT_DOOR_W - 4, DOOR_H - 4);
        const rightDoorBack = rBackCanvas.toDataURL('image/png');

        // 6. Full open wardrobe standalone sprite (for GoldenDressingRoomView mirror)
        const openSrcW = img.naturalWidth - SPLIT_X;
        const openCanvas = document.createElement('canvas');
        openCanvas.width = openSrcW;
        openCanvas.height = STAGE_H;
        const oCtx = openCanvas.getContext('2d');
        if (!oCtx) throw new Error('2D context unavailable');
        oCtx.drawImage(img, SPLIT_X, 0, openSrcW, STAGE_H, 0, 0, openSrcW, STAGE_H);
        const openFull = openCanvas.toDataURL('image/png');

        resolve({
          cabinetWithInterior,
          leftDoorFront,
          rightDoorFront,
          leftDoorBack,
          rightDoorBack,
          openFull,
        });
      } catch (err) {
        cachedSpritesPromise = null;
        reject(err);
      }
    };
    img.onerror = () => {
      cachedSpritesPromise = null;
      reject(new Error('No se pudo cargar la imagen del armario'));
    };
    img.src = WARDROBE_SPRITE_SRC;
  });

  return cachedSpritesPromise;
}

const GOLDEN_MOTES = [
  { left: '28%', top: '30%', size: 4.5, delay: 0 },
  { left: '54%', top: '25%', size: 4, delay: 0.35 },
  { left: '46%', top: '52%', size: 5.5, delay: 0.7 },
  { left: '66%', top: '60%', size: 4, delay: 1.0 },
  { left: '36%', top: '68%', size: 4.5, delay: 0.2 },
];

export interface CrochetWardrobe3DProps {
  onEnterDressingRoom?: () => void;
  disabled?: boolean;
  className?: string;
}

export const CrochetWardrobe3D: React.FC<CrochetWardrobe3DProps> = ({
  onEnterDressingRoom,
  disabled = false,
  className = '',
}) => {
  const prefersReducedMotion = useReducedMotion();
  const [sprites, setSprites] = useState<WardrobeSprites | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [hoverAjarBoost, setHoverAjarBoost] = useState(0); // subtle 0..8 deg boost near handles
  const [phase, setPhase] = useState<'closed' | 'opening' | 'entering'>('closed');
  const outerRef = useRef<HTMLDivElement>(null);
  const [boxSize, setBoxSize] = useState<{ w: number; h: number } | null>(null);
  const openTimerRef = useRef<number | null>(null);
  const navTimerRef = useRef<number | null>(null);

  useEffect(() => {
    let active = true;
    void loadWardrobeSprites()
      .then((res) => {
        if (active) setSprites(res);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  // Measure the available page slot so the 686:1004 cabinet ALWAYS fits tightly with zero stray margins
  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    const updateSize = () => {
      const availW = el.clientWidth;
      const availH = el.clientHeight;
      if (availW <= 0 || availH <= 0) return;
      const ratio = STAGE_W / STAGE_H;
      let w = availW;
      let h = w / ratio;
      if (h > availH) {
        h = availH;
        w = h * ratio;
      }
      setBoxSize({ w: Math.round(w), h: Math.round(h) });
    };
    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    return () => {
      if (openTimerRef.current !== null) window.clearTimeout(openTimerRef.current);
      if (navTimerRef.current !== null) window.clearTimeout(navTimerRef.current);
    };
  }, []);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled || phase !== 'closed') return;
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width <= 0) return;
    const relX = (e.clientX - rect.left) / rect.width;
    const distFromCenter = Math.min(1, Math.abs(relX - 0.5) * 2);
    setHoverAjarBoost((1 - distFromCenter) * 8);
  };

  const handlePointerEnter = () => {
    if (disabled) return;
    setIsHovered(true);
  };

  const handlePointerLeave = () => {
    setIsHovered(false);
    setHoverAjarBoost(0);
  };

  const handleOpenAndEnter = () => {
    if (disabled || phase !== 'closed') return;
    audioEngine.playWardrobeDoor(true);
    setPhase('opening');

    if (openTimerRef.current !== null) window.clearTimeout(openTimerRef.current);
    if (navTimerRef.current !== null) window.clearTimeout(navTimerRef.current);

    if (prefersReducedMotion) {
      openTimerRef.current = window.setTimeout(() => {
        setPhase('closed');
        onEnterDressingRoom?.();
      }, 240);
      return;
    }

    // Smooth, unhurried wooden door swing open (0 -> 880ms), then gentle golden veil into El Vestidor Dorado (880 -> 1240ms)
    openTimerRef.current = window.setTimeout(() => {
      setPhase('entering');
    }, 880);

    navTimerRef.current = window.setTimeout(() => {
      onEnterDressingRoom?.();
      setPhase('closed');
      setIsHovered(false);
      setHoverAjarBoost(0);
    }, 1240);
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) return;
    e.stopPropagation();
    handleOpenAndEnter();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      handleOpenAndEnter();
    }
  };

  const isOpeningOrEntering = phase === 'opening' || phase === 'entering';

  // Physically continuous 3D wooden door angles (zero swaps, zero snaps):
  // - Idle closed: 0° (flush with gilded outer columns)
  // - Hovering cursor: smoothly swings outward toward viewer to ~26°–34°
  // - Leaving cursor: smoothly glides all the way back to 0°
  // - Clicking: smoothly swings wide open past 90° to ±132°, revealing the real painted inner doors
  const hoverAngle = 26 + hoverAjarBoost;
  const leftDoorAngle = prefersReducedMotion
    ? 0
    : isOpeningOrEntering
      ? -132
      : isHovered
        ? -hoverAngle
        : 0;
  const rightDoorAngle = prefersReducedMotion
    ? 0
    : isOpeningOrEntering
      ? 132
      : isHovered
        ? hoverAngle
        : 0;

  // Natural weighted wooden-door transition:
  // Opening/hovering eases smoothly with gentle deceleration; closing settles softly without bouncing awkwardly
  const doorTransition = isOpeningOrEntering
    ? { duration: 0.92, ease: [0.22, 1, 0.36, 1] as const }
    : isHovered
      ? { type: 'spring' as const, stiffness: 110, damping: 18, mass: 0.9 }
      : { type: 'spring' as const, stiffness: 95, damping: 20, mass: 1.05 };

  return (
    <div
      ref={outerRef}
      className={`relative flex items-center justify-center w-full h-full select-none ${className}`}
    >
      {/* Tightly Fitted 686:1004 Fixed Baroque Wardrobe Stage */}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="Armario dorado de crochet. Pasa el cursor para entreabrir las puertas y haz clic para entrar al vestidor dorado"
        onPointerEnter={handlePointerEnter}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        style={{
          width: boxSize ? `${boxSize.w}px` : '100%',
          height: boxSize ? `${boxSize.h}px` : '100%',
          perspective: '1350px',
          perspectiveOrigin: '50% 48%',
        }}
        className={`relative outline-none focus-visible:ring-2 focus-visible:ring-[#c98b34] rounded-xl ${
          disabled ? 'pointer-events-none' : 'cursor-pointer'
        }`}
      >
        {/* Stationary 3D Cabinet Stage (never moves or tilts — ONLY the hinged doors swing naturally in 3D) */}
        <div
          style={{ transformStyle: 'preserve-3d' }}
          className="relative w-full h-full drop-shadow-[0_10px_14px_rgba(52,25,6,0.26)]"
        >
          {sprites ? (
            <>
              {/* LAYER 1: Stationary Gilded Cabinet Body + Real Open Crochet Interior inside the 467x684 cavity */}
              <img
                src={sprites.cabinetWithInterior}
                alt="Armario barroco dorado de crochet"
                referrerPolicy="no-referrer"
                draggable={false}
                style={{ transform: 'translateZ(0px)' }}
                className="pointer-events-none absolute inset-0 w-full h-full object-fill"
              />

              {/* Natural Interior Depth Shadow (dark when closed -> softly lit when ajar -> bright when fully open) */}
              <motion.div
                aria-hidden="true"
                style={{ ...CAVITY_PCT, transform: 'translateZ(1px)' }}
                animate={{
                  opacity: isOpeningOrEntering ? 0 : isHovered ? 0.24 : 0.72,
                }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="pointer-events-none absolute bg-[#1c0c03]"
              />

              {/* Warm Golden Interior Glow illuminating the hanging crochet garments as doors open */}
              <motion.div
                aria-hidden="true"
                style={{ ...CAVITY_PCT, transform: 'translateZ(2px)' }}
                animate={{
                  opacity:
                    phase === 'entering'
                      ? 0.92
                      : phase === 'opening'
                        ? 0.52
                        : isHovered
                          ? 0.3
                          : 0,
                }}
                transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
                className="pointer-events-none absolute bg-[radial-gradient(ellipse_at_50%_46%,rgba(255,236,174,0.82)_0%,rgba(235,178,72,0.28)_52%,transparent_84%)] mix-blend-screen"
              />

              {/* Subtle Golden Dust Motes drifting out while open/ajar */}
              {(isHovered || isOpeningOrEntering) && !prefersReducedMotion && (
                <div
                  aria-hidden="true"
                  style={{ ...CAVITY_PCT, transform: 'translateZ(4px)' }}
                  className="pointer-events-none absolute overflow-hidden"
                >
                  {GOLDEN_MOTES.map((mote, i) => (
                    <motion.span
                      key={i}
                      initial={{ opacity: 0, y: 8, scale: 0.65 }}
                      animate={{
                        opacity: [0, 0.85, 0.3, 0.8, 0],
                        y: [6, -12, -24],
                        x: [0, i % 2 === 0 ? 4 : -4, 0],
                        scale: [0.7, 1.15, 0.85],
                      }}
                      transition={{
                        duration: 2.8,
                        delay: mote.delay * 0.4,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                      style={{
                        left: mote.left,
                        top: mote.top,
                        width: mote.size,
                        height: mote.size,
                      }}
                      className="absolute rounded-full bg-[#fff5cf] shadow-[0_0_8px_rgba(255,222,125,0.95)]"
                    />
                  ))}
                </div>
              )}

              {/* LAYER 2: Real Double-Sided 3D Hinged Doors (Continuous 0° <-> 30° <-> 132° swing) */}
              <div
                style={{
                  transformStyle: 'preserve-3d',
                  transform: 'translateZ(3px)',
                }}
                className="pointer-events-none absolute inset-0"
              >
                {/* LEFT DOUBLE-SIDED 3D DOOR (hinged along left fluted column) */}
                <motion.div
                  style={{
                    ...LEFT_DOOR_PCT,
                    transformOrigin: '0% 50%',
                    transformStyle: 'preserve-3d',
                  }}
                  animate={{ rotateY: leftDoorAngle }}
                  transition={doorTransition}
                  className="absolute will-change-transform"
                >
                  {/* Front Painted Face (Visible 0°..90°) */}
                  <div
                    style={{
                      backfaceVisibility: 'hidden',
                      WebkitBackfaceVisibility: 'hidden',
                    }}
                    className="absolute inset-0"
                  >
                    <img
                      src={sprites.leftDoorFront}
                      alt=""
                      aria-hidden="true"
                      referrerPolicy="no-referrer"
                      draggable={false}
                      className="w-full h-full object-fill"
                    />
                    {/* Natural directional shading as door turns outward */}
                    <motion.div
                      aria-hidden="true"
                      animate={{
                        opacity: isOpeningOrEntering ? 0.26 : isHovered ? 0.14 : 0,
                      }}
                      transition={{ duration: 0.35 }}
                      className="absolute inset-0 bg-gradient-to-r from-black/35 via-transparent to-[#ffe8a8]/25"
                    />
                    {/* Gilded wooden door thickness along inner meeting edge */}
                    <div
                      aria-hidden="true"
                      className="absolute inset-y-0 right-0 w-[3px] bg-gradient-to-b from-[#fae09b] via-[#c78628] to-[#73420d]"
                    />
                  </div>

                  {/* Back Painted Inner Face (Revealed seamlessly past 90° -> 132°) */}
                  <div
                    style={{
                      transform: 'rotateY(180deg)',
                      backfaceVisibility: 'hidden',
                      WebkitBackfaceVisibility: 'hidden',
                    }}
                    className="absolute inset-0 drop-shadow-[-6px_8px_14px_rgba(32,14,4,0.42)]"
                  >
                    <img
                      src={sprites.leftDoorBack}
                      alt=""
                      aria-hidden="true"
                      referrerPolicy="no-referrer"
                      draggable={false}
                      className="w-full h-full object-fill"
                    />
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 bg-gradient-to-l from-black/22 via-transparent to-[#fff0bc]/16"
                    />
                  </div>
                </motion.div>

                {/* RIGHT DOUBLE-SIDED 3D DOOR (hinged along right fluted column) */}
                <motion.div
                  style={{
                    ...RIGHT_DOOR_PCT,
                    transformOrigin: '100% 50%',
                    transformStyle: 'preserve-3d',
                  }}
                  animate={{ rotateY: rightDoorAngle }}
                  transition={doorTransition}
                  className="absolute will-change-transform"
                >
                  {/* Front Painted Face (Visible 0°..90°) */}
                  <div
                    style={{
                      backfaceVisibility: 'hidden',
                      WebkitBackfaceVisibility: 'hidden',
                    }}
                    className="absolute inset-0"
                  >
                    <img
                      src={sprites.rightDoorFront}
                      alt=""
                      aria-hidden="true"
                      referrerPolicy="no-referrer"
                      draggable={false}
                      className="w-full h-full object-fill"
                    />
                    {/* Natural directional shading as door turns outward */}
                    <motion.div
                      aria-hidden="true"
                      animate={{
                        opacity: isOpeningOrEntering ? 0.26 : isHovered ? 0.14 : 0,
                      }}
                      transition={{ duration: 0.35 }}
                      className="absolute inset-0 bg-gradient-to-l from-black/35 via-transparent to-[#ffe8a8]/25"
                    />
                    {/* Gilded wooden door thickness along inner meeting edge */}
                    <div
                      aria-hidden="true"
                      className="absolute inset-y-0 left-0 w-[3px] bg-gradient-to-b from-[#fae09b] via-[#c78628] to-[#73420d]"
                    />
                  </div>

                  {/* Back Painted Inner Face (Revealed seamlessly past 90° -> 132°) */}
                  <div
                    style={{
                      transform: 'rotateY(180deg)',
                      backfaceVisibility: 'hidden',
                      WebkitBackfaceVisibility: 'hidden',
                    }}
                    className="absolute inset-0 drop-shadow-[6px_8px_14px_rgba(32,14,4,0.42)]"
                  >
                    <img
                      src={sprites.rightDoorBack}
                      alt=""
                      aria-hidden="true"
                      referrerPolicy="no-referrer"
                      draggable={false}
                      className="w-full h-full object-fill"
                    />
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 bg-gradient-to-r from-black/22 via-transparent to-[#fff0bc]/16"
                    />
                  </div>
                </motion.div>
              </div>

              {/* Soft Golden Portal Bloom right as we step into El Vestidor Dorado */}
              {phase === 'entering' && (
                <motion.div
                  aria-hidden="true"
                  initial={{ opacity: 0, scale: 0.78 }}
                  animate={{ opacity: 0.94, scale: 1.15 }}
                  transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                  style={{ transform: 'translateZ(12px)' }}
                  className="pointer-events-none absolute inset-[6%] rounded-full bg-[radial-gradient(circle,rgba(255,248,218,0.96)_0%,rgba(235,190,94,0.68)_48%,rgba(196,138,44,0)_80%)] blur-[6px]"
                />
              )}
            </>
          ) : (
            /* Zero-flash cropped fallback while canvas sprites prepare */
            <div className="relative w-full h-full overflow-hidden">
              <img
                src={WARDROBE_SPRITE_SRC}
                alt="Armario dorado de crochet"
                referrerPolicy="no-referrer"
                draggable={false}
                style={{
                  width: '216.9%',
                  maxWidth: 'none',
                  height: '100%',
                  objectFit: 'fill',
                }}
              />
            </div>
          )}
        </div>

        {/* Subtle High-Contrast Editorial Caption on Hover */}
        <motion.span
          aria-hidden="true"
          animate={{
            opacity: isHovered && phase === 'closed' ? 0.92 : 0,
            y: isHovered && phase === 'closed' ? 0 : 4,
          }}
          transition={{ duration: 0.2 }}
          className="pointer-events-none absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap font-editorial italic text-[13px] tracking-wide text-[#4e2a10]"
        >
          Clic para abrir y entrar al vestidor dorado
        </motion.span>
      </div>
    </div>
  );
};
