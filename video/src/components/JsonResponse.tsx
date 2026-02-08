import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from "remotion";
import { loadFont as loadMono } from "@remotion/google-fonts/IBMPlexMono";
import { colors } from "../design-tokens";

const { fontFamily: mono } = loadMono("normal", {
  weights: ["400"],
  subsets: ["latin"],
});

const syntaxColors: Record<string, string> = {
  key: colors.blue,
  string: colors.accent,
  number: colors.cta,
  boolean: colors.cta,
  null: colors.textMuted,
  brace: colors.textSecondary,
  colon: colors.textSecondary,
};

function tokenize(
  json: string
): Array<{ text: string; type: string }> {
  const tokens: Array<{ text: string; type: string }> = [];
  const regex =
    /("(?:\\.|[^"\\])*")\s*:|("(?:\\.|[^"\\])*")|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|(\btrue\b|\bfalse\b)|(\bnull\b)|([{}[\],])|(\s+)/g;
  let match;
  while ((match = regex.exec(json)) !== null) {
    if (match[1] !== undefined) {
      tokens.push({ text: match[1], type: "key" });
      tokens.push({ text: ": ", type: "colon" });
    } else if (match[2] !== undefined) {
      tokens.push({ text: match[2], type: "string" });
    } else if (match[3] !== undefined) {
      tokens.push({ text: match[3], type: "number" });
    } else if (match[4] !== undefined) {
      tokens.push({ text: match[4], type: "boolean" });
    } else if (match[5] !== undefined) {
      tokens.push({ text: match[5], type: "null" });
    } else if (match[6] !== undefined) {
      tokens.push({ text: match[6], type: "brace" });
    } else if (match[7] !== undefined) {
      tokens.push({ text: match[7], type: "whitespace" });
    }
  }
  return tokens;
}

export const JsonResponse: React.FC<{
  json: string;
  startFrame?: number;
  highlight?: string[];
}> = ({ json, startFrame = 0, highlight = [] }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = frame - startFrame;

  if (localFrame < 0) return null;

  const progress = spring({
    frame: localFrame,
    fps,
    config: { damping: 200 },
  });

  const opacity = interpolate(progress, [0, 1], [0, 1], {
    extrapolateRight: "clamp",
  });
  const translateY = interpolate(progress, [0, 1], [12, 0], {
    extrapolateRight: "clamp",
  });

  const tokens = tokenize(json);

  return (
    <div
      style={{
        fontFamily: mono,
        fontSize: 12.5,
        lineHeight: 1.7,
        background: colors.bgCode,
        padding: "14px 16px",
        borderRadius: 8,
        border: `1px solid ${colors.borderSubtle}`,
        opacity,
        transform: `translateY(${translateY}px)`,
        whiteSpace: "pre",
        overflow: "hidden",
      }}
    >
      {tokens.map((token, i) => {
        const isHighlighted = highlight.some((h) => token.text.includes(h));
        return (
          <span
            key={i}
            style={{
              color:
                token.type === "whitespace"
                  ? undefined
                  : syntaxColors[token.type] || colors.textSecondary,
              backgroundColor: isHighlighted
                ? "rgba(6, 214, 160, 0.15)"
                : undefined,
              borderRadius: isHighlighted ? 3 : undefined,
              padding: isHighlighted ? "1px 3px" : undefined,
            }}
          >
            {token.text}
          </span>
        );
      })}
    </div>
  );
};
