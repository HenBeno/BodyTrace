import { Ghost } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';
import Slider from '@react-native-community/slider';

import { theme } from '@/utils/theme';

export interface OpacitySliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  /** Smaller chrome for camera drawer */
  compact?: boolean;
}

/**
 * Controls ghost overlay strength. Recommended UX: cap max around 0.5 for visibility of live feed.
 */
export function OpacitySlider({ value, onChange, min = 0, max = 0.5, disabled, compact }: OpacitySliderProps) {
  const pct = Math.round((value / max) * 100);
  const pad = compact ? 'px-3 py-2' : 'px-4 py-3';
  const labelCls = compact ? 'text-xs' : 'text-sm';
  return (
    <View
      className={`rounded-2xl border border-white/10 bg-canvas/55 ${pad} ${disabled ? 'opacity-45' : ''}`}>
      <View className={`${compact ? 'mb-1' : 'mb-2'} flex-row items-center justify-between`}>
        <View className="flex-row items-center gap-2">
          <Ghost size={compact ? 16 : 18} color={disabled ? theme.mutedText : theme.accent} />
          <Text className={`font-inter-medium text-white ${labelCls}`}>Ghost strength</Text>
        </View>
        <Text
          className={`font-inter-medium text-white/80 ${compact ? 'text-[10px]' : 'text-xs'}`}
          style={{ fontVariant: ['tabular-nums'] }}>
          {pct}%
        </Text>
      </View>
      <Slider
        minimumValue={min}
        maximumValue={max}
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        minimumTrackTintColor={theme.accent}
        maximumTrackTintColor="rgba(255,255,255,0.28)"
        thumbTintColor="#f8fafc"
      />
    </View>
  );
}
