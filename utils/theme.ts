/**
 * Semantic colors for APIs that need raw values (ActivityIndicator, Slider, Lucide, etc.).
 * Keep in sync with tailwind.config.js `theme.extend.colors`.
 */
export const theme = {
  accent: "#38bdf8",
  accentDim: "rgba(56,189,248,0.18)",
  accentGlow: "rgba(56,189,248,0.4)",
  canvas: "#080a0d",
  surface: "#12151a",
  elevated: "#1a1f27",
  primaryText: "#f4f6f8",
  secondaryText: "#9aa3af",
  mutedText: "#6b7280",
  danger: "#fb7185",
  borderSubtle: "rgba(255,255,255,0.08)",
  borderStrong: "rgba(255,255,255,0.14)",
  scrim: "rgba(0,0,0,0.72)",
} as const

/** Layout rhythm (px) — use in new code alongside NativeWind where helpful. */
export const space = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const
