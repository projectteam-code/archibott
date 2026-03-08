export const ROOM_TYPES = [
  "bedroom",
  "toilet",
  "kitchen",
  "living",
  "dining",
  "balcony",
  "terrace",
  "study",
  "utility",
  "circulation",
  "other"
] as const;

export type RoomType = (typeof ROOM_TYPES)[number];
export type UnitType = "cm";
export type WallEdge = "north" | "east" | "south" | "west";
export type OpeningKind = "door" | "window";

export interface WallConnection {
  toWallId?: string;
  roomId?: string;
  kind: "corner" | "t-junction" | "cross" | "none";
}

export interface WallSpec {
  id: string;
  edge: WallEdge;
  thickness: number;
  height: number;
  connections: WallConnection[];
}

export interface Opening {
  id: string;
  kind: OpeningKind;
  wallEdge: WallEdge;
  offset: number;
  width: number;
  sillHeight?: number;
  headHeight?: number;
}

export interface Room {
  id: string;
  type: RoomType;
  x: number;
  y: number;
  width: number;
  height: number;
  walls: WallSpec[];
  openings: Opening[];
}

export interface FloorPlan {
  id: string;
  name: string;
  version: string;
  units: UnitType;
  rooms: Room[];
}

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface WallSegment {
  id: string;
  roomId: string;
  edge: WallEdge;
  sourceWallId: string;
  size: {
    length: number;
    height: number;
    thickness: number;
  };
  center: Vec3;
  rotationY: number;
}

export interface OpeningValidationIssue {
  roomId: string;
  wallEdge: WallEdge;
  openingId: string;
  reason: "non_positive_width" | "outside_wall" | "overlap";
}
