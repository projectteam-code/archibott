import type { FloorPlan } from "../types";
import type { PlanHistory } from "./types";

export function createPlanHistory(initial: FloorPlan): PlanHistory {
  return {
    past: [],
    present: initial,
    future: []
  };
}

export function commitPlanHistory(history: PlanHistory, next: FloorPlan, maxEntries = 100): PlanHistory {
  if (JSON.stringify(history.present) === JSON.stringify(next)) {
    return history;
  }

  const past = [...history.past, history.present];
  const boundedPast = past.length > maxEntries ? past.slice(past.length - maxEntries) : past;
  return {
    past: boundedPast,
    present: next,
    future: []
  };
}

export function undoPlanHistory(history: PlanHistory): PlanHistory {
  if (history.past.length === 0) {
    return history;
  }
  const previous = history.past[history.past.length - 1];
  return {
    past: history.past.slice(0, history.past.length - 1),
    present: previous,
    future: [history.present, ...history.future]
  };
}

export function redoPlanHistory(history: PlanHistory): PlanHistory {
  if (history.future.length === 0) {
    return history;
  }
  const next = history.future[0];
  return {
    past: [...history.past, history.present],
    present: next,
    future: history.future.slice(1)
  };
}

