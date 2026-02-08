import React from "react";
import {
  TransitionSeries,
  linearTiming,
} from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { SetupScene } from "./scenes/SetupScene";
import { EndpointScene } from "./scenes/EndpointScene";
import { SafetyScene } from "./scenes/SafetyScene";
import { FleetScene } from "./scenes/FleetScene";
import { McpScene } from "./scenes/McpScene";

const TRANSITION_FRAMES = 15;
const timing = linearTiming({ durationInFrames: TRANSITION_FRAMES });

const scenes = [
  { component: SetupScene, duration: 150 },
  { component: EndpointScene, duration: 210 },
  { component: SafetyScene, duration: 180 },
  { component: FleetScene, duration: 180 },
  { component: McpScene, duration: 180 },
];

export const XyteDemo: React.FC = () => {
  return (
    <TransitionSeries>
      {scenes.map((scene, i) => {
        const Scene = scene.component;
        return (
          <React.Fragment key={i}>
            {i > 0 && (
              <TransitionSeries.Transition
                presentation={fade()}
                timing={timing}
              />
            )}
            <TransitionSeries.Sequence durationInFrames={scene.duration}>
              <Scene />
            </TransitionSeries.Sequence>
          </React.Fragment>
        );
      })}
    </TransitionSeries>
  );
};
