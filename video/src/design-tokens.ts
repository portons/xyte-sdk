export const colors = {
  bgBase: "#0c0d0f",
  bgCard: "#141518",
  bgElevated: "#1a1b20",
  bgCode: "#111214",
  borderSubtle: "rgba(255, 255, 255, 0.06)",
  borderHover: "rgba(255, 255, 255, 0.14)",
  textPrimary: "#e8e8e8",
  textSecondary: "#999",
  textMuted: "#606060",
  accent: "#06d6a0",
  accentDim: "rgba(6, 214, 160, 0.12)",
  accentGlow: "rgba(6, 214, 160, 0.25)",
  cta: "#f0a030",
  ctaHover: "#f5b750",
  blue: "#5ba8ff",
  red: "#f06060",
} as const;

export const terminalDots = {
  red: { color: colors.red, opacity: 0.7 },
  orange: { color: colors.cta, opacity: 0.7 },
  green: { color: colors.accent, opacity: 0.7 },
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 18,
} as const;
