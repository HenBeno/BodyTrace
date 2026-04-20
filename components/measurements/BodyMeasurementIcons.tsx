import { Image } from "expo-image";
import React from "react";
import { View } from "react-native";
import Svg, { Ellipse, Path } from "react-native-svg";

import type { Entry } from "@/types";
import { theme } from "@/utils/theme";

export type BodyMeasurementKey = keyof Entry["measurements"];

/**
 * Order matches supplied artwork: chest → waist → hips → neck → arm → thigh.
 * Weight: placeholder vector until a raster is added.
 */
const RASTER_SOURCES: Record<Exclude<BodyMeasurementKey, "weight">, number> = {
  chest: require("../../assets/measurement-icons/Screenshot 2026-04-16 024514.png"),
  waist: require("../../assets/measurement-icons/Screenshot 2026-04-16 024531.png"),
  hips: require("../../assets/measurement-icons/Screenshot 2026-04-16 024536.png"),
  neck: require("../../assets/measurement-icons/Screenshot 2026-04-16 024541.png"),
  arm: require("../../assets/measurement-icons/Screenshot 2026-04-16 024545.png"),
  thigh: require("../../assets/measurement-icons/Screenshot 2026-04-16 024550.png"),
};

const VB = 36;

function WeightPlaceholderGlyph({
  size,
  color,
}: {
  size: number;
  color: string;
}) {
  const o = "rgba(148,163,184,0.55)";
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${VB} ${VB}`}>
      <Path
        d="M5.5 28.5 H30.5 Q31.5 28.5 31.5 29.5 V31 Q31.5 32.5 30.5 32.5 H5.5 Q4.5 32.5 4.5 31 V29.5 Q4.5 28.5 5.5 28.5 Z"
        stroke={o}
        strokeWidth={1.2}
        fill="none"
      />
      <Path d="M18 28.5 V20.5" stroke={o} strokeWidth={1.1} />
      <Path
        d="M18 20.5 L8.5 26.5 H27.5 L18 20.5"
        stroke={o}
        strokeWidth={1.05}
        fill="none"
        strokeLinejoin="round"
      />
      <Ellipse
        cx="9"
        cy="28"
        rx="3.6"
        ry="2.2"
        stroke={color}
        strokeWidth={1.25}
        fill={color}
        fillOpacity={0.14}
      />
      <Ellipse
        cx="27"
        cy="28"
        rx="3.6"
        ry="2.2"
        stroke={color}
        strokeWidth={1.25}
        fill={color}
        fillOpacity={0.14}
      />
      <Path
        d="M12.5 10.5 H23.5 Q24.5 10.5 24.5 11.5 V17.5 Q24.5 18.5 23.5 18.5 H12.5 Q11.5 18.5 11.5 17.5 V11.5 Q11.5 10.5 12.5 10.5 Z"
        stroke={color}
        strokeWidth={1.1}
        fill={color}
        fillOpacity={0.16}
      />
    </Svg>
  );
}

type ZoneIconProps = {
  zone: BodyMeasurementKey;
  size?: number;
  accessibilityLabel: string;
  /** Stroke / accents for the temporary weight glyph only */
  accentColor?: string;
};

export function BodyMeasurementZoneIcon({
  zone,
  size = 30,
  accessibilityLabel,
  accentColor = theme.accent,
}: ZoneIconProps) {
  const box = { width: size, height: size, overflow: "hidden" as const };

  if (zone === "weight") {
    return (
      <View
        accessible
        accessibilityRole="image"
        accessibilityLabel={accessibilityLabel}
        style={box}
      >
        <WeightPlaceholderGlyph size={size} color={accentColor} />
      </View>
    );
  }
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      style={box}
    >
      {/**
       * `cover` + fixed square: every asset fills the same on-screen box (transparent margins
       * in source files no longer shrink some icons vs others). Center crop on overflow.
       */}
      <Image
        source={RASTER_SOURCES[zone]}
        style={{ width: size, height: size }}
        contentFit="cover"
        contentPosition="center"
        accessibilityIgnoresInvertColors
      />
    </View>
  );
}

type GlyphProps = {
  size?: number;
  accentColor: string;
  outlineColor?: string;
  accessibilityLabel: string;
};

const NOTES_VB = 36;

export function NotesGlyphIcon({
  size = 20,
  accentColor,
  outlineColor = "#64748b",
  accessibilityLabel,
}: GlyphProps) {
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
    >
      <Svg width={size} height={size} viewBox={`0 0 ${NOTES_VB} ${NOTES_VB}`}>
        <Path
          d="M11 10.5 H21.5 L25.5 14.5 V26.5 H11 Z"
          stroke={outlineColor}
          strokeWidth={1.15}
          fill="none"
          strokeLinejoin="round"
        />
        <Path
          d="M21.5 10.5 V14.5 H25.5"
          stroke={outlineColor}
          strokeWidth={1.15}
          fill="none"
          strokeLinejoin="round"
        />
        <Path
          d="M14.5 19 H22.5 M14.5 22.5 H21 M14.5 26 H19.5"
          stroke={accentColor}
          strokeWidth={1.35}
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
}
