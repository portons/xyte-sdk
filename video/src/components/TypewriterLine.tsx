import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { loadFont as loadMono } from "@remotion/google-fonts/IBMPlexMono";
import { colors } from "../design-tokens";

const { fontFamily: mono } = loadMono("normal", {
  weights: ["400"],
  subsets: ["latin"],
});

export const TypewriterLine: React.FC<{
  text: string;
  startFrame?: number;
  charFrames?: number;
  prefix?: string;
  color?: string;
}> = ({
  text,
  startFrame = 0,
  charFrames = 2,
  prefix = "$ ",
  color = colors.textPrimary,
}) => {
  const frame = useCurrentFrame();
  const localFrame = frame - startFrame;

  if (localFrame < 0) return null;

  const typedCount = Math.min(text.length, Math.floor(localFrame / charFrames));
  const typedText = text.slice(0, typedCount);
  const isTyping = typedCount < text.length;

  const cursorOpacity = isTyping
    ? 1
    : interpolate(frame % 16, [0, 8, 16], [1, 0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });

  return (
    <div
      style={{
        fontFamily: mono,
        fontSize: 14,
        lineHeight: 1.7,
        color,
        whiteSpace: "pre",
      }}
    >
      <span style={{ color: colors.accent }}>{prefix}</span>
      <span>{typedText}</span>
      <span style={{ opacity: cursorOpacity }}>{"\u258C"}</span>
    </div>
  );
};
