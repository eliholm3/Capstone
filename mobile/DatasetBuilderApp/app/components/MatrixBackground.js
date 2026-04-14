import React, { useState, useEffect, useRef } from "react";
import { View, Text, Dimensions, StyleSheet, Platform } from "react-native";

// Matrix rain background — React Native port of web/src/components/MatrixBackground.jsx.
// Instead of a canvas, we render each column's trail as absolutely-positioned <Text>
// views whose opacity fades from head to tail, producing the same "falling character" effect.

const CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const FONT_SIZE = 14;
const COL_WIDTH = FONT_SIZE * 3;
const TRAIL_LENGTH = 22;
const TICK_MS = 80;

const randomChar = () => CHARS[Math.floor(Math.random() * CHARS.length)];

export default function MatrixBackground() {
  const [dims, setDims] = useState(() => Dimensions.get("window"));
  const { width, height } = dims;

  const numColumns = Math.max(1, Math.floor(width / COL_WIDTH));
  const maxRows = Math.max(1, Math.ceil(height / FONT_SIZE));

  // Mutable stream state — we don't want to re-allocate this on every render.
  const streamsRef = useRef(null);
  const makeStream = () => ({
    y: Math.floor(Math.random() * maxRows) - Math.floor(Math.random() * 40),
    speed: 0.3 + Math.random() * 0.7,
    acc: 0,
    chars: Array.from({ length: TRAIL_LENGTH }, randomChar),
  });

  if (streamsRef.current === null || streamsRef.current.length !== numColumns) {
    streamsRef.current = Array.from({ length: numColumns }, makeStream);
  }

  // Bumping this state forces a re-render on each animation tick.
  const [, setTick] = useState(0);

  useEffect(() => {
    const sub = Dimensions.addEventListener("change", ({ window }) =>
      setDims(window),
    );
    return () => sub?.remove?.();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const streams = streamsRef.current;
      for (const s of streams) {
        s.acc += s.speed;
        if (s.acc >= 1) {
          const steps = Math.floor(s.acc);
          s.y += steps;
          s.acc -= steps;
          // Shift in new random chars at the head for each row advanced.
          for (let i = 0; i < steps; i++) {
            s.chars.unshift(randomChar());
            if (s.chars.length > TRAIL_LENGTH) s.chars.pop();
          }
        }
        // Flicker the head character occasionally for extra life.
        if (Math.random() > 0.7) s.chars[0] = randomChar();

        // Recycle streams that have fallen off the bottom.
        if (s.y * FONT_SIZE > height && Math.random() > 0.98) {
          s.y =
            Math.floor(Math.random() * maxRows) -
            Math.floor(Math.random() * 40);
          s.speed = 0.3 + Math.random() * 0.7;
          s.acc = 0;
        }
      }
      setTick((t) => (t + 1) % 1000000);
    }, TICK_MS);
    return () => clearInterval(interval);
  }, [height, maxRows]);

  return (
    <View pointerEvents="none" style={[styles.container, { width, height }]}>
      {streamsRef.current.map((s, col) => {
        const left = col * COL_WIDTH;
        return (
          <View
            key={col}
            style={{
              position: "absolute",
              left,
              top: 0,
              width: COL_WIDTH,
              height,
            }}
          >
            {s.chars.map((ch, i) => {
              const rowY = (s.y - i) * FONT_SIZE;
              if (rowY < -FONT_SIZE || rowY > height) return null;
              // Fade from the head (i=0, full) down the trail.
              const opacity = (1 - i / TRAIL_LENGTH) * 0.5;
              return (
                <Text key={i} style={[styles.char, { top: rowY, opacity }]}>
                  {ch}
                </Text>
              );
            })}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    // Matches the low-opacity ambient feel of the web version.
    opacity: 0.1,
  },
  char: {
    position: "absolute",
    color: "#fafafa",
    fontSize: FONT_SIZE,
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "monospace",
    }),
    lineHeight: FONT_SIZE,
  },
});
