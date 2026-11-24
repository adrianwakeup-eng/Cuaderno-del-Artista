import type { DressingRoomGarment, WardrobeSeasonId } from '../types/crochet';

export interface WardrobeHeroAnimMeta {
  bgImage: string;
  handImage: string;
  /** Normalized ROI [x0, y0, x1, y1] of the waving hand sprite on the 1152x2064 canvas */
  handRoi: [number, number, number, number];
  /** Normalized wrist rotation pivot [wx, wy] on the 1152x2064 canvas */
  wristPivot: [number, number];
  /** Natural wave arc polarity (+1 or -1) */
  waveDir: 1 | -1;
  /** Distinct phase offset (seconds) so all 4 men breathe & wave organically */
  phaseOffsetSec: number;
  /** Seasonal ambient particle color */
  particleHex: string;
}

export interface WardrobeSeasonMeta {
  id: WardrobeSeasonId;
  doorNumber: 1 | 2 | 3 | 4;
  roman: 'I' | 'II' | 'III' | 'IV';
  label: string;
  greekName: string;
  subtitle: string;
  fibersNote: string;
  doorImage: string;
  heroAnim: WardrobeHeroAnimMeta;
  accentHex: string;
  borderHex: string;
  glowRgba: string;
  interiorGradient: string;
  pillBg: string;
}

export const WARDROBE_SEASONS: WardrobeSeasonMeta[] = [
  {
    id: 'primavera',
    doorNumber: 1,
    roman: 'I',
    label: 'Primavera',
    greekName: 'Eiar · Primavera',
    subtitle: 'Tejidos ligeros, flores de almendro, calados frescos y tonos botánicos',
    fibersNote: 'Algodón peinado · Lino suave · Puntos calados florales',
    doorImage: '/vestidor/greek-wardrobe/door-primavera.jpg?v=hd5',
    heroAnim: {
      bgImage: '/vestidor/greek-wardrobe/door-primavera-bg.jpg?v=hd5',
      handImage: '/vestidor/greek-wardrobe/door-primavera-hand.webp?v=hd5',
      handRoi: [109 / 1152, 526 / 2064, 351 / 1152, 877 / 2064],
      wristPivot: [0.172, 0.405],
      waveDir: -1,
      phaseOffsetSec: 0.0,
      particleHex: '#fff0f5',
    },
    accentHex: '#9fd4a4',
    borderHex: '#7eb886',
    glowRgba: 'rgba(159, 212, 164, 0.34)',
    interiorGradient:
      'radial-gradient(ellipse at 50% 42%, rgba(212, 240, 200, 0.42) 0%, rgba(56, 86, 52, 0.88) 55%, rgba(24, 38, 22, 0.98) 100%)',
    pillBg: 'linear-gradient(180deg, #4f7a53 0%, #2d4e31 100%)',
  },
  {
    id: 'verano',
    doorNumber: 2,
    roman: 'II',
    label: 'Verano',
    greekName: 'Theros · Verano',
    subtitle: 'Prendas frescas mediterráneas, red crochet aireada y luz dorada del Egeo',
    fibersNote: 'Algodón mercerizado · Bambú fresco · Calados de verano',
    doorImage: '/vestidor/greek-wardrobe/door-verano.jpg?v=hd5',
    heroAnim: {
      bgImage: '/vestidor/greek-wardrobe/door-verano-bg.jpg?v=hd5',
      handImage: '/vestidor/greek-wardrobe/door-verano-hand.webp?v=hd5',
      handRoi: [824 / 1152, 578 / 2064, 1031 / 1152, 888 / 2064],
      wristPivot: [0.835, 0.415],
      waveDir: 1,
      phaseOffsetSec: 1.8,
      particleHex: '#ffe699',
    },
    accentHex: '#f7cf73',
    borderHex: '#e3b14b',
    glowRgba: 'rgba(247, 207, 115, 0.4)',
    interiorGradient:
      'radial-gradient(ellipse at 50% 38%, rgba(255, 226, 148, 0.48) 0%, rgba(126, 86, 28, 0.88) 55%, rgba(44, 26, 10, 0.98) 100%)',
    pillBg: 'linear-gradient(180deg, #c78b31 0%, #865414 100%)',
  },
  {
    id: 'otono',
    doorNumber: 3,
    roman: 'III',
    label: 'Otoño',
    greekName: 'Phthinoporon · Otoño',
    subtitle: 'Cárdigans trenzados, textura en relieve, cosecha dorada y tonos terracota',
    fibersNote: 'Lana merino media · Alpaca fina · Trenzas y espiga',
    doorImage: '/vestidor/greek-wardrobe/door-otono.jpg?v=hd5',
    heroAnim: {
      bgImage: '/vestidor/greek-wardrobe/door-otono-bg.jpg?v=hd5',
      handImage: '/vestidor/greek-wardrobe/door-otono-hand.webp?v=hd5',
      handRoi: [86 / 1152, 196 / 2064, 340 / 1152, 588 / 2064],
      wristPivot: [0.158, 0.268],
      waveDir: -1,
      phaseOffsetSec: 3.5,
      particleHex: '#f4a261',
    },
    accentHex: '#e28f62',
    borderHex: '#c86c3f',
    glowRgba: 'rgba(226, 143, 98, 0.38)',
    interiorGradient:
      'radial-gradient(ellipse at 50% 42%, rgba(245, 172, 116, 0.44) 0%, rgba(114, 48, 26, 0.9) 55%, rgba(42, 16, 10, 0.98) 100%)',
    pillBg: 'linear-gradient(180deg, #a64d2b 0%, #6b2b16 100%)',
  },
  {
    id: 'invierno',
    doorNumber: 4,
    roman: 'IV',
    label: 'Invierno',
    greekName: 'Cheimon · Invierno',
    subtitle: 'Abrigos estructurados, puntos gruesos nobles, zafiro nocturno y plata',
    fibersNote: 'Lana virgen gruesa · Mohair · Trenzas nórdicas y abrigos',
    doorImage: '/vestidor/greek-wardrobe/door-invierno.jpg?v=hd5',
    heroAnim: {
      bgImage: '/vestidor/greek-wardrobe/door-invierno-bg.jpg?v=hd5',
      handImage: '/vestidor/greek-wardrobe/door-invierno-hand.webp?v=hd5',
      handRoi: [812 / 1152, 268 / 2064, 1025 / 1152, 568 / 2064],
      wristPivot: [0.840, 0.258],
      waveDir: 1,
      phaseOffsetSec: 5.1,
      particleHex: '#e2f1ff',
    },
    accentHex: '#9dc2e6',
    borderHex: '#6c98c4',
    glowRgba: 'rgba(157, 194, 230, 0.36)',
    interiorGradient:
      'radial-gradient(ellipse at 50% 40%, rgba(176, 208, 240, 0.42) 0%, rgba(30, 56, 94, 0.92) 55%, rgba(12, 22, 40, 0.98) 100%)',
    pillBg: 'linear-gradient(180deg, #355885 0%, #1d3556 100%)',
  },
];

