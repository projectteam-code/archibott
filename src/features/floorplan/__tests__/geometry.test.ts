import { computeWallGeometry, computeWallSegments } from "@/features/floorplan/geometry";
import { SAMPLE_FLOOR_PLAN } from "@/features/floorplan/samplePlan";
import type { FloorPlan, Room } from "@/features/floorplan/types";

function makeSimpleRoom(overrides?: Partial<Room>): Room {
  return {
    id: "room-1",
    type: "bedroom",
    x: 0,
    y: 0,
    width: 400,
    height: 300,
    walls: [
      { id: "n", edge: "north", thickness: 20, height: 300, connections: [{ kind: "corner" }] },
      { id: "e", edge: "east", thickness: 20, height: 300, connections: [{ kind: "corner" }] },
      { id: "s", edge: "south", thickness: 20, height: 300, connections: [{ kind: "corner" }] },
      { id: "w", edge: "west", thickness: 20, height: 300, connections: [{ kind: "corner" }] }
    ],
    openings: [],
    ...overrides
  };
}

function makePlan(room: Room): FloorPlan {
  return {
    id: "plan-test",
    name: "Test",
    version: "1.0.0",
    units: "cm",
    rooms: [room]
  };
}

describe("computeWallSegments", () => {
  it("creates one segment per wall when no openings exist", () => {
    const plan = makePlan(makeSimpleRoom());
    const segments = computeWallSegments(plan);
    expect(segments).toHaveLength(4);
  });

  it("splits one wall into two segments around a single opening", () => {
    const room = makeSimpleRoom({
      openings: [{ id: "D1", kind: "door", wallEdge: "south", offset: 100, width: 90 }]
    });
    const plan = makePlan(room);
    const segments = computeWallSegments(plan);
    const southSegments = segments.filter((segment) => segment.edge === "south");
    expect(southSegments).toHaveLength(2);
  });

  it("splits one wall into N+1 segments for multiple non-overlapping openings", () => {
    const room = makeSimpleRoom({
      openings: [
        { id: "W1", kind: "window", wallEdge: "north", offset: 40, width: 60 },
        { id: "W2", kind: "window", wallEdge: "north", offset: 180, width: 80 }
      ]
    });
    const plan = makePlan(room);
    const geometry = computeWallGeometry(plan);
    const northSegments = geometry.segments.filter((segment) => segment.edge === "north");
    expect(northSegments).toHaveLength(3);
    expect(geometry.issues).toHaveLength(0);
  });

  it("filters invalid openings and reports issues", () => {
    const room = makeSimpleRoom({
      openings: [
        { id: "W1", kind: "window", wallEdge: "east", offset: 20, width: 80 },
        { id: "W2", kind: "window", wallEdge: "east", offset: 60, width: 90 },
        { id: "W3", kind: "window", wallEdge: "east", offset: 1000, width: 20 },
        { id: "W4", kind: "window", wallEdge: "east", offset: 120, width: -5 }
      ]
    });
    const plan = makePlan(room);
    const geometry = computeWallGeometry(plan);

    expect(geometry.issues.map((issue) => issue.reason).sort()).toEqual([
      "non_positive_width",
      "outside_wall",
      "overlap"
    ]);
    const eastSegments = geometry.segments.filter((segment) => segment.edge === "east");
    expect(eastSegments.length).toBeGreaterThan(0);
  });

  it("produces segments for sample plan", () => {
    const segments = computeWallSegments(SAMPLE_FLOOR_PLAN);
    expect(segments.length).toBeGreaterThan(0);
  });
});
