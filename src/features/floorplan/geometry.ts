import type {
  FloorPlan,
  Opening,
  OpeningValidationIssue,
  Room,
  WallEdge,
  WallSegment,
  WallSpec
} from "./types";

const CM_TO_M = 0.01;

interface OpeningInterval {
  openingId: string;
  start: number;
  end: number;
}

interface SegmentInterval {
  start: number;
  end: number;
}

interface EdgeComputation {
  edge: WallEdge;
  wallSpec: WallSpec;
  wallLengthCm: number;
}

export function computeWallSegments(plan: FloorPlan): WallSegment[] {
  return computeWallGeometry(plan).segments;
}

export function computeWallGeometry(plan: FloorPlan): {
  segments: WallSegment[];
  issues: OpeningValidationIssue[];
} {
  const segments: WallSegment[] = [];
  const issues: OpeningValidationIssue[] = [];

  for (const room of plan.rooms) {
    for (const edgeInfo of getRoomEdges(room)) {
      const openingIntervals = normalizeOpenings(
        room,
        edgeInfo.edge,
        edgeInfo.wallLengthCm,
        issues
      );
      const solidIntervals = openingsToSolidIntervals(openingIntervals, edgeInfo.wallLengthCm, room, edgeInfo.edge, issues);

      for (const [index, interval] of solidIntervals.entries()) {
        const segment = intervalToWallSegment(room, edgeInfo, interval, index);
        if (segment) {
          segments.push(segment);
        }
      }
    }
  }

  return { segments, issues };
}

function getRoomEdges(room: Room): EdgeComputation[] {
  const byEdge = new Map<WallEdge, WallSpec>();
  for (const wall of room.walls) {
    byEdge.set(wall.edge, wall);
  }

  const result: EdgeComputation[] = [];
  const orderedEdges: WallEdge[] = ["north", "east", "south", "west"];
  for (const edge of orderedEdges) {
    const wall = byEdge.get(edge);
    if (!wall) continue;
    result.push({
      edge,
      wallSpec: wall,
      wallLengthCm: edge === "north" || edge === "south" ? room.width : room.height
    });
  }
  return result;
}

function normalizeOpenings(
  room: Room,
  edge: WallEdge,
  wallLengthCm: number,
  issues: OpeningValidationIssue[]
): OpeningInterval[] {
  const result: OpeningInterval[] = [];
  const edgeOpenings = room.openings.filter((opening) => opening.wallEdge === edge);

  for (const opening of edgeOpenings) {
    const interval = openingToInterval(opening);
    if (!interval) {
      issues.push({
        roomId: room.id,
        wallEdge: edge,
        openingId: opening.id,
        reason: "non_positive_width"
      });
      continue;
    }

    const clampedStart = Math.max(0, interval.start);
    const clampedEnd = Math.min(wallLengthCm, interval.end);
    if (clampedEnd <= clampedStart) {
      issues.push({
        roomId: room.id,
        wallEdge: edge,
        openingId: opening.id,
        reason: "outside_wall"
      });
      continue;
    }

    result.push({
      openingId: opening.id,
      start: clampedStart,
      end: clampedEnd
    });
  }

  return result.sort((a, b) => a.start - b.start || a.end - b.end);
}

function openingsToSolidIntervals(
  openingIntervals: OpeningInterval[],
  wallLengthCm: number,
  room: Room,
  edge: WallEdge,
  issues: OpeningValidationIssue[]
): SegmentInterval[] {
  if (openingIntervals.length === 0) {
    return [{ start: 0, end: wallLengthCm }];
  }

  const solids: SegmentInterval[] = [];
  let cursor = 0;

  for (const interval of openingIntervals) {
    if (interval.start < cursor) {
      issues.push({
        roomId: room.id,
        wallEdge: edge,
        openingId: interval.openingId,
        reason: "overlap"
      });
      cursor = Math.max(cursor, interval.end);
      continue;
    }

    if (interval.start > cursor) {
      solids.push({ start: cursor, end: interval.start });
    }
    cursor = Math.max(cursor, interval.end);
  }

  if (cursor < wallLengthCm) {
    solids.push({ start: cursor, end: wallLengthCm });
  }

  return solids;
}

function intervalToWallSegment(
  room: Room,
  edgeInfo: EdgeComputation,
  interval: SegmentInterval,
  segmentIndex: number
): WallSegment | null {
  const lengthCm = interval.end - interval.start;
  if (lengthCm <= 0) return null;

  const { wallSpec, edge } = edgeInfo;
  const thicknessCm = wallSpec.thickness;
  const heightCm = wallSpec.height;
  const localCenter = (interval.start + interval.end) / 2;

  let centerXcm = 0;
  let centerZcm = 0;
  let rotationY = 0;

  if (edge === "north") {
    centerXcm = room.x + localCenter;
    centerZcm = room.y - thicknessCm / 2;
    rotationY = 0;
  } else if (edge === "south") {
    centerXcm = room.x + localCenter;
    centerZcm = room.y + room.height + thicknessCm / 2;
    rotationY = 0;
  } else if (edge === "west") {
    centerXcm = room.x - thicknessCm / 2;
    centerZcm = room.y + localCenter;
    rotationY = Math.PI / 2;
  } else {
    centerXcm = room.x + room.width + thicknessCm / 2;
    centerZcm = room.y + localCenter;
    rotationY = Math.PI / 2;
  }

  return {
    id: `${room.id}-${edgeInfo.wallSpec.id}-${segmentIndex}`,
    roomId: room.id,
    edge,
    sourceWallId: edgeInfo.wallSpec.id,
    size: {
      length: lengthCm * CM_TO_M,
      height: heightCm * CM_TO_M,
      thickness: thicknessCm * CM_TO_M
    },
    center: {
      x: centerXcm * CM_TO_M,
      y: (heightCm * CM_TO_M) / 2,
      z: centerZcm * CM_TO_M
    },
    rotationY
  };
}

function openingToInterval(opening: Opening): OpeningInterval | null {
  if (opening.width <= 0) return null;
  return {
    openingId: opening.id,
    start: opening.offset,
    end: opening.offset + opening.width
  };
}

export function computePlanBoundsMeters(plan: FloorPlan): {
  minX: number;
  minZ: number;
  maxX: number;
  maxZ: number;
  width: number;
  depth: number;
  centerX: number;
  centerZ: number;
} {
  if (plan.rooms.length === 0) {
    return { minX: 0, minZ: 0, maxX: 0, maxZ: 0, width: 0, depth: 0, centerX: 0, centerZ: 0 };
  }

  let minX = Number.POSITIVE_INFINITY;
  let minZ = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxZ = Number.NEGATIVE_INFINITY;

  for (const room of plan.rooms) {
    minX = Math.min(minX, room.x * CM_TO_M);
    minZ = Math.min(minZ, room.y * CM_TO_M);
    maxX = Math.max(maxX, (room.x + room.width) * CM_TO_M);
    maxZ = Math.max(maxZ, (room.y + room.height) * CM_TO_M);
  }

  const width = maxX - minX;
  const depth = maxZ - minZ;

  return {
    minX,
    minZ,
    maxX,
    maxZ,
    width,
    depth,
    centerX: minX + width / 2,
    centerZ: minZ + depth / 2
  };
}
