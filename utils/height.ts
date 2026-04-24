/** Convert feet + inches to centimeters. */
export function cmFromFeetInches(feet: number, inches: number): number {
  const totalInches = feet * 12 + inches
  return totalInches * 2.54
}

/** Convert centimeters to total inches. */
export function totalInchesFromCm(cm: number): number {
  return cm / 2.54
}

export function feetInchesFromCm(cm: number): { feet: number; inches: number } {
  const total = totalInchesFromCm(cm)
  const feet = Math.floor(total / 12)
  const inches = Math.round(total - feet * 12)
  if (inches === 12) {
    return { feet: feet + 1, inches: 0 }
  }
  return { feet, inches }
}
