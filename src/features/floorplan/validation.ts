import { z } from "zod";
import type { FloorPlan } from "./types";

const wallEdgeSchema = z.enum(["north", "east", "south", "west"]);
const openingKindSchema = z.enum(["door", "window"]);
const roomTypeSchema = z.enum([
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
]);

const wallConnectionSchema = z.object({
  toWallId: z.string().optional(),
  roomId: z.string().optional(),
  kind: z.enum(["corner", "t-junction", "cross", "none"])
});

const wallSpecSchema = z.object({
  id: z.string().min(1),
  edge: wallEdgeSchema,
  thickness: z.number().finite().positive(),
  height: z.number().finite().positive(),
  connections: z.array(wallConnectionSchema)
});

const openingSchema = z.object({
  id: z.string().min(1),
  kind: openingKindSchema,
  wallEdge: wallEdgeSchema,
  offset: z.number().finite().min(0),
  width: z.number().finite().positive(),
  sillHeight: z.number().finite().min(0).optional(),
  headHeight: z.number().finite().optional()
});

const roomSchema = z.object({
  id: z.string().min(1),
  type: roomTypeSchema,
  x: z.number().finite(),
  y: z.number().finite(),
  width: z.number().finite().positive(),
  height: z.number().finite().positive(),
  walls: z.array(wallSpecSchema).length(4),
  openings: z.array(openingSchema)
});

export const floorPlanSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  version: z.string().min(1),
  units: z.literal("cm"),
  rooms: z.array(roomSchema)
});

export function parseFloorPlan(input: unknown): FloorPlan {
  return floorPlanSchema.parse(input);
}

export function safeParseFloorPlan(input: unknown) {
  return floorPlanSchema.safeParse(input);
}
