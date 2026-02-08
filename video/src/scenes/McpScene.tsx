import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  Sequence,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/DMSans";
import { loadFont as loadMono } from "@remotion/google-fonts/IBMPlexMono";
import { colors } from "../design-tokens";
import { TerminalFrame } from "../components/TerminalFrame";
import { TypewriterLine } from "../components/TypewriterLine";
import { McpToolList } from "../components/McpToolList";

const { fontFamily } = loadFont("normal", {
  weights: ["600", "700"],
  subsets: ["latin"],
});

const { fontFamily: mono } = loadMono("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

const SkillBadge: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame,
    fps,
    config: { damping: 200 },
  });

  const opacity = interpolate(progress, [0, 1], [0, 1], {
    extrapolateRight: "clamp",
  });
  const scale = interpolate(progress, [0, 1], [0.9, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 10,
        opacity,
        transform: `scale(${scale})`,
      }}
    >
      <div
        style={{
          fontFamily: mono,
          fontSize: 28,
          fontWeight: 500,
          color: colors.accent,
          padding: "12px 32px",
          borderRadius: 12,
          border: `2px solid ${colors.accentDim}`,
          background: colors.bgCard,
          letterSpacing: "0.04em",
        }}
      >
        SKILL.md
      </div>
      <div
        style={{
          fontFamily,
          fontSize: 16,
          color: colors.textSecondary,
          letterSpacing: "0.02em",
        }}
      >
        One file. Full workflow.
      </div>
    </div>
  );
};

const LogoFrame: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const glowProgress = spring({
    frame,
    fps,
    config: { damping: 200 },
    delay: 15,
  });

  const glowOpacity = interpolate(glowProgress, [0, 1], [0, 0.4], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
      }}
    >
      <div
        style={{
          fontFamily,
          fontSize: 36,
          fontWeight: 700,
          color: colors.textPrimary,
          letterSpacing: "0.04em",
          textShadow: `0 0 40px rgba(6, 214, 160, ${glowOpacity})`,
        }}
      >
        XYTE SDK
      </div>
    </div>
  );
};

export const McpScene: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: colors.bgBase, padding: 40 }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          gap: 16,
        }}
      >
        {/* Terminal with MCP serve */}
        <div style={{ flex: 1 }}>
          <TerminalFrame
            title="xyte mcp server"
            badge="Agent"
            badgeType="agent"
          >
            <TypewriterLine
              text="xyte mcp serve"
              startFrame={5}
              charFrames={2}
            />
            <div style={{ marginTop: 12 }}>
              <Sequence from={35} layout="none" >
                <McpToolList startFrame={0} />
              </Sequence>
            </div>
          </TerminalFrame>
        </div>

        {/* SKILL badge + logo */}
        <Sequence from={90} layout="none" >
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 48,
              padding: "10px 0",
            }}
          >
            <SkillBadge />
            <LogoFrame />
          </div>
        </Sequence>
      </div>
    </AbsoluteFill>
  );
};
