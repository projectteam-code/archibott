import type { FloorPlan } from "../types";

export type EditorSelection =
  | { kind: "none" }
  | { kind: "room"; roomId: string }
  | { kind: "opening"; roomId: string; openingId: string };

export type ValidationIssueCode =
  | "room_min_size"
  | "room_overlap"
  | "opening_min_width"
  | "opening_out_of_bounds";

export interface ValidationIssue {
  code: ValidationIssueCode;
  message: string;
  roomId?: string;
  openingId?: string;
}

export interface HistoryState {
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
}

export interface PlanHistory {
  past: FloorPlan[];
  present: FloorPlan;
  future: FloorPlan[];
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const EDITOR_DEFAULTS = {
  gridCm: 10,
  snapToleranceCm: 8,
  minRoomSizeCm: 200,
  minOpeningWidthCm: 70,
  maxHistoryEntries: 100
} as const;

