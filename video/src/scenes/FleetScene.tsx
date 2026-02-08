import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  Sequence,
} from "remotion";
import { loadFont as loadMono } from "@remotion/google-fonts/IBMPlexMono";
import { colors } from "../design-tokens";
import { TerminalFrame } from "../components/TerminalFrame";
import { TypewriterLine } from "../components/TypewriterLine";
import { JsonResponse } from "../components/JsonResponse";

const { fontFamily: mono } = loadMono("normal", {
  weights: ["400"],
  subsets: ["latin"],
});

const FLEET_JSON = `{
  "contractId": "xyte.inspect.fleet.v1",
  "totalDevices": 128,
  "online": 119,
  "incidents": { "active": 4, "resolved24h": 12 },
  "health": "nominal"
}`;

const PdfIcon: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 200 },
  });

  const scale = interpolate(progress, [0, 1], [0.5, 1], {
    extrapolateRight: "clamp",
  });
  const opacity = interpolate(progress, [0, 1], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        opacity,
        transform: `scale(${scale})`,
      }}
    >
      {/* PDF icon */}
      <div
        style={{
          width: 40,
          height: 48,
          borderRadius: 6,
          background: colors.red,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          fontFamily: mono,
          fontSize: 11,
          fontWeight: 500,
        }}
      >
        PDF
      </div>
      <div>
        <div
          style={{
            fontFamily: mono,
            fontSize: 12,
            color: colors.textPrimary,
          }}
        >
          report.pdf
        </div>
        <div
          style={{
            fontFamily: mono,
            fontSize: 10,
            color: colors.textMuted,
          }}
        >
          Generated from fleet deep-dive
        </div>
      </div>
    </div>
  );
};

export const FleetScene: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: colors.bgBase, padding: 40 }}>
      <TerminalFrame
        title="xyte cli — acme-demo"
        badge="Agent"
        badgeType="agent"
      >
        {/* Phase 1: inspect fleet */}
        <TypewriterLine
          text="xyte inspect fleet --format json"
          startFrame={5}
          charFrames={2}
        />
        <div style={{ marginTop: 12 }}>
          <JsonResponse
            json={FLEET_JSON}
            startFrame={65}
            highlight={['"128"', '"4"', '"nominal"']}
          />
        </div>

        {/* Phase 2: report generate */}
        <div style={{ marginTop: 16 }}>
          <TypewriterLine
            text="xyte report generate --out report.pdf"
            startFrame={110}
            charFrames={2}
          />
        </div>
        <Sequence from={145} layout="none" >
          <div style={{ marginTop: 12 }}>
            <PdfIcon />
          </div>
        </Sequence>
      </TerminalFrame>
    </AbsoluteFill>
  );
};
