import type { Rect } from "./types";

function snapWithCandidates(value: number, candidates: number[], tolerance: number): number {
  let best = value;
  let minDistance = Number.POSITIVE_INFINITY;
  for (const candidate of candidates) {
    const distance = Math.abs(candidate - value);
    if (distance <= tolerance && distance < minDistance) {
      minDistance = distance;
      best = candidate;
    }
  }
  return best;
}

export function snapToGrid(value: number, gridCm: number): number {
  if (gridCm <= 0) {
    return value;
  }
  return Math.round(value / gridCm) * gridCm;
}

export function snapRoomRect(
  next: Rect,
  others: Rect[],
  gridCm: number,
  toleranceCm: number
): Rect {
  const candidateX = [snapToGrid(next.x, gridCm)];
  const candidateY = [snapToGrid(next.y, gridCm)];
  const candidateRight = [snapToGrid(next.x + next.width, gridCm)];
  const candidateBottom = [snapToGrid(next.y + next.height, gridCm)];

  for (const room of others) {
    candidateX.push(room.x, room.x + room.width, room.x + room.width / 2 - next.width / 2);
    candidateY.push(room.y, room.y + room.height, room.y + room.height / 2 - next.height / 2);
    candidateRight.push(room.x, room.x + room.width, room.x + room.width / 2 + next.width / 2);
    candidateBottom.push(room.y, room.y + room.height, room.y + room.height / 2 + next.height / 2);
  }

  const snappedX = snapWithCandidates(next.x, candidateX, toleranceCm);
  const snappedY = snapWithCandidates(next.y, candidateY, toleranceCm);
  const snappedRight = snapWithCandidates(next.x + next.width, candidateRight, toleranceCm);
  const snappedBottom = snapWithCandidates(next.y + next.height, candidateBottom, toleranceCm);

  return {
    x: snappedX,
    y: snappedY,
    width: Math.max(1, snappedRight - snappedX),
    height: Math.max(1, snappedBottom - snappedY)
  };
}

