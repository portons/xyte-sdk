import React from "react";
import { AbsoluteFill } from "remotion";
import { loadFont } from "@remotion/google-fonts/DMSans";
import { colors } from "../design-tokens";
import { TerminalFrame } from "../components/TerminalFrame";
import { TypewriterLine } from "../components/TypewriterLine";
import { JsonResponse } from "../components/JsonResponse";

loadFont("normal", { weights: ["400", "600"], subsets: ["latin"] });

const SETUP_JSON = `{
  "contractId": "xyte.setup.status.v1",
  "ready": true,
  "tenant": "acme",
  "apiKey": "****-configured",
  "connectivity": "ok"
}`;

export const SetupScene: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: colors.bgBase, padding: 40 }}>
      <TerminalFrame
        title="xyte cli — acme-demo"
        badge="Agent"
        badgeType="agent"
      >
        <TypewriterLine
          text="xyte setup status --format json"
          startFrame={10}
          charFrames={2}
        />
        <div style={{ marginTop: 16 }}>
          <JsonResponse
            json={SETUP_JSON}
            startFrame={75}
            highlight={['"ready"', '"acme"']}
          />
        </div>
      </TerminalFrame>
    </AbsoluteFill>
  );
};
