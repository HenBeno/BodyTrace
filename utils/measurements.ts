import type { CircumferenceMeasure, CircumferenceUnit, Entry, WeightMeasure, WeightUnit } from '@/types';

export type MeasurementFieldKey = keyof Entry['measurements'];

export const CIRCUMFERENCE_UNIT_OPTIONS = [
  { id: 'cm' as const, label: 'cm' },
  { id: 'inch' as const, label: 'in' },
];

export const WEIGHT_UNIT_OPTIONS = [
  { id: 'kg' as const, label: 'kg' },
  { id: 'lb' as const, label: 'lb' },
];

export function isWeightMeasurementKey(key: MeasurementFieldKey): key is 'weight' {
  return key === 'weight';
}

export function defaultUnitForKey(key: MeasurementFieldKey): CircumferenceUnit | WeightUnit {
  return key === 'weight' ? 'lb' : 'inch';
}

/** Display string for a stored measurement (value + chosen unit). */
export function formatMeasurementDisplay(m: CircumferenceMeasure | WeightMeasure): string {
  const n = m.value;
  const s = Number.isInteger(n) ? String(n) : String(parseFloat(n.toFixed(2)));
  return `${s} ${m.unit}`;
}
