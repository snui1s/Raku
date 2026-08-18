export interface ThemeOption {
  id: string;
  name: string;
  category: "Pastel" | "Minimal" | "Classic";
  accent: string;
}

export const THEMES: ThemeOption[] = [
  { id: "mono", name: "Mono Minimal", category: "Minimal", accent: "#737373" },
  { id: "classic", name: "Raku Coral", category: "Classic", accent: "#F25C54" },
  { id: "matcha", name: "Matcha Zen", category: "Pastel", accent: "#7F9F7E" },
  { id: "sakura", name: "Sakura Bloom", category: "Pastel", accent: "#E89CAE" },
  { id: "ocean", name: "Ocean Mist", category: "Pastel", accent: "#64A6BD" },
  { id: "lavender", name: "Lavender Dream", category: "Pastel", accent: "#A594F9" },
  { id: "sunset", name: "Sunset Gold", category: "Pastel", accent: "#F4A261" },
  { id: "nordic", name: "Nordic Slate", category: "Minimal", accent: "#78909C" },
];
