import {
  defaultUnitForKey,
  formatMeasurementDisplay,
  isWeightMeasurementKey,
} from "./measurements";

describe("isWeightMeasurementKey", () => {
  it("identifies weight only", () => {
    expect(isWeightMeasurementKey("weight")).toBe(true);
    expect(isWeightMeasurementKey("waist")).toBe(false);
  });
});

describe("defaultUnitForKey", () => {
  it("uses lb for weight and inch for circumferences", () => {
    expect(defaultUnitForKey("weight")).toBe("lb");
    expect(defaultUnitForKey("waist")).toBe("inch");
  });
});

describe("formatMeasurementDisplay", () => {
  it("formats integers and decimals", () => {
    expect(formatMeasurementDisplay({ value: 10, unit: "cm" })).toBe("10 cm");
    expect(formatMeasurementDisplay({ value: 10.256, unit: "lb" })).toBe(
      "10.26 lb",
    );
  });
});
