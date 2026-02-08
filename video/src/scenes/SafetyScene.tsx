import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { loadFont } from "@remotion/google-fonts/DMSans";
import { colors } from "../design-tokens";
import { TerminalFrame } from "../components/TerminalFrame";
import { SafetyTiers } from "../components/SafetyTiers";
import { TypewriterLine } from "../components/TypewriterLine";
import { JsonResponse } from "../components/JsonResponse";

const { fontFamily } = loadFont("normal", {
  weights: ["600", "700"],
  subsets: ["latin"],
});

const GUARD_JSON = `{
  "guard": "write",
  "action": "sendCommand",
  "status": "confirmed",
  "flag": "--allow-write"
}`;

export const SafetyScene: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: colors.bgBase, padding: 40 }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          gap: 20,
        }}
      >
        {/* Title */}
        <div style={{ textAlign: "center" }}>
          <h2
            style={{
              fontFamily,
              fontSize: 28,
              fontWeight: 700,
              color: colors.textPrimary,
              margin: 0,
            }}
          >
            3-Tier Safety Model
          </h2>
        </div>

        {/* Tiers visual */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            padding: "10px 0",
          }}
        >
          <SafetyTiers startFrame={15} />
        </div>

        {/* Terminal demo */}
        <div style={{ flex: 1 }}>
          <TerminalFrame
            title="guarded write"
            badge="Agent"
            badgeType="agent"
          >
            <TypewriterLine
              text="xyte call device.sendCommand --allow-write"
              startFrame={70}
              charFrames={2}
            />
            <Sequence from={120} layout="none" >
              <div style={{ marginTop: 12 }}>
                <JsonResponse json={GUARD_JSON} startFrame={0} />
              </div>
            </Sequence>
          </TerminalFrame>
        </div>
      </div>
    </AbsoluteFill>
  );
};
