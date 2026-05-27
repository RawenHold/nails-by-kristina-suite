import { useCallback, useEffect, useState } from "react";

/**
 * Palette system — lets the user re-skin the entire app from Settings.
 * Each palette overrides the same CSS custom properties that the rest of
 * the design system already reads (primary, accent, mesh, scene-accent…)
 * so every component re-themes for free without prop drilling.
 *
 * Values are split per light/dark so contrast stays right in both themes.
 */

export type PaletteId = "rose" | "red" | "slate" | "blue" | "pink" | "green" | "amber";

type Tokens = {
  primary: string;
  primaryGlow: string;
  accent: string;
  roseLight: string;
  sceneAccent: string;
  mesh1: string;
  mesh2: string;
  mesh3: string;
  mesh4: string;
};

type PaletteDef = {
  id: PaletteId;
  label: string;
  /** swatch color shown on the slider (CSS color string) */
  swatch: string;
  light: Tokens;
  dark: Tokens;
};

export const PALETTES: PaletteDef[] = [
  {
    id: "rose",
    label: "Роза",
    swatch: "#d4536a",
    light: {
      primary: "350 65% 55%", primaryGlow: "350 80% 70%", accent: "38 75% 55%",
      roseLight: "350 80% 95%", sceneAccent: "45 100% 72%",
      mesh1: "350 80% 88%", mesh2: "30 70% 92%", mesh3: "38 75% 88%", mesh4: "320 60% 92%",
    },
    dark: {
      primary: "350 78% 68%", primaryGlow: "350 90% 78%", accent: "38 85% 62%",
      roseLight: "350 30% 22%", sceneAccent: "45 70% 50%",
      mesh1: "350 30% 16%", mesh2: "30 25% 13%", mesh3: "38 30% 14%", mesh4: "320 25% 14%",
    },
  },
  {
    id: "red",
    label: "Красный",
    swatch: "#ec1616",
    light: {
      primary: "0 82% 51%", primaryGlow: "0 90% 68%", accent: "12 85% 55%",
      roseLight: "0 80% 95%", sceneAccent: "12 95% 68%",
      mesh1: "0 80% 90%", mesh2: "12 70% 92%", mesh3: "350 75% 90%", mesh4: "20 70% 92%",
    },
    dark: {
      primary: "0 85% 62%", primaryGlow: "0 95% 72%", accent: "12 90% 60%",
      roseLight: "0 35% 22%", sceneAccent: "12 80% 55%",
      mesh1: "0 35% 14%", mesh2: "12 30% 13%", mesh3: "350 30% 14%", mesh4: "20 30% 13%",
    },
  },
  {
    id: "slate",
    label: "Графит",
    swatch: "#4d636d",
    light: {
      primary: "199 17% 36%", primaryGlow: "199 25% 55%", accent: "199 30% 50%",
      roseLight: "199 30% 92%", sceneAccent: "199 40% 70%",
      mesh1: "199 30% 90%", mesh2: "210 25% 92%", mesh3: "220 20% 90%", mesh4: "199 20% 93%",
    },
    dark: {
      primary: "199 35% 65%", primaryGlow: "199 50% 75%", accent: "199 40% 60%",
      roseLight: "199 25% 22%", sceneAccent: "199 45% 55%",
      mesh1: "199 25% 14%", mesh2: "210 20% 12%", mesh3: "220 18% 13%", mesh4: "199 20% 14%",
    },
  },
  {
    id: "blue",
    label: "Синий",
    swatch: "#2626ff",
    light: {
      primary: "240 95% 60%", primaryGlow: "240 100% 75%", accent: "220 90% 62%",
      roseLight: "240 90% 96%", sceneAccent: "220 95% 75%",
      mesh1: "240 85% 92%", mesh2: "220 80% 93%", mesh3: "210 75% 92%", mesh4: "260 70% 93%",
    },
    dark: {
      primary: "240 90% 72%", primaryGlow: "240 100% 80%", accent: "220 90% 68%",
      roseLight: "240 35% 22%", sceneAccent: "220 80% 60%",
      mesh1: "240 35% 16%", mesh2: "220 30% 14%", mesh3: "210 28% 13%", mesh4: "260 28% 15%",
    },
  },
  {
    id: "pink",
    label: "Розовый",
    swatch: "#c92a72",
    light: {
      primary: "330 65% 48%", primaryGlow: "330 80% 65%", accent: "320 70% 60%",
      roseLight: "330 80% 95%", sceneAccent: "320 90% 75%",
      mesh1: "330 80% 90%", mesh2: "320 75% 92%", mesh3: "340 70% 92%", mesh4: "300 60% 93%",
    },
    dark: {
      primary: "330 78% 65%", primaryGlow: "330 90% 75%", accent: "320 80% 65%",
      roseLight: "330 35% 22%", sceneAccent: "320 70% 55%",
      mesh1: "330 30% 16%", mesh2: "320 28% 14%", mesh3: "340 28% 14%", mesh4: "300 25% 14%",
    },
  },
  {
    id: "green",
    label: "Зелёный",
    swatch: "#55951b",
    light: {
      primary: "91 70% 35%", primaryGlow: "91 70% 55%", accent: "80 65% 45%",
      roseLight: "91 60% 93%", sceneAccent: "91 75% 65%",
      mesh1: "91 70% 90%", mesh2: "80 65% 92%", mesh3: "110 55% 92%", mesh4: "70 60% 93%",
    },
    dark: {
      primary: "91 60% 55%", primaryGlow: "91 75% 65%", accent: "80 60% 55%",
      roseLight: "91 30% 20%", sceneAccent: "91 55% 45%",
      mesh1: "91 30% 13%", mesh2: "80 28% 12%", mesh3: "110 25% 13%", mesh4: "70 25% 12%",
    },
  },
  {
    id: "amber",
    label: "Янтарь",
    swatch: "#e9e110",
    light: {
      primary: "54 90% 42%", primaryGlow: "54 95% 60%", accent: "42 90% 55%",
      roseLight: "54 90% 94%", sceneAccent: "54 100% 70%",
      mesh1: "54 90% 90%", mesh2: "42 85% 92%", mesh3: "38 80% 92%", mesh4: "60 80% 93%",
    },
    dark: {
      primary: "54 85% 58%", primaryGlow: "54 95% 68%", accent: "42 90% 60%",
      roseLight: "54 35% 20%", sceneAccent: "54 70% 50%",
      mesh1: "54 30% 13%", mesh2: "42 28% 12%", mesh3: "38 28% 13%", mesh4: "60 25% 13%",
    },
  },
];

