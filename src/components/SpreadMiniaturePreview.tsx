import React, { memo, useEffect, useRef, useState } from 'react';
import type {
  CopiedPatternData,
  NotebookSpread,
  PageElement,
  PaperStyle,
} from '../types/crochet';
import { getFontMeta } from '../data/calligraphyFonts';
import { getMuseumFrameById } from '../data/museumFrames';
import { CrochetStickerSvg } from './CrochetDecorations';
import { DiagramGridSvg, StitchSymbolSvg } from './StitchSymbolSvg';
import { CrochetMandalaSvg } from './CrochetMandalaSvg';
import { MannequinSvg } from './MannequinSvg';
import { WARDROBE_SEASONS } from '../utils/wardrobeSeasons';

const VIRTUAL_PAGE_W = 500;
const VIRTUAL_SPREAD_W = VIRTUAL_PAGE_W * 2; // 1000
const VIRTUAL_SPREAD_H = 600;

const PAPER_CLASS: Record<PaperStyle, string> = {
  grid: 'cutting-mat-grid',
  dots: 'cutting-mat-dots',
  plain: '',
};

interface ScaledMiniBookFrameProps {
  children: React.ReactNode;
}

/**
 * Renders a crisp virtual 1008x600 open-book spread scaled proportionally
 * to fit any thumbnail card width, complete with leather frame, spine crease,
 * and miniature brass binder rings.
 */
const ScaledMiniBookFrame: React.FC<ScaledMiniBookFrameProps> = ({ children }) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.28);

  useEffect(() => {
    const node = hostRef.current;
    if (!node) return;
    const measure = () => {
      const w = node.clientWidth;
      if (w > 0) {
        setScale(w / VIRTUAL_SPREAD_W);
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(node);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="w-full rounded-lg p-[4px] bg-gradient-to-br from-[#5d3519] via-[#341b0c] to-[#1e0e06] border border-[#b98241]/45 shadow-[0_6px_14px_rgba(0,0,0,0.45)]">
      <div
        ref={hostRef}
        className="relative w-full overflow-hidden rounded-[5px] bg-[#2a1509] select-none pointer-events-none"
        style={{ aspectRatio: `${VIRTUAL_SPREAD_W} / ${VIRTUAL_SPREAD_H}` }}
      >
        <div
          style={{
            width: VIRTUAL_SPREAD_W,
            height: VIRTUAL_SPREAD_H,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
          className="relative flex overflow-hidden"
        >
          {children}
        </div>
      </div>
    </div>
  );
};

const MiniUnifiedRulerEdges: React.FC = () => (
  <>
    <div
      aria-hidden="true"
      className="absolute top-4 bottom-4 left-0 w-[18px] border-r border-[#a7d6ba]/35 bg-[#15382b]/65 flex flex-col justify-between py-2 opacity-80 pointer-events-none"
    >
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className={`h-px bg-[#bfe5ce]/65 ml-0 mr-auto ${i % 2 === 0 ? 'w-[10px]' : 'w-[6px]'}`}
        />
      ))}
    </div>
    <div
      aria-hidden="true"
      className="absolute top-4 bottom-4 right-0 w-[18px] border-l border-[#a7d6ba]/35 bg-[#15382b]/65 flex flex-col justify-between py-2 opacity-80 pointer-events-none"
    >
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className={`h-px bg-[#bfe5ce]/65 ml-auto mr-0 ${i % 2 === 0 ? 'w-[10px]' : 'w-[6px]'}`}
        />
      ))}
    </div>
    <div
      aria-hidden="true"
      className="absolute top-0 left-[18px] right-[18px] h-4 border-b border-[#a7d6ba]/35 bg-[#15382b]/65 flex items-end justify-between px-2 opacity-80 pointer-events-none"
    >
      {Array.from({ length: 20 }).map((_, i) => (
        <div key={i} className={`w-px bg-[#bfe5ce]/65 ${i % 2 === 0 ? 'h-[8px]' : 'h-[5px]'}`} />
      ))}
    </div>
    <div
      aria-hidden="true"
      className="absolute bottom-0 left-[18px] right-[18px] h-4 border-t border-[#a7d6ba]/35 bg-[#15382b]/65 flex items-start justify-between px-2 opacity-80 pointer-events-none"
    >
      {Array.from({ length: 20 }).map((_, i) => (
        <div key={i} className={`w-px bg-[#bfe5ce]/65 ${i % 2 === 0 ? 'h-[8px]' : 'h-[5px]'}`} />
      ))}
    </div>
  </>
);

