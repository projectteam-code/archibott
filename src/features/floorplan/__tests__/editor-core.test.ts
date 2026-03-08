import { SAMPLE_FLOOR_PLAN } from "@/features/floorplan/samplePlan";
import { moveOpening, moveRoom, resizeRoom } from "@/features/floorplan/editor/commands";
import { validatePlanConstraints } from "@/features/floorplan/editor/constraints";
import { commitPlanHistory, createPlanHistory, redoPlanHistory, undoPlanHistory } from "@/features/floorplan/editor/history";
import { snapRoomRect, snapToGrid } from "@/features/floorplan/editor/snap";
import type { FloorPlan } from "@/features/floorplan/types";

describe("editor snap", () => {
  it("snaps scalar values to grid", () => {
    expect(snapToGrid(103, 10)).toBe(100);
    expect(snapToGrid(106, 10)).toBe(110);
  });

  it("snaps room rect to nearby room edges", () => {
    const snapped = snapRoomRect(
      { x: 123, y: 75, width: 200, height: 200 },
      [{ x: 300, y: 0, width: 200, height: 200 }],
      10,
      8
    );
    expect(snapped.x).toBe(120);
    expect(snapped.y).toBe(80);
  });
});

describe("editor constraints", () => {
  it("rejects room overlap", () => {
    const plan = {
      ...SAMPLE_FLOOR_PLAN,
      rooms: [
        { ...SAMPLE_FLOOR_PLAN.rooms[0], x: 0, y: 0, width: 300, height: 300 },
        { ...SAMPLE_FLOOR_PLAN.rooms[1], x: 200, y: 100, width: 200, height: 200 }
      ]
    };
    const issues = validatePlanConstraints(plan, { minRoomSizeCm: 200, minOpeningWidthCm: 70 });
    expect(issues.some((issue) => issue.code === "room_overlap")).toBe(true);
  });

  it("rejects opening width below minimum", () => {
    const plan: FloorPlan = {
      ...SAMPLE_FLOOR_PLAN,
      rooms: [
        {
          ...SAMPLE_FLOOR_PLAN.rooms[0],
          openings: [
            { id: "small-open", kind: "door", wallEdge: "north", offset: 20, width: 60, headHeight: 210, sillHeight: 0 }
          ]
        }
      ]
    };
    const issues = validatePlanConstraints(plan, { minRoomSizeCm: 200, minOpeningWidthCm: 70 });
    expect(issues.some((issue) => issue.code === "opening_min_width")).toBe(true);
  });
});

describe("editor history", () => {
  it("supports undo and redo", () => {
    const initial = createPlanHistory(SAMPLE_FLOOR_PLAN);
    const movedPlan = moveRoom(SAMPLE_FLOOR_PLAN, SAMPLE_FLOOR_PLAN.rooms[0].id, 40, 0, {
      gridCm: 10,
      toleranceCm: 8
    });
    const committed = commitPlanHistory(initial, movedPlan);
    expect(committed.past).toHaveLength(1);

    const undone = undoPlanHistory(committed);
    expect(undone.present.rooms[0].x).toBe(SAMPLE_FLOOR_PLAN.rooms[0].x);

    const redone = redoPlanHistory(undone);
    expect(redone.present.rooms[0].x).toBe(movedPlan.rooms[0].x);
  });
});

describe("editor commands", () => {
  it("moves room on snapped grid", () => {
    const roomId = SAMPLE_FLOOR_PLAN.rooms[0].id;
    const moved = moveRoom(SAMPLE_FLOOR_PLAN, roomId, 37, 23, { gridCm: 10, toleranceCm: 8 });
    const room = moved.rooms.find((entry) => entry.id === roomId);
    expect(room?.x).toBe(40);
    expect(room?.y).toBe(20);
  });

  it("resizes a room", () => {
    const roomId = SAMPLE_FLOOR_PLAN.rooms[0].id;
    const resized = resizeRoom(
      SAMPLE_FLOOR_PLAN,
      roomId,
      { x: 0, y: 0, width: 355, height: 245 },
      { gridCm: 10, toleranceCm: 8 }
    );
    const room = resized.rooms.find((entry) => entry.id === roomId);
    expect(room?.width).toBe(360);
    expect(room?.height).toBe(250);
  });

  it("moves opening on snapped grid", () => {
    const roomId = SAMPLE_FLOOR_PLAN.rooms[0].id;
    const openingId = SAMPLE_FLOOR_PLAN.rooms[0].openings[0].id;
    const moved = moveOpening(SAMPLE_FLOOR_PLAN, roomId, openingId, 113, 10);
    const opening = moved.rooms[0].openings.find((entry) => entry.id === openingId);
    expect(opening?.offset).toBe(110);
  });
});
