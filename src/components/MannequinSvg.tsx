import React, { useId } from 'react';
import mannequinFrontImg from '../assets/images/mannequin_front.png';
import mannequinBackImg from '../assets/images/mannequin_back.png';

interface MannequinSvgProps {
  view: 'front' | 'back';
  color?: string; // undefined or 'natural' = photorealistic carved wood + aged brass
  className?: string;
}

export const MannequinSvg: React.FC<MannequinSvgProps> = ({
  view,
  color,
  className = '',
}) => {
  const uid = useId().replace(/:/g, '');
  const isTinted = Boolean(color && color !== 'natural');
  const tintFilterId = `mannequin-tint-${uid}`;
  const src = view === 'back' ? mannequinBackImg : mannequinFrontImg;

  return (
    <svg
      viewBox="0 0 397 986"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label={view === 'front' ? 'Maniquí de frente' : 'Maniquí de espalda'}
    >
      {isTinted && color && (
        <defs>
          <filter id={tintFilterId} colorInterpolationFilters="sRGB">
            <feColorMatrix
              type="matrix"
              values="0.299 0.587 0.114 0 0  0.299 0.587 0.114 0 0  0.299 0.587 0.114 0 0  0 0 0 1 0"
              result="gray"
            />
            <feFlood floodColor={color} floodOpacity="0.82" result="tint" />
            <feBlend in="gray" in2="tint" mode="hard-light" result="tinted" />
            <feComposite in="tinted" in2="SourceAlpha" operator="in" />
          </filter>
        </defs>
      )}

      <image
        href={src}
        x="0"
        y="0"
        width="397"
        height="986"
        preserveAspectRatio="xMidYMid meet"
        filter={isTinted ? `url(#${tintFilterId})` : undefined}
      />
    </svg>
  );
};
