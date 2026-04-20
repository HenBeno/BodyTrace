import { countPerDayTimes, normalizeWeeklyDays } from "./reminders";

describe("normalizeWeeklyDays", () => {
  it("dedupes, sorts, clamps to weekday 0–6, and defaults to Monday when empty", () => {
    expect(normalizeWeeklyDays([3, 1, 3])).toEqual([1, 3]);
    expect(normalizeWeeklyDays([])).toEqual([1]);
  });
});

describe("countPerDayTimes", () => {
  it("returns a single mid-morning slot for one reminder per day", () => {
    expect(countPerDayTimes(1)).toEqual([{ hour: 9, minute: 0 }]);
  });

  it("spreads multiple reminders across the day", () => {
    const times = countPerDayTimes(3);
    expect(times).toHaveLength(3);
    expect(times[0]).toEqual({ hour: 8, minute: 0 });
    expect(times[2]).toEqual({ hour: 22, minute: 0 });
  });
});
