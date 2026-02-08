import React from "react";
import { loadFont as loadMono } from "@remotion/google-fonts/IBMPlexMono";
import { colors, terminalDots, radii } from "../design-tokens";

const { fontFamily: mono } = loadMono("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

type BadgeType = "operator" | "agent";

const badgeColors: Record<BadgeType, { color: string; bg: string }> = {
  operator: { color: colors.accent, bg: colors.accentDim },
  agent: { color: colors.cta, bg: "rgba(240, 160, 48, 0.12)" },
};

export const TerminalFrame: React.FC<{
  title: string;
  badge?: string;
  badgeType?: BadgeType;
  children: React.ReactNode;
}> = ({ title, badge, badgeType = "agent", children }) => {
  const bc = badgeColors[badgeType];

  return (
    <div
      style={{
        background: colors.bgCard,
        border: `1px solid ${colors.borderSubtle}`,
        borderRadius: radii.lg,
        overflow: "hidden",
        boxShadow: `0 2px 20px rgba(0,0,0,0.35), 0 0 60px rgba(6,214,160,0.08)`,
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Title bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "12px 16px",
          background: "rgba(255, 255, 255, 0.02)",
          borderBottom: `1px solid ${colors.borderSubtle}`,
        }}
      >
        {/* Traffic light dots */}
        {[terminalDots.red, terminalDots.orange, terminalDots.green].map(
          (dot, i) => (
            <span
              key={i}
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: dot.color,
                opacity: dot.opacity,
              }}
            />
          )
        )}
        {/* Title */}
        <span
          style={{
            marginLeft: 8,
            fontFamily: mono,
            fontSize: 11,
            color: colors.textMuted,
          }}
        >
          {title}
        </span>
        {/* Badge */}
        {badge && (
          <span
            style={{
              marginLeft: "auto",
              fontFamily: mono,
              fontSize: 10,
              fontWeight: 500,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              padding: "3px 10px",
              borderRadius: 4,
              color: bc.color,
              background: bc.bg,
            }}
          >
            {badge}
          </span>
        )}
      </div>
      {/* Content area */}
      <div style={{ flex: 1, padding: 20, overflow: "hidden" }}>{children}</div>
    </div>
  );
};
