import { SAMPLE_FLOOR_PLAN } from "@/features/floorplan/samplePlan";
import { safeParseFloorPlan } from "@/features/floorplan/validation";

describe("floorPlanSchema", () => {
  it("accepts a valid sample floor plan", () => {
    const result = safeParseFloorPlan(SAMPLE_FLOOR_PLAN);
    expect(result.success).toBe(true);
  });

  it("rejects wrong units", () => {
    const invalid = { ...SAMPLE_FLOOR_PLAN, units: "m" };
    const result = safeParseFloorPlan(invalid);
    expect(result.success).toBe(false);
  });

  it("rejects rooms without four walls", () => {
    const invalid = {
      ...SAMPLE_FLOOR_PLAN,
      rooms: [{ ...SAMPLE_FLOOR_PLAN.rooms[0], walls: SAMPLE_FLOOR_PLAN.rooms[0].walls.slice(0, 3) }]
    };
    const result = safeParseFloorPlan(invalid);
    expect(result.success).toBe(false);
  });
});