const STORAGE_KEY = "knails-palette";

function applyPalette(id: PaletteId) {
  const def = PALETTES.find((p) => p.id === id) ?? PALETTES[0];
  const root = document.documentElement;
  const isDark = root.classList.contains("dark");
  const t = isDark ? def.dark : def.light;
  root.style.setProperty("--primary", t.primary);
  root.style.setProperty("--primary-glow", t.primaryGlow);
  root.style.setProperty("--ring", t.primary);
  root.style.setProperty("--accent", t.accent);
  root.style.setProperty("--rose", t.primary);
  root.style.setProperty("--rose-light", t.roseLight);
  root.style.setProperty("--scene-accent", t.sceneAccent);
  root.style.setProperty("--mesh-1", t.mesh1);
  root.style.setProperty("--mesh-2", t.mesh2);
  root.style.setProperty("--mesh-3", t.mesh3);
  root.style.setProperty("--mesh-4", t.mesh4);
  root.setAttribute("data-palette", id);
}

function readStored(): PaletteId {
  if (typeof window === "undefined") return "rose";
  const v = localStorage.getItem(STORAGE_KEY) as PaletteId | null;
  return v && PALETTES.some((p) => p.id === v) ? v : "rose";
}

/**
 * Apply the saved palette once on boot AND re-apply whenever the
 * theme (light/dark) class flips on <html>.
 */
export function usePaletteBoot() {
  useEffect(() => {
    applyPalette(readStored());
    const obs = new MutationObserver(() => applyPalette(readStored()));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);
}

export function usePalette() {
  const [palette, setPaletteState] = useState<PaletteId>(() => readStored());

  const setPalette = useCallback((id: PaletteId) => {
    setPaletteState(id);
    localStorage.setItem(STORAGE_KEY, id);
    applyPalette(id);
  }, []);

  return { palette, setPalette, palettes: PALETTES };
}
