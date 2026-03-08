"use client";

import { Fragment, useMemo } from "react";
import { Group, Layer, Line, Rect, Stage, Text } from "react-konva";
import type { KonvaEventObject } from "konva/lib/Node";
import type { FloorPlan, Opening, Room } from "../types";
import type { EditorSelection, Rect as RoomRect, ValidationIssue } from "../editor/types";

interface Plan2DViewProps {
  plan: FloorPlan;
  selection: EditorSelection;
  validationIssues: ValidationIssue[];
  onSelectionChange: (selection: EditorSelection) => void;
  onRoomMove: (roomId: string, nextX: number, nextY: number) => void;
  onRoomResize: (roomId: string, nextRect: RoomRect) => void;
  onOpeningMove: (roomId: string, openingId: string, nextOffset: number) => void;
  width?: number;
  height?: number;
}

const VIEW_PADDING = 24;
const HANDLE_SIZE = 10;

export function Plan2DView({
  plan,
  selection,
  validationIssues,
  onSelectionChange,
  onRoomMove,
  onRoomResize,
  onOpeningMove,
  width = 720,
  height = 560
}: Plan2DViewProps) {
  const { scale, minX, minY } = useMemo(() => {
    if (plan.rooms.length === 0) {
      return { scale: 1, minX: 0, minY: 0 };
    }
    let minRoomX = Number.POSITIVE_INFINITY;
    let minRoomY = Number.POSITIVE_INFINITY;
    let maxRoomX = Number.NEGATIVE_INFINITY;
    let maxRoomY = Number.NEGATIVE_INFINITY;
    for (const room of plan.rooms) {
      minRoomX = Math.min(minRoomX, room.x);
      minRoomY = Math.min(minRoomY, room.y);
      maxRoomX = Math.max(maxRoomX, room.x + room.width);
      maxRoomY = Math.max(maxRoomY, room.y + room.height);
    }
    const contentWidth = Math.max(1, maxRoomX - minRoomX);
    const contentHeight = Math.max(1, maxRoomY - minRoomY);
    const sx = (width - VIEW_PADDING * 2) / contentWidth;
    const sy = (height - VIEW_PADDING * 2) / contentHeight;
    return { scale: Math.min(sx, sy), minX: minRoomX, minY: minRoomY };
  }, [height, plan.rooms, width]);

  const toCanvasX = (xCm: number) => (xCm - minX) * scale + VIEW_PADDING;
  const toCanvasY = (yCm: number) => (yCm - minY) * scale + VIEW_PADDING;
  const fromCanvasX = (xPx: number) => (xPx - VIEW_PADDING) / scale + minX;
  const fromCanvasY = (yPx: number) => (yPx - VIEW_PADDING) / scale + minY;

  const roomIssueSet = new Set(validationIssues.filter((issue) => issue.roomId).map((issue) => issue.roomId));
  const openingIssueSet = new Set(
    validationIssues.filter((issue) => issue.openingId).map((issue) => `${issue.roomId}::${issue.openingId}`)
  );

  return (
    <div className="rounded-xl border border-slate-300 bg-white p-2">
      <div className="mb-2 flex items-center justify-between text-xs text-slate-600">
        <span>2D Plan</span>
        <span data-testid="plan2d-meta">
          {plan.rooms.length} rooms - units: {plan.units}
        </span>
      </div>
      <Stage width={width} height={height}>
        <Layer>
          {plan.rooms.map((room) => {
            const x = toCanvasX(room.x);
            const y = toCanvasY(room.y);
            const roomWidth = room.width * scale;
            const roomHeight = room.height * scale;
            const isOutdoor = room.type === "balcony" || room.type === "terrace";
            const isSelectedRoom = selection.kind === "room" && selection.roomId === room.id;
            const hasRoomIssue = roomIssueSet.has(room.id);

            return (
              <Fragment key={room.id}>
                <Rect
                  key={`${room.id}-rect`}
                  x={x}
                  y={y}
                  width={roomWidth}
                  height={roomHeight}
                  stroke={hasRoomIssue ? "#dc2626" : isSelectedRoom ? "#0369a1" : "#0f172a"}
                  strokeWidth={isSelectedRoom ? 3 : 2}
                  dash={isOutdoor ? [8, 5] : undefined}
                  fill={isOutdoor ? "rgba(59,130,246,0.06)" : "rgba(15,23,42,0.03)"}
                  draggable
                  onMouseDown={() => onSelectionChange({ kind: "room", roomId: room.id })}
                  onDragEnd={(event) => {
                    onRoomMove(room.id, fromCanvasX(event.target.x()), fromCanvasY(event.target.y()));
                  }}
                />
                <Text
                  key={`${room.id}-label`}
                  x={x + 6}
                  y={y + 6}
                  fontSize={12}
                  fontStyle="bold"
                  fill="#0f172a"
                  text={`${room.type.toUpperCase()} ${room.width}x${room.height}`}
                />
                {isSelectedRoom ? renderResizeHandles(room, scale, toCanvasX, toCanvasY, fromCanvasX, fromCanvasY, onRoomResize) : null}
                {room.openings.map((opening) => {
                  const openingKey = `${room.id}::${opening.id}`;
                  return drawOpeningSymbol(
                    room,
                    opening,
                    scale,
                    toCanvasX,
                    toCanvasY,
                    fromCanvasX,
                    fromCanvasY,
                    selection.kind === "opening" &&
                      selection.roomId === room.id &&
                      selection.openingId === opening.id,
                    openingIssueSet.has(openingKey),
                    onSelectionChange,
                    onOpeningMove
                  );
                })}
              </Fragment>
            );
          })}
        </Layer>
      </Stage>
    </div>
  );
}

