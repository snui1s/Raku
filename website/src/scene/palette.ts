export type Theme = "light" | "dark";

export interface Palette {
  sky: number;
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
  night: boolean; // stars are shown at night (dark theme)
  moon: number;
  moonGlow: number;
  water: [number, number]; // river base, river highlight
  fox: [number, number, number]; // fur, cream, dark socks and ears
}

/** Same colors as the home page tokens and the SVG prototype. */
export const PALETTE: Record<Theme, Palette> = {
  light: {
    sky: 0xfaf9f7,
    hill: 0xe3ddd2,
    hillFar: 0xece8e1,
    accent: 0xf25c54,
    ink: 0x262626,
    bark: 0x6b4636,
    barkDark: 0x4a2f25,
    blossom: [0xe98fab, 0xf2aac0, 0xf8c9d8, 0xfde6ed],
    leaf: 0x9fbf8a,
    grass: [0x5f9a5d, 0x7fae7a, 0x98c98e],
    petal: 0xf4b6c6,
    night: false,
    moon: 0xe6ebf1,
    moonGlow: 0xdfe6ee,
    water: [0xb9dcf0, 0xeaf6fd],
    fox: [0xf08a3c, 0xfaf1e4, 0x3b2a24],
  },
  dark: {
    sky: 0x171717,
    hill: 0x262626,
    hillFar: 0x1f1f1f,
    accent: 0xf25c54,
    ink: 0x262626,
    bark: 0x4a3228,
    barkDark: 0x32211b,
    blossom: [0xa85f79, 0xbd7b92, 0xd09aac, 0xe2b8c5],
    leaf: 0x5f7d57,
    grass: [0x3d6340, 0x4d7a4b, 0x5f9a5d],
    petal: 0xd99bb0,
    night: true,
    moon: 0xfff2cf,
    moonGlow: 0xffe9a8,
    water: [0x2c4a68, 0x5f8db3],
    fox: [0xd9772f, 0xe8dcc8, 0x2b1f1a],
  },
};
