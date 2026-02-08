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

const endpoints = [
  "organization.devices.getDevices",
  "organization.spaces.getSpaces",
  "partner.tickets.getTickets",
  "device.getInfo",
  "device.getState",
];

const ENVELOPE_JSON = `{
  "contractId": "xyte.call.envelope.v1",
  "endpoint": "organization.devices.getDevices",
  "status": 200,
  "data": { "devices": 128, "online": 119 }
}`;

const EndpointList: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {endpoints.map((ep, i) => {
        const progress = spring({
          frame,
          fps,
          config: { damping: 200 },
          delay: i * 5,
        });
        const opacity = interpolate(progress, [0, 1], [0, 1], {
          extrapolateRight: "clamp",
        });
        return (
          <div
            key={ep}
            style={{
              fontFamily: mono,
              fontSize: 12,
              color: colors.accent,
              opacity,
              lineHeight: 1.6,
            }}
          >
            {"  "}{ep}
          </div>
        );
      })}
    </div>
  );
};

export const EndpointScene: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: colors.bgBase, padding: 40 }}>
      <TerminalFrame
        title="xyte cli — acme-demo"
        badge="Agent"
        badgeType="agent"
      >
        {/* Phase 1: list-endpoints */}
        <TypewriterLine
          text="xyte list-endpoints"
          startFrame={5}
          charFrames={2}
        />
        <Sequence from={45} layout="none" >
          <EndpointList />
        </Sequence>

        {/* Phase 2: call with envelope */}
        <div style={{ marginTop: 12 }}>
          <TypewriterLine
            text="xyte call organization.devices.getDevices --output-mode envelope"
            startFrame={85}
            charFrames={1}
          />
        </div>
        <div style={{ marginTop: 12 }}>
          <JsonResponse
            json={ENVELOPE_JSON}
            startFrame={150}
            highlight={['"xyte.call.envelope.v1"']}
          />
        </div>
      </TerminalFrame>
    </AbsoluteFill>
  );
};