const MiniElementView: React.FC<{ el: PageElement; unifiedSheet?: boolean }> = ({
  el,
  unifiedSheet = false,
}) => {
  const rotation = el.rotation ?? 0;
  const opacity = el.opacity ?? 1;
  const flipTransform = `${el.flipX ? ' scaleX(-1)' : ''}${el.flipY ? ' scaleY(-1)' : ''}`;

  if (el.type === 'wardrobe') {
    return (
      <div
        style={{
          position: 'absolute',
          left: unifiedSheet ? '3.5%' : '4%',
          top: '4.5%',
          width: unifiedSheet ? '93%' : '92%',
          height: '91%',
          opacity,
        }}
        className="rounded-lg border-[3px] border-[#d69f42] bg-[#2a1506] p-2 flex flex-col gap-1.5 shadow-[0_10px_20px_rgba(8,20,14,0.55)]"
      >
        <div className="h-6 rounded-t bg-gradient-to-b from-[#f7d887] via-[#c78d30] to-[#7c4c10] flex items-center justify-center">
          <span className="font-display text-[11px] font-bold tracking-[0.2em] text-[#2b1404]">
            ARMARIO DE LAS CUATRO ESTACIONES
          </span>
        </div>
        <div className="flex-1 grid grid-cols-4 gap-2 min-h-0">
          {WARDROBE_SEASONS.map((s) => (
            <div
              key={s.id}
              className="rounded border-2 border-[#e3b55a] bg-[#1e0f05] p-1 flex flex-col overflow-hidden"
            >
              <div className="flex-1 rounded-t-[45%] overflow-hidden">
                <img
                  src={s.doorImage}
                  alt={s.label}
                  loading="lazy"
                  className="w-full h-full object-cover object-top"
                />
              </div>
              <div className="text-center text-[9px] font-display font-bold text-[#ffebc2] pt-0.5 truncate">
                {s.roman} · {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const filterCss = el.filters
    ? `brightness(${el.filters.brightness}%) contrast(${el.filters.contrast}%) saturate(${el.filters.saturate}%) sepia(${el.filters.sepia}%) blur(${el.filters.blur}px)`
    : undefined;

  const leftPct = unifiedSheet
    ? el.side === 'right'
      ? 50 + el.x * 0.5
      : el.x * 0.5
    : el.x;

  return (
    <div
      style={{
        position: 'absolute',
        left: `${leftPct}%`,
        top: `${el.y}%`,
        width: `${el.width}px`,
        opacity,
        transform: `rotate(${rotation}deg)${flipTransform}`,
        transformOrigin: 'center center',
      }}
    >
      {el.type === 'mannequin' && (
        <MannequinSvg
          view={el.content === 'back' ? 'back' : 'front'}
          gender={el.mannequinGender ?? (el.id.includes('back') ? 'female' : 'male')}
          yawDeg={el.mannequinYawDeg}
          color={el.color || 'natural'}
          miniature
          className="w-full h-auto"
        />
      )}

      {el.type === 'image' && (() => {
        const mf = getMuseumFrameById(el.museumFrameId);
        if (mf) {
          return (
            <div
              className="relative w-full"
              style={{ aspectRatio: `${mf.naturalWidth} / ${mf.naturalHeight}` }}
            >
              <div
                className={`absolute overflow-hidden ${mf.isOval ? 'rounded-[50%]' : ''}`}
                style={{
                  top: `${mf.insets.top}%`,
                  right: `${mf.insets.right}%`,
                  bottom: `${mf.insets.bottom}%`,
                  left: `${mf.insets.left}%`,
                }}
              >
                <img
                  src={el.content}
                  alt={el.title || 'Imagen'}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  style={{ filter: filterCss }}
                  className="w-full h-full object-cover block"
                />
              </div>
              <img
                src={mf.imagePath}
                alt={mf.name}
                loading="lazy"
                className="relative z-10 w-full h-full object-fill block"
              />
            </div>
          );
        }
        return (
          <div
            className={
              el.frameStyle === 'polaroid'
                ? 'bg-[#fbf4e4] p-2 pb-5 shadow-md border border-[#b98c53]/40'
                : el.frameStyle === 'gold'
                  ? 'p-1.5 bg-gradient-to-br from-[#e2b462] via-[#b88035] to-[#7c4d19] rounded shadow-md'
                  : el.frameStyle === 'rounded'
                    ? 'rounded-2xl overflow-hidden shadow-md'
                    : ''
            }
          >
            <img
              src={el.content}
              alt={el.title || 'Imagen'}
              loading="lazy"
              referrerPolicy="no-referrer"
              style={{ filter: filterCss }}
              className="w-full h-auto object-contain block"
            />
          </div>
        );
      })()}

      {el.type === 'text' && (
        <div
          style={{
            color:
              (!el.backgroundColor || el.backgroundColor === 'transparent') &&
              (!el.color || el.color.toLowerCase() === '#4e2712')
                ? '#F7EED8'
                : el.color || '#F7EED8',
            fontSize: `${el.fontSize || 20}px`,
            fontWeight: el.fontWeight || 'normal',
            fontStyle: el.fontStyle || 'normal',
            textDecoration: el.textDecoration || 'none',
            textAlign: el.textAlign || 'left',
            fontFamily: getFontMeta(el.fontFamily || 'lora').cssFamily,
            backgroundColor: el.backgroundColor || 'transparent',
            lineHeight: 1.32,
          }}
          className="whitespace-pre-wrap break-words rounded px-1.5 py-1"
        >
          {el.content}
        </div>
      )}

      {el.type === 'sticker' && (
        <CrochetStickerSvg id={el.content} className="w-full h-auto" />
      )}

      {el.type === 'shape' && (
        <svg viewBox="0 0 120 120" className="w-full h-auto">
          {el.shapeKind === 'circle' || el.shapeKind === 'crochet-ring' ? (
            <circle
              cx="60"
              cy="60"
              r="46"
              fill={el.fillColor || 'none'}
              stroke={el.color || '#6b2229'}
              strokeWidth="4"
              strokeDasharray={el.shapeKind === 'crochet-ring' ? '7 5' : undefined}
            />
          ) : el.shapeKind === 'square' ? (
            <rect
              x="14"
              y="14"
              width="92"
              height="92"
              rx="6"
              fill={el.fillColor || 'none'}
              stroke={el.color || '#6b2229'}
              strokeWidth="4"
            />
          ) : el.shapeKind === 'heart' ? (
            <path
              d="M60 100 C25 74 12 52 20 34 C27 18 47 18 60 34 C73 18 93 18 100 34 C108 52 95 74 60 100 Z"
              fill={el.fillColor || 'none'}
              stroke={el.color || '#6b2229'}
              strokeWidth="4"
            />
          ) : el.shapeKind === 'arrow' ? (
            <path
              d="M14 60 H98 M76 38 L98 60 L76 82"
              fill="none"
              stroke={el.color || '#6b2229'}
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : (
            <line
              x1="12"
              y1="60"
              x2="108"
              y2="60"
              stroke={el.color || '#6b2229'}
              strokeWidth="5"
              strokeLinecap="round"
            />
          )}
        </svg>
      )}

      {el.type === 'pattern-note' && el.patternData && (
        <div className="rounded-lg bg-[#fbf2df]/95 border border-[#b2844c]/65 p-2 shadow-sm flex flex-col items-center">
          <div className="w-full h-[92px] flex items-center justify-center">
            {el.patternData.imagePath ? (
              <img
                src={el.patternData.imagePath}
                alt={el.patternData.name}
                loading="lazy"
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain"
              />
            ) : el.patternData.mandalaId ? (
              <CrochetMandalaSvg mandalaId={el.patternData.mandalaId} className="w-20 h-20" />
            ) : el.patternData.diagramGrid ? (
              <DiagramGridSvg grid={el.patternData.diagramGrid} className="w-[86px] h-[86px]" />
            ) : (
              <StitchSymbolSvg
                stitchKey={el.patternData.stitchKey}
                color={el.color || '#4a2511'}
                className="w-16 h-16"
              />
            )}
          </div>
          <div className="text-[12px] font-editorial font-semibold text-[#4a2612] truncate w-full text-center mt-1">
            {el.patternData.name}
          </div>
        </div>
      )}
    </div>
  );
};

export const EditableSpreadMiniature = memo<{ spread: NotebookSpread }>(({ spread }) => {
  const paperClass = PAPER_CLASS[spread.paperStyle] || 'cutting-mat-grid';
  const hasLegacySplitDrawing = Boolean(spread.rightDrawingDataUrl);

  return (
    <ScaledMiniBookFrame>
      {/* Single Continuous Unified Sheet Miniature */}
      <div
        style={{ width: VIRTUAL_SPREAD_W, height: VIRTUAL_SPREAD_H }}
        className={`relative cutting-mat-page ${paperClass} overflow-hidden shrink-0`}
      >
        <MiniUnifiedRulerEdges />
        {hasLegacySplitDrawing ? (
          <>
            {spread.leftDrawingDataUrl && (
              <img
                src={spread.leftDrawingDataUrl}
                alt=""
                className="absolute inset-y-0 left-0 w-1/2 h-full object-fill pointer-events-none"
              />
            )}
            {spread.rightDrawingDataUrl && (
              <img
                src={spread.rightDrawingDataUrl}
                alt=""
                className="absolute inset-y-0 right-0 w-1/2 h-full object-fill pointer-events-none"
              />
            )}
          </>
        ) : (
          spread.leftDrawingDataUrl && (
            <img
              src={spread.leftDrawingDataUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-fill pointer-events-none"
            />
          )
        )}
        {spread.elements.map((el) => (
          <MiniElementView key={el.id} el={el} unifiedSheet />
        ))}
      </div>
    </ScaledMiniBookFrame>
  );
});

EditableSpreadMiniature.displayName = 'EditableSpreadMiniature';

const CatalogMiniSide: React.FC<{
  side: 'left' | 'right';
  items: CopiedPatternData[];
}> = ({ side, items }) => (
  <div
    style={{ width: VIRTUAL_PAGE_W, height: VIRTUAL_SPREAD_H }}
    className="relative cutting-mat-page cutting-mat-grid overflow-hidden shrink-0 flex flex-col px-7 py-5"
  >
    <div className="border-b border-[#b2dfc4]/35 pb-2 mb-3 flex items-center justify-between">
      <span className="font-editorial italic text-[17px] font-semibold text-[#f7eed8]">
        {side === 'left' ? 'Índice de Patrones Crochet' : 'Alfabeto y Diagramas'}
      </span>
      <span className="text-[11px] font-mono-tab text-[#d4eadc]">{items.length} patrones</span>
    </div>
    <div className="grid grid-cols-2 gap-3 flex-1">
      {items.map((item) => (
        <div
          key={item.id}
          className="rounded-lg bg-[#fbf2df]/85 border border-[#b4864f]/50 p-2.5 flex flex-col items-center justify-between shadow-sm"
        >
          <div className="flex-1 w-full flex items-center justify-center">
            {item.diagramGrid ? (
              <DiagramGridSvg grid={item.diagramGrid} className="w-[115px] h-[115px]" />
            ) : (
              <StitchSymbolSvg
                stitchKey={item.stitchKey}
                color="#4d2612"
                className="w-24 h-24"
              />
            )}
          </div>
          <div className="w-full text-center mt-1.5 border-t border-[#c49a66]/35 pt-1">
            <div className="text-[13px] font-editorial font-bold text-[#492210] truncate">
              {item.name}
            </div>
            <div className="text-[10px] text-[#7c5431] truncate">{item.abbreviation}</div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const CatalogSpreadMiniature = memo<{
  leftItems: CopiedPatternData[];
  rightItems: CopiedPatternData[];
}>(({ leftItems, rightItems }) => (
  <ScaledMiniBookFrame>
    <CatalogMiniSide side="left" items={leftItems} />
    <CatalogMiniSide side="right" items={rightItems} />
  </ScaledMiniBookFrame>
));

CatalogSpreadMiniature.displayName = 'CatalogSpreadMiniature';

const MandalaMiniSide: React.FC<{
  side: 'left' | 'right';
  items: CopiedPatternData[];
  mattedMap?: Record<string, string>;
}> = ({ side, items, mattedMap }) => (
  <div
    style={{ width: VIRTUAL_PAGE_W, height: VIRTUAL_SPREAD_H }}
    className="relative cutting-mat-page cutting-mat-grid overflow-hidden shrink-0 flex flex-col px-6 py-4"
  >
    <div className="border-b border-[#b2dfc4]/35 pb-1.5 mb-2.5 flex items-center justify-between">
      <span className="font-editorial italic text-[16px] font-semibold text-[#f7eed8]">
        {side === 'left' ? 'Galería de Mandalas' : 'Colección Crochet'}
      </span>
      <span className="text-[11px] font-mono-tab text-[#d4eadc]">{items.length} diseños</span>
    </div>
    <div className="grid grid-cols-2 grid-rows-3 gap-2.5 flex-1">
      {items.map((item) => {
        const imgSrc = mattedMap?.[item.id] || item.imagePath;
        return (
          <div
            key={item.id}
            className="rounded-lg bg-[#fcf6e8]/90 border border-[#b4864f]/45 p-1.5 flex flex-col items-center justify-center overflow-hidden shadow-sm"
          >
            <div className="flex-1 w-full min-h-0 flex items-center justify-center">
              {imgSrc ? (
                <img
                  src={imgSrc}
                  alt={item.name}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <CrochetMandalaSvg
                  mandalaId={item.mandalaId || item.id}
                  className="w-24 h-24"
                />
              )}
            </div>
            <div className="text-[10px] font-editorial font-semibold text-[#4c2612] truncate w-full text-center mt-0.5">
              {item.name}
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

export const MandalaSpreadMiniature = memo<{
  leftItems: CopiedPatternData[];
  rightItems: CopiedPatternData[];
  mattedMap?: Record<string, string>;
}>(({ leftItems, rightItems, mattedMap }) => (
  <ScaledMiniBookFrame>
    <MandalaMiniSide side="left" items={leftItems} mattedMap={mattedMap} />
    <MandalaMiniSide side="right" items={rightItems} mattedMap={mattedMap} />
  </ScaledMiniBookFrame>
));

MandalaSpreadMiniature.displayName = 'MandalaSpreadMiniature';
