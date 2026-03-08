"use client";

import { useEffect, useMemo, useState } from "react";
import { computeWallGeometry } from "../geometry";
import { SAMPLE_FLOOR_PLAN } from "../samplePlan";
import type { FloorPlan } from "../types";
import { parseFloorPlan } from "../validation";
import { moveOpening, moveRoom, resizeRoom, updateOpeningWidth } from "../editor/commands";
import { validatePlanConstraints } from "../editor/constraints";
import { commitPlanHistory, createPlanHistory, redoPlanHistory, undoPlanHistory } from "../editor/history";
import { EDITOR_DEFAULTS, type EditorSelection, type HistoryState, type Rect, type ValidationIssue } from "../editor/types";
import { Plan2DView } from "./Plan2DView";
import { Plan3DView } from "./Plan3DView";
import { PromptPanel } from "./PromptPanel";

export function ViewerContainer() {
  const [history, setHistory] = useState(() => createPlanHistory(SAMPLE_FLOOR_PLAN));
  const [selection, setSelection] = useState<EditorSelection>({ kind: "none" });
  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([]);
  const [draftJson, setDraftJson] = useState<string>(() => JSON.stringify(history.present, null, 2));
  const [error, setError] = useState<string | null>(null);

  const plan = history.present;
  const wallGeometry = useMemo(() => computeWallGeometry(plan), [plan]);

  const commitCandidatePlan = (nextPlan: FloorPlan) => {
    const issues = validatePlanConstraints(nextPlan, {
      minRoomSizeCm: EDITOR_DEFAULTS.minRoomSizeCm,
      minOpeningWidthCm: EDITOR_DEFAULTS.minOpeningWidthCm
    });
    if (issues.length > 0) {
      setValidationIssues(issues);
      setError(issues[0].message);
      return false;
    }

    setHistory((previous) => commitPlanHistory(previous, nextPlan, EDITOR_DEFAULTS.maxHistoryEntries));
    setValidationIssues([]);
    setError(null);
    return true;
  };

  const setPlanAsBase = (nextPlan: FloorPlan) => {
    const issues = validatePlanConstraints(nextPlan, {
      minRoomSizeCm: EDITOR_DEFAULTS.minRoomSizeCm,
      minOpeningWidthCm: EDITOR_DEFAULTS.minOpeningWidthCm
    });
    setHistory(createPlanHistory(nextPlan));
    setValidationIssues(issues);
    setSelection({ kind: "none" });
  };

  const handleRoomMove = (roomId: string, nextX: number, nextY: number) => {
    const nextPlan = moveRoom(plan, roomId, nextX, nextY, {
      gridCm: EDITOR_DEFAULTS.gridCm,
      toleranceCm: EDITOR_DEFAULTS.snapToleranceCm
    });
    commitCandidatePlan(nextPlan);
  };

  const handleRoomResize = (roomId: string, nextRect: Rect) => {
    const nextPlan = resizeRoom(plan, roomId, nextRect, {
      gridCm: EDITOR_DEFAULTS.gridCm,
      toleranceCm: EDITOR_DEFAULTS.snapToleranceCm
    });
    commitCandidatePlan(nextPlan);
  };

  const handleOpeningMove = (roomId: string, openingId: string, nextOffset: number) => {
    const nextPlan = moveOpening(plan, roomId, openingId, nextOffset, EDITOR_DEFAULTS.gridCm);
    commitCandidatePlan(nextPlan);
  };

  const historyState: HistoryState = useMemo(
    () => ({
      canUndo: history.past.length > 0,
      canRedo: history.future.length > 0,
      undo: () => {
        setHistory((previous) => undoPlanHistory(previous));
        setSelection({ kind: "none" });
      },
      redo: () => {
        setHistory((previous) => redoPlanHistory(previous));
        setSelection({ kind: "none" });
      }
    }),
    [history.future.length, history.past.length]
  );

  useEffect(() => {
    setDraftJson(JSON.stringify(plan, null, 2));
  }, [plan]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if ((event.ctrlKey || event.metaKey) && key === "z") {
        event.preventDefault();
        if (event.shiftKey) {
          historyState.redo();
        } else {
          historyState.undo();
        }
        return;
      }
      if ((event.ctrlKey || event.metaKey) && key === "y") {
        event.preventDefault();
        historyState.redo();
        return;
      }
      if (event.key === "Escape") {
        setSelection({ kind: "none" });
        return;
      }

      const delta = event.shiftKey ? 1 : EDITOR_DEFAULTS.gridCm;
      if (selection.kind === "room") {
        const room = plan.rooms.find((item) => item.id === selection.roomId);
        if (!room) {
          return;
        }

        if (event.key === "ArrowLeft") {
          event.preventDefault();
          handleRoomMove(selection.roomId, room.x - delta, room.y);
        }
        if (event.key === "ArrowRight") {
          event.preventDefault();
          handleRoomMove(selection.roomId, room.x + delta, room.y);
        }
        if (event.key === "ArrowUp") {
          event.preventDefault();
          handleRoomMove(selection.roomId, room.x, room.y - delta);
        }
        if (event.key === "ArrowDown") {
          event.preventDefault();
          handleRoomMove(selection.roomId, room.x, room.y + delta);
        }
      }

      if (selection.kind === "opening") {
        const room = plan.rooms.find((item) => item.id === selection.roomId);
        const opening = room?.openings.find((item) => item.id === selection.openingId);
        if (!opening) {
          return;
        }

        if (["ArrowLeft", "ArrowUp"].includes(event.key)) {
          event.preventDefault();
          handleOpeningMove(selection.roomId, selection.openingId, opening.offset - delta);
        }
        if (["ArrowRight", "ArrowDown"].includes(event.key)) {
          event.preventDefault();
          handleOpeningMove(selection.roomId, selection.openingId, opening.offset + delta);
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [historyState, plan.rooms, selection]);

  const applyDraft = () => {
    try {
      const parsed = parseFloorPlan(JSON.parse(draftJson));
      setPlanAsBase(parsed);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse plan JSON.");
    }
  };

  const resetDraft = () => {
    setPlanAsBase(SAMPLE_FLOOR_PLAN);
    setError(null);
  };

  const selectedRoom = selection.kind === "room" ? plan.rooms.find((room) => room.id === selection.roomId) : null;
  const selectedOpening =
    selection.kind === "opening"
      ? plan.rooms
          .find((room) => room.id === selection.roomId)
          ?.openings.find((opening) => opening.id === selection.openingId)
      : null;

  const updateSelectedRoom = (field: keyof Rect, value: number) => {
    if (!selectedRoom || Number.isNaN(value)) {
      return;
    }
    const nextRect: Rect = {
      x: field === "x" ? value : selectedRoom.x,
      y: field === "y" ? value : selectedRoom.y,
      width: field === "width" ? value : selectedRoom.width,
      height: field === "height" ? value : selectedRoom.height
    };
    handleRoomResize(selectedRoom.id, nextRect);
  };

  const updateSelectedOpening = (field: "offset" | "width", value: number) => {
    if (!selectedOpening || selection.kind !== "opening" || Number.isNaN(value)) {
      return;
    }
    if (field === "offset") {
      handleOpeningMove(selection.roomId, selection.openingId, value);
      return;
    }
    const nextPlan = updateOpeningWidth(plan, selection.roomId, selection.openingId, value, EDITOR_DEFAULTS.gridCm);
    commitCandidatePlan(nextPlan);
  };

  return (
    <section className="mx-auto mt-4 max-w-[1440px] space-y-4">
      <PromptPanel
        onGenerated={(nextPlan) => {
          setPlanAsBase(nextPlan);
          setError(null);
        }}
      />
      <div className="rounded-xl border border-slate-300 bg-white p-3">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-medium text-slate-700">FloorPlan JSON (Source of Truth)</h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={applyDraft}
              className="rounded-md bg-slate-900 px-3 py-1.5 text-xs text-white hover:bg-slate-700"
            >
              Apply JSON
            </button>
            <button
              type="button"
              onClick={resetDraft}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100"
            >
              Reset Sample
            </button>
          </div>
        </div>
        <textarea
          value={draftJson}
          onChange={(event) => setDraftJson(event.target.value)}
          className="h-56 w-full rounded-lg border border-slate-300 bg-slate-50 p-2 font-mono text-xs text-slate-900"
          spellCheck={false}
          aria-label="floorplan-json"
        />
        <div className="mt-2 flex items-center justify-between">
          <div className="text-xs text-slate-600" data-testid="plan-meta">
            {plan.rooms.length} rooms | {wallGeometry.segments.length} wall segments | {wallGeometry.issues.length} geometry issues | {" "}
            {validationIssues.length} validation issues
          </div>
          {error ? <div className="text-xs text-red-600">{error}</div> : null}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="space-y-3">
          <Plan2DView
            plan={plan}
            selection={selection}
            validationIssues={validationIssues}
            onSelectionChange={setSelection}
            onRoomMove={handleRoomMove}
            onRoomResize={handleRoomResize}
            onOpeningMove={handleOpeningMove}
          />
          <div className="grid grid-cols-1 gap-3 rounded-xl border border-slate-300 bg-white p-3 md:grid-cols-2">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={historyState.undo}
                  disabled={!historyState.canUndo}
                  className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 enabled:hover:bg-slate-100 disabled:opacity-50"
                >
                  Undo
                </button>
                <button
                  type="button"
                  onClick={historyState.redo}
                  disabled={!historyState.canRedo}
                  className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 enabled:hover:bg-slate-100 disabled:opacity-50"
                >
                  Redo
                </button>
                <button
                  type="button"
                  onClick={() => setSelection({ kind: "none" })}
                  className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100"
                >
                  Cancel Selection
                </button>
              </div>
              <p className="text-xs text-slate-600">Arrow keys nudge by 10cm. Shift + arrow nudges by 1cm.</p>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-slate-700">Inspector</h3>
              {selectedRoom ? (
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                  <label>
                    X
                    <input
                      type="number"
                      className="mt-1 w-full rounded border border-slate-300 px-2 py-1"
                      value={selectedRoom.x}
                      onChange={(event) => updateSelectedRoom("x", Number(event.target.value))}
                    />
                  </label>
                  <label>
                    Y
                    <input
                      type="number"
                      className="mt-1 w-full rounded border border-slate-300 px-2 py-1"
                      value={selectedRoom.y}
                      onChange={(event) => updateSelectedRoom("y", Number(event.target.value))}
                    />
                  </label>
                  <label>
                    Width
                    <input
                      type="number"
                      className="mt-1 w-full rounded border border-slate-300 px-2 py-1"
                      value={selectedRoom.width}
                      onChange={(event) => updateSelectedRoom("width", Number(event.target.value))}
                    />
                  </label>
                  <label>
                    Height
                    <input
                      type="number"
                      className="mt-1 w-full rounded border border-slate-300 px-2 py-1"
                      value={selectedRoom.height}
                      onChange={(event) => updateSelectedRoom("height", Number(event.target.value))}
                    />
                  </label>
                </div>
              ) : null}
              {selectedOpening ? (
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                  <label>
                    Offset
                    <input
                      type="number"
                      className="mt-1 w-full rounded border border-slate-300 px-2 py-1"
                      value={selectedOpening.offset}
                      onChange={(event) => updateSelectedOpening("offset", Number(event.target.value))}
                    />
                  </label>
                  <label>
                    Width
                    <input
                      type="number"
                      className="mt-1 w-full rounded border border-slate-300 px-2 py-1"
                      value={selectedOpening.width}
                      onChange={(event) => updateSelectedOpening("width", Number(event.target.value))}
                    />
                  </label>
                </div>
              ) : null}
              {!selectedRoom && !selectedOpening ? (
                <p className="mt-2 text-xs text-slate-500">Select a room or opening to edit properties.</p>
              ) : null}
            </div>
          </div>
          <div className="rounded-xl border border-slate-300 bg-white p-3">
            <h3 className="mb-2 text-xs font-semibold text-slate-700">Validation</h3>
            {validationIssues.length === 0 ? (
              <p className="text-xs text-emerald-700">No validation issues.</p>
            ) : (
              <ul className="space-y-1 text-xs text-red-700">
                {validationIssues.map((issue, index) => (
                  <li key={`${issue.code}-${issue.roomId ?? "none"}-${issue.openingId ?? "none"}-${index}`}>
                    {issue.message}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <Plan3DView plan={plan} segments={wallGeometry.segments} />
      </div>
    </section>
  );
}
