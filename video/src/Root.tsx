import React from "react";
import { Composition } from "remotion";
import { XyteDemo } from "./XyteDemo";

// Scene durations: 150 + 210 + 180 + 180 + 180 = 900
// Transition overlaps: 4 * 15 = 60
// Total: 900 - 60 = 840 frames = 28s at 30fps

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="XyteDemo"
      component={XyteDemo}
      durationInFrames={840}
      fps={30}
      width={1280}
      height={720}
    />
  );
};
