import type { FloorPlan, Opening, Room, WallEdge } from "../types";
import type { ValidationIssue } from "./types";

interface ConstraintOptions {
  minRoomSizeCm: number;
  minOpeningWidthCm: number;
}

const NON_HABITABLE_TYPES = new Set(["toilet", "balcony", "terrace", "utility"]);

function shouldCheckRoomMinSize(roomType: string): boolean {
  return !NON_HABITABLE_TYPES.has(roomType);
}

function wallLength(room: Room, edge: WallEdge): number {
  if (edge === "north" || edge === "south") {
    return room.width;
  }
  return room.height;
}

function intersects(a: Room, b: Room): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

function openingBoundsIssue(room: Room, opening: Opening): ValidationIssue | null {
  const length = wallLength(room, opening.wallEdge);
  if (opening.offset < 0 || opening.offset + opening.width > length) {
    return {
      code: "opening_out_of_bounds",
      roomId: room.id,
      openingId: opening.id,
      message: `Opening ${opening.id} exceeds ${opening.wallEdge} wall bounds in room ${room.id}.`
    };
  }
  return null;
}

export function validatePlanConstraints(
  plan: FloorPlan,
  options: ConstraintOptions
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const room of plan.rooms) {
    if (
      shouldCheckRoomMinSize(room.type) &&
      (room.width < options.minRoomSizeCm || room.height < options.minRoomSizeCm)
    ) {
      issues.push({
        code: "room_min_size",
        roomId: room.id,
        message: `Room ${room.id} is below minimum size ${options.minRoomSizeCm}cm x ${options.minRoomSizeCm}cm.`
      });
    }

    for (const opening of room.openings) {
      if (opening.width < options.minOpeningWidthCm) {
        issues.push({
          code: "opening_min_width",
          roomId: room.id,
          openingId: opening.id,
          message: `Opening ${opening.id} in room ${room.id} is below minimum width ${options.minOpeningWidthCm}cm.`
        });
      }
      const boundsIssue = openingBoundsIssue(room, opening);
      if (boundsIssue) {
        issues.push(boundsIssue);
      }
    }
  }

  for (let index = 0; index < plan.rooms.length; index += 1) {
    const room = plan.rooms[index];
    for (let nextIndex = index + 1; nextIndex < plan.rooms.length; nextIndex += 1) {
      const other = plan.rooms[nextIndex];
      if (intersects(room, other)) {
        issues.push({
          code: "room_overlap",
          roomId: room.id,
          message: `Rooms ${room.id} and ${other.id} overlap.`
        });
      }
    }
  }

  return issues;
}