function drawOpeningSymbol(
  room: Room,
  opening: Opening,
  scale: number,
  toCanvasX: (xCm: number) => number,
  toCanvasY: (yCm: number) => number,
  fromCanvasX: (xPx: number) => number,
  fromCanvasY: (yPx: number) => number,
  isSelected: boolean,
  hasIssue: boolean,
  onSelectionChange: (selection: EditorSelection) => void,
  onOpeningMove: (roomId: string, openingId: string, nextOffset: number) => void
) {
  const openingColor = hasIssue ? "#dc2626" : isSelected ? "#0ea5e9" : opening.kind === "door" ? "#b45309" : "#0284c7";
  const lineWidth = isSelected ? 4 : opening.kind === "door" ? 3 : 2;
  const start = opening.offset;
  const end = opening.offset + opening.width;

  if (opening.wallEdge === "north" || opening.wallEdge === "south") {
    const yCm = opening.wallEdge === "north" ? room.y : room.y + room.height;
    const xPx = toCanvasX(room.x + start);
    const yPx = toCanvasY(yCm);
    const widthPx = (end - start) * scale;
    return (
      <Group
        key={`${room.id}-${opening.id}`}
        x={xPx}
        y={yPx}
        draggable
        dragBoundFunc={(pos) => ({ x: pos.x, y: yPx })}
        onMouseDown={() => onSelectionChange({ kind: "opening", roomId: room.id, openingId: opening.id })}
        onDragEnd={(event: KonvaEventObject<DragEvent>) => {
          const nextOffset = fromCanvasX(event.target.x()) - room.x;
          onOpeningMove(room.id, opening.id, nextOffset);
        }}
      >
        <Line
          points={[0, 0, widthPx, 0]}
          stroke={openingColor}
          strokeWidth={lineWidth}
          dash={opening.kind === "window" ? [4, 4] : undefined}
        />
      </Group>
    );
  }

  const xCm = opening.wallEdge === "west" ? room.x : room.x + room.width;
  const xPx = toCanvasX(xCm);
  const yPx = toCanvasY(room.y + start);
  const heightPx = (end - start) * scale;
  return (
    <Group
      key={`${room.id}-${opening.id}`}
      x={xPx}
      y={yPx}
      draggable
      dragBoundFunc={(pos) => ({ x: xPx, y: pos.y })}
      onMouseDown={() => onSelectionChange({ kind: "opening", roomId: room.id, openingId: opening.id })}
      onDragEnd={(event: KonvaEventObject<DragEvent>) => {
        const nextOffset = fromCanvasY(event.target.y()) - room.y;
        onOpeningMove(room.id, opening.id, nextOffset);
      }}
    >
      <Line
        points={[0, 0, 0, heightPx]}
        stroke={openingColor}
        strokeWidth={lineWidth}
        dash={opening.kind === "window" ? [4, 4] : undefined}
      />
    </Group>
  );
}

function renderResizeHandles(
  room: Room,
  scale: number,
  toCanvasX: (xCm: number) => number,
  toCanvasY: (yCm: number) => number,
  fromCanvasX: (xPx: number) => number,
  fromCanvasY: (yPx: number) => number,
  onRoomResize: (roomId: string, nextRect: RoomRect) => void
) {
  const left = toCanvasX(room.x);
  const right = toCanvasX(room.x + room.width);
  const top = toCanvasY(room.y);
  const bottom = toCanvasY(room.y + room.height);

  const handles: Array<{ id: "nw" | "ne" | "sw" | "se"; x: number; y: number }> = [
    { id: "nw", x: left, y: top },
    { id: "ne", x: right, y: top },
    { id: "sw", x: left, y: bottom },
    { id: "se", x: right, y: bottom }
  ];

  return handles.map((handle) => (
    <Rect
      key={`${room.id}-handle-${handle.id}`}
      x={handle.x - HANDLE_SIZE / 2}
      y={handle.y - HANDLE_SIZE / 2}
      width={HANDLE_SIZE}
      height={HANDLE_SIZE}
      fill="#0369a1"
      stroke="#ffffff"
      strokeWidth={1}
      draggable
        onDragEnd={(event) => {
          const handleX = fromCanvasX(event.target.x() + HANDLE_SIZE / 2);
          const handleY = fromCanvasY(event.target.y() + HANDLE_SIZE / 2);
        const roomRight = room.x + room.width;
        const roomBottom = room.y + room.height;

        let nextRect: RoomRect = { x: room.x, y: room.y, width: room.width, height: room.height };
        if (handle.id === "nw") {
          nextRect = { x: handleX, y: handleY, width: roomRight - handleX, height: roomBottom - handleY };
        } else if (handle.id === "ne") {
          nextRect = { x: room.x, y: handleY, width: handleX - room.x, height: roomBottom - handleY };
        } else if (handle.id === "sw") {
          nextRect = { x: handleX, y: room.y, width: roomRight - handleX, height: handleY - room.y };
        } else if (handle.id === "se") {
          nextRect = { x: room.x, y: room.y, width: handleX - room.x, height: handleY - room.y };
        }

        onRoomResize(room.id, {
          x: nextRect.x,
          y: nextRect.y,
          width: Math.max(1, nextRect.width),
          height: Math.max(1, nextRect.height)
        });
      }}
    />
  ));
}
