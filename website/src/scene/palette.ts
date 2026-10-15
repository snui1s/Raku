export interface Palette {
  sky: number; // fog and fallback background: about the color of the horizon
  skyHorizon: number;
  skyZenith: number;
  hill: number;
  hillFar: number;
  accent: number;
  ink: number;
  bark: number;
  barkDark: number;
  blossom: number[]; // deep -> light
  leaf: number;
  grass: number[]; // dark -> light
  petal: number;
  moon: number;
  moonGlow: number;
  cloud: number;
  cloudAlpha: number;
  water: [number, number]; // river base, river highlight
  fox: [number, number, number]; // fur, cream, dark socks and ears
}

/** The night scene: the same colors as the home page tokens and the SVG prototype. */
export const PALETTE: Palette = {
  sky: 0x1f4a8f,
  skyHorizon: 0x2c63b4,
  skyZenith: 0x08153a,
  hill: 0x14234a,
  hillFar: 0x1d3466,
  accent: 0xf25c54,
  ink: 0x262626,
  bark: 0x4a3228,
  barkDark: 0x32211b,
  blossom: [0xa85f79, 0xbd7b92, 0xd09aac, 0xe2b8c5],
  leaf: 0x5f7d57,
  grass: [0x3d6340, 0x4d7a4b, 0x5f9a5d],
  petal: 0xd99bb0,
  moon: 0xfff2cf,
  moonGlow: 0xffe9a8,
  cloud: 0x6b8ccc,
  cloudAlpha: 0.75,
  water: [0x35577a, 0x86b1d4],
  fox: [0xd9772f, 0xe8dcc8, 0x2b1f1a],
};