export const WARDROBE_SEASON_BY_ID: Record<WardrobeSeasonId, WardrobeSeasonMeta> =
  Object.fromEntries(WARDROBE_SEASONS.map((s) => [s.id, s])) as Record<
    WardrobeSeasonId,
    WardrobeSeasonMeta
  >;

function hashId(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Classifies every runway or custom garment into its seasonal design section
 * (explicit `garment.season` always takes precedence).
 */
export function resolveGarmentSeason(garment: DressingRoomGarment): WardrobeSeasonId {
  if (garment.season) return garment.season;

  const text = `${garment.name} ${garment.category} ${garment.fiber || ''} ${garment.stitchNote || ''} ${(garment.tags || []).join(' ')}`.toLowerCase();

  // Explicit seasonal keywords
  if (text.includes('primavera') || text.includes('flor') || text.includes('girasol') || text.includes('botánic')) {
    return 'primavera';
  }
  if (text.includes('verano') || text.includes('playa') || text.includes('resort') || text.includes('short') || text.includes('bermuda')) {
    return 'verano';
  }
  if (text.includes('otoño') || text.includes('otono') || text.includes('terracota') || text.includes('canela') || text.includes('ocre')) {
    return 'otono';
  }
  if (text.includes('invierno') || text.includes('abrigo') || text.includes('enguatada') || text.includes('bufanda') || text.includes('nórdic') || text.includes('grues')) {
    return 'invierno';
  }

  // Category & silhouette natural seasonal fit (balanced across all 4 seasons)
  const cat = garment.category;
  const h = hashId(garment.id);

  if (cat === 'Shorts' || cat === 'Bermudas') return 'verano';
  if (cat === 'Enguatadas' || cat === 'Chaquetas' || cat === 'Accesorios') {
    return h % 4 === 0 ? 'otono' : 'invierno';
  }
  if (cat === 'Camisas') {
    return h % 2 === 0 ? 'primavera' : 'verano';
  }
  if (cat === 'Chalecos') {
    return h % 2 === 0 ? 'primavera' : 'otono';
  }
  if (cat === 'Cárdigans' || cat === 'Cardigans') {
    return h % 3 === 0 ? 'primavera' : 'otono';
  }
  if (cat === 'Pulóveres' || cat === 'Suéteres') {
    return h % 2 === 0 ? 'invierno' : 'otono';
  }
  if (cat === 'Pantalones') {
    const pick: WardrobeSeasonId[] = ['primavera', 'otono', 'invierno', 'verano'];
    return pick[h % pick.length];
  }

  const fallback: WardrobeSeasonId[] = ['primavera', 'verano', 'otono', 'invierno'];
  return fallback[h % 4];
}
