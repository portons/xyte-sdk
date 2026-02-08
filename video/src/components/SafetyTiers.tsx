import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { loadFont as loadMono } from "@remotion/google-fonts/IBMPlexMono";
import { colors } from "../design-tokens";

const { fontFamily: mono } = loadMono("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

const tiers = [
  {
    label: "READ",
    sub: "default",
    color: colors.accent,
    borderColor: colors.accentDim,
  },
  {
    label: "WRITE",
    sub: "--allow-write",
    color: colors.cta,
    borderColor: "rgba(240, 160, 48, 0.2)",
  },
  {
    label: "DELETE",
    sub: "--confirm <key>",
    color: colors.red,
    borderColor: "rgba(240, 96, 96, 0.2)",
  },
] as const;

export const SafetyTiers: React.FC<{
  startFrame?: number;
}> = ({ startFrame = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = frame - startFrame;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        justifyContent: "center",
      }}
    >
      {tiers.map((tier, i) => {
        const tierDelay = i * 20;
        const arrowDelay = tierDelay + 10;

        const tierProgress = spring({
          frame: localFrame,
          fps,
          config: { damping: 200 },
          delay: tierDelay,
        });

        const tierOpacity = interpolate(tierProgress, [0, 1], [0, 1], {
          extrapolateRight: "clamp",
        });
        const tierScale = interpolate(tierProgress, [0, 1], [0.8, 1], {
          extrapolateRight: "clamp",
        });

        return (
          <React.Fragment key={i}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
                opacity: tierOpacity,
                transform: `scale(${tierScale})`,
              }}
            >
              <span
                style={{
                  fontFamily: mono,
                  fontSize: 18,
                  fontWeight: 500,
                  padding: "10px 24px",
                  borderRadius: 8,
                  border: `2px solid ${tier.borderColor}`,
                  background: colors.bgCard,
                  color: tier.color,
                  letterSpacing: "0.05em",
                }}
              >
                {tier.label}
              </span>
              <span
                style={{
                  fontFamily: mono,
                  fontSize: 11,
                  color: colors.textMuted,
                }}
              >
                {tier.sub}
              </span>
            </div>
            {i < tiers.length - 1 && (
              <Arrow delay={arrowDelay} localFrame={localFrame} fps={fps} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

const Arrow: React.FC<{
  delay: number;
  localFrame: number;
  fps: number;
}> = ({ delay, localFrame, fps }) => {
  const progress = spring({
    frame: localFrame,
    fps,
    config: { damping: 200 },
    delay,
  });

  const opacity = interpolate(progress, [0, 1], [0, 1], {
    extrapolateRight: "clamp",
  });
  const translateX = interpolate(progress, [0, 1], [-8, 0], {
    extrapolateRight: "clamp",
  });

  return (
    <span
      style={{
        fontSize: 24,
        color: colors.textMuted,
        opacity,
        transform: `translateX(${translateX}px)`,
        marginBottom: 18,
      }}
    >
      {"\u2192"}
    </span>
  );
};
