import { APP_NAME, MEASUREMENT_GROUPS, MEASUREMENT_LABELS } from "./constants";

describe("constants", () => {
  it("exports app name", () => {
    expect(APP_NAME).toBe("BodyTrace");
  });

  it("covers measurement keys once in groups", () => {
    const keys = new Set(MEASUREMENT_LABELS.map((m) => m.key));
    const grouped = MEASUREMENT_GROUPS.flatMap((g) => [...g.keys]);
    expect(new Set(grouped).size).toBe(keys.size);
    expect(grouped.length).toBe(keys.size);
  });
});
