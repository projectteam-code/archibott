import type { FloorPlan } from "./types";

export const SAMPLE_FLOOR_PLAN: FloorPlan = {
  id: "plan-a1",
  name: "1BHK Compact",
  version: "1.0.0",
  units: "cm",
  rooms: [
    {
      id: "r-bed-1",
      type: "bedroom",
      x: 0,
      y: 0,
      width: 360,
      height: 300,
      walls: [
        { id: "r-bed-1-n", edge: "north", thickness: 20, height: 300, connections: [{ kind: "corner" }] },
        { id: "r-bed-1-e", edge: "east", thickness: 20, height: 300, connections: [{ kind: "corner" }] },
        { id: "r-bed-1-s", edge: "south", thickness: 20, height: 300, connections: [{ kind: "corner" }] },
        { id: "r-bed-1-w", edge: "west", thickness: 20, height: 300, connections: [{ kind: "corner" }] }
      ],
      openings: [
        { id: "D1", kind: "door", wallEdge: "south", offset: 120, width: 90, sillHeight: 0, headHeight: 210 },
        { id: "W1", kind: "window", wallEdge: "east", offset: 110, width: 120, sillHeight: 90, headHeight: 210 }
      ]
    },
    {
      id: "r-toilet-1",
      type: "toilet",
      x: 360,
      y: 180,
      width: 180,
      height: 120,
      walls: [
        { id: "r-toilet-1-n", edge: "north", thickness: 15, height: 280, connections: [{ kind: "corner" }] },
        { id: "r-toilet-1-e", edge: "east", thickness: 15, height: 280, connections: [{ kind: "corner" }] },
        { id: "r-toilet-1-s", edge: "south", thickness: 15, height: 280, connections: [{ kind: "corner" }] },
        { id: "r-toilet-1-w", edge: "west", thickness: 15, height: 280, connections: [{ kind: "corner" }] }
      ],
      openings: [{ id: "D2", kind: "door", wallEdge: "west", offset: 20, width: 80, sillHeight: 0, headHeight: 210 }]
    },
    {
      id: "r-balcony-1",
      type: "balcony",
      x: 0,
      y: 300,
      width: 240,
      height: 120,
      walls: [
        { id: "r-balcony-1-n", edge: "north", thickness: 12, height: 120, connections: [{ kind: "corner" }] },
        { id: "r-balcony-1-e", edge: "east", thickness: 12, height: 120, connections: [{ kind: "corner" }] },
        { id: "r-balcony-1-s", edge: "south", thickness: 12, height: 120, connections: [{ kind: "corner" }] },
        { id: "r-balcony-1-w", edge: "west", thickness: 12, height: 120, connections: [{ kind: "corner" }] }
      ],
      openings: [{ id: "W4", kind: "window", wallEdge: "south", offset: 40, width: 120, sillHeight: 50, headHeight: 100 }]
    }
  ]
};
