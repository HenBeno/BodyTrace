import React from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

export interface AlignmentGuideProps {
  visible?: boolean;
}

const lineColor = 'rgba(255,255,255,0.32)';

/**
 * Rule-of-thirds grid + vertical center line to help match pose and framing.
 */
export function AlignmentGuide({ visible = true }: AlignmentGuideProps) {
  const { width, height } = useWindowDimensions();

  if (!visible) return null;

  const v1 = width / 3;
  const v2 = (width * 2) / 3;
  const h1 = height / 3;
  const h2 = (height * 2) / 3;
  const centerColor = 'rgba(56, 189, 248, 0.38)';

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={[styles.vLine, { left: v1, backgroundColor: lineColor }]} />
      <View style={[styles.vLine, { left: v2, backgroundColor: lineColor }]} />
      <View style={[styles.hLine, { top: h1, backgroundColor: lineColor }]} />
      <View style={[styles.hLine, { top: h2, backgroundColor: lineColor }]} />
      <View
        style={[
          styles.vLine,
          { left: width / 2 - 0.75, backgroundColor: centerColor, width: 1.5 },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  vLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
  },
  hLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
  },
});
