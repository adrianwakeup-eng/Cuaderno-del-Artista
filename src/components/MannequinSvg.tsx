import React, { useEffect, useMemo, useRef, useState } from 'react';
import mannequinFrontImg from '../assets/images/mannequin_front.png';
import mannequinBackImg from '../assets/images/mannequin_back.png';
import {
  getYawAngleLabel,
  normalizeYawDeg,
  renderMannequinToCanvas,
  renderMannequinToDataUrl,
  type MannequinGender,
} from '../utils/mannequin3DWoodRenderer';

interface MannequinSvgProps {
  view?: 'front' | 'back';
  gender?: MannequinGender;
  yawDeg?: number;
  color?: string; // undefined or 'natural' = natural carved wood + aged bronze joints
  miniature?: boolean;
  className?: string;
}

export const MannequinSvg: React.FC<MannequinSvgProps> = ({
  view = 'front',
  gender = 'male',
  yawDeg,
  color,
  miniature = false,
  className = '',
}) => {
  const effectiveYaw = normalizeYawDeg(yawDeg ?? (view === 'back' ? 180 : 0));
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [webglFailed, setWebglFailed] = useState(false);

  const miniatureDataUrl = useMemo(() => {
    if (!miniature) return null;
    return renderMannequinToDataUrl({
      gender,
      yawDeg: effectiveYaw,
      color,
      width: 168,
      height: 384,
    });
  }, [miniature, gender, effectiveYaw, color]);

  useEffect(() => {
    if (miniature) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ok = renderMannequinToCanvas(canvas, {
      gender,
      yawDeg: effectiveYaw,
      color,
      width: 490,
      height: 1120,
    });
    if (!ok) {
      setWebglFailed(true);
    }
  }, [miniature, gender, effectiveYaw, color]);

  const ariaLabel = `Maniquí ${gender === 'female' ? 'Mujer' : 'Hombre'} 360° (${getYawAngleLabel(effectiveYaw)} · ${effectiveYaw}°)`;

  if (miniature) {
    if (miniatureDataUrl) {
      return (
        <img
          src={miniatureDataUrl}
          alt={ariaLabel}
          draggable={false}
          className={`block w-full h-auto select-none pointer-events-none ${className}`}
        />
      );
    }
    return (
      <img
        src={view === 'back' ? mannequinBackImg : mannequinFrontImg}
        alt={ariaLabel}
        draggable={false}
        className={`block w-full h-auto select-none pointer-events-none ${className}`}
      />
    );
  }

  if (webglFailed) {
    return (
      <img
        src={view === 'back' ? mannequinBackImg : mannequinFrontImg}
        alt={ariaLabel}
        draggable={false}
        className={`block w-full h-auto select-none pointer-events-none ${className}`}
      />
    );
  }

  return (
    <canvas
      ref={canvasRef}
      width={490}
      height={1120}
      aria-label={ariaLabel}
      className={`block w-full h-auto select-none pointer-events-none ${className}`}
      style={{ aspectRatio: '7 / 16' }}
    />
  );
};
