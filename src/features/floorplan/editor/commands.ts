import type { FloorPlan, Opening, Room } from "../types";
import { snapRoomRect, snapToGrid } from "./snap";
import type { Rect } from "./types";

interface SnapOptions {
  gridCm: number;
  toleranceCm: number;
}

function updateRoom(plan: FloorPlan, roomId: string, updater: (room: Room) => Room): FloorPlan {
  return {
    ...plan,
    rooms: plan.rooms.map((room) => (room.id === roomId ? updater(room) : room))
  };
}

function updateOpening(room: Room, openingId: string, updater: (opening: Opening) => Opening): Room {
  return {
    ...room,
    openings: room.openings.map((opening) => (opening.id === openingId ? updater(opening) : opening))
  };
}

export function moveRoom(
  plan: FloorPlan,
  roomId: string,
  nextX: number,
  nextY: number,
  options: SnapOptions
): FloorPlan {
  const room = plan.rooms.find((entry) => entry.id === roomId);
  if (!room) {
    return plan;
  }
  const otherRects = plan.rooms
    .filter((entry) => entry.id !== roomId)
    .map((entry) => ({ x: entry.x, y: entry.y, width: entry.width, height: entry.height }));
  const snapped = snapRoomRect(
    { x: nextX, y: nextY, width: room.width, height: room.height },
    otherRects,
    options.gridCm,
    options.toleranceCm
  );
  return updateRoom(plan, roomId, (current) => ({
    ...current,
    x: snapped.x,
    y: snapped.y
  }));
}

export function resizeRoom(
  plan: FloorPlan,
  roomId: string,
  nextRect: Rect,
  options: SnapOptions
): FloorPlan {
  const otherRects = plan.rooms
    .filter((entry) => entry.id !== roomId)
    .map((entry) => ({ x: entry.x, y: entry.y, width: entry.width, height: entry.height }));

  const snapped = snapRoomRect(nextRect, otherRects, options.gridCm, options.toleranceCm);
  return updateRoom(plan, roomId, (room) => ({
    ...room,
    x: snapped.x,
    y: snapped.y,
    width: snapped.width,
    height: snapped.height
  }));
}

export function moveOpening(
  plan: FloorPlan,
  roomId: string,
  openingId: string,
  nextOffset: number,
  gridCm: number
): FloorPlan {
  return updateRoom(plan, roomId, (room) =>
    updateOpening(room, openingId, (opening) => ({
      ...opening,
      offset: Math.max(0, snapToGrid(nextOffset, gridCm))
    }))
  );
}

export function updateOpeningWidth(
  plan: FloorPlan,
  roomId: string,
  openingId: string,
  nextWidth: number,
  gridCm: number
): FloorPlan {
  return updateRoom(plan, roomId, (room) =>
    updateOpening(room, openingId, (opening) => ({
      ...opening,
      width: Math.max(1, snapToGrid(nextWidth, gridCm))
    }))
  );
}

