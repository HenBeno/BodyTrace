export type BmiCategory = "underweight" | "normal" | "overweight" | "obese"

export function computeBmi(weightKg: number, heightCm: number): number | null {
  if (!Number.isFinite(weightKg) || !Number.isFinite(heightCm)) return null
  if (weightKg <= 0 || heightCm <= 0) return null
  const m = heightCm / 100
  if (m <= 0) return null
  const bmi = weightKg / (m * m)
  if (!Number.isFinite(bmi)) return null
  return bmi
}

export function classifyBmi(bmi: number): BmiCategory {
  if (bmi < 18.5) return "underweight"
  if (bmi < 25) return "normal"
  if (bmi < 30) return "overweight"
  return "obese"
}

export function bmiCategoryLabel(category: BmiCategory): string {
  switch (category) {
    case "underweight":
      return "Underweight"
    case "normal":
      return "Normal"
    case "overweight":
      return "Overweight"
    case "obese":
      return "Obese"
  }
}

/** Map BMI to 0-1 position on a 15-40 scale (clamped). */
export function bmiGaugePosition01(bmi: number): number {
  const min = 15
  const max = 40
  return Math.min(1, Math.max(0, (bmi - min) / (max - min)))
}
