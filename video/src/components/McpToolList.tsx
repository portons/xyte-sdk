import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { loadFont as loadMono } from "@remotion/google-fonts/IBMPlexMono";
import { colors } from "../design-tokens";

const { fontFamily: mono } = loadMono("normal", {
  weights: ["400"],
  subsets: ["latin"],
});

const tools = [
  "xyte_setup",
  "xyte_doctor",
  "xyte_list_endpoints",
  "xyte_call",
  "xyte_inspect",
  "xyte_report",
  "xyte_headless",
];

export const McpToolList: React.FC<{
  startFrame?: number;
}> = ({ startFrame = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = frame - startFrame;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {tools.map((tool, i) => {
        const progress = spring({
          frame: localFrame,
          fps,
          config: { damping: 200 },
          delay: i * 6,
        });

        const opacity = interpolate(progress, [0, 1], [0, 1], {
          extrapolateRight: "clamp",
        });
        const translateX = interpolate(progress, [0, 1], [-16, 0], {
          extrapolateRight: "clamp",
        });

        return (
          <div
            key={tool}
            style={{
              fontFamily: mono,
              fontSize: 13,
              color: colors.accent,
              padding: "6px 14px",
              borderRadius: 6,
              border: `1px solid ${colors.borderSubtle}`,
              background: colors.bgCode,
              opacity,
              transform: `translateX(${translateX}px)`,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span style={{ color: colors.textMuted, fontSize: 10 }}>
              {String(i + 1).padStart(2, "0")}
            </span>
            {tool}
          </div>
        );
      })}
    </div>
  );
};
