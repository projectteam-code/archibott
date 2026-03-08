"use client";

import { useState } from "react";
import type { FloorPlan } from "../types";

interface PromptPanelProps {
  onGenerated: (plan: FloorPlan) => void;
}

type DesignStyle = "modern" | "minimal" | "traditional" | "contemporary";

export function PromptPanel({ onGenerated }: PromptPanelProps) {
  const [areaSqft, setAreaSqft] = useState<number>(1200);
  const [roomCount, setRoomCount] = useState<number>(3);
  const [bathroomCount, setBathroomCount] = useState<number>(2);
  const [style, setStyle] = useState<DesignStyle>("modern");
  const [prompt, setPrompt] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const res = await fetch("/api/generate-floorplan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          areaSqft,
          roomCount,
          bathroomCount,
          style,
          prompt
        })
      });

      const json = (await res.json()) as { floorPlan?: FloorPlan; error?: string; details?: string };
      if (!res.ok || !json.floorPlan) {
        const message = json.details ? `${json.error ?? "Failed to generate floor plan."} ${json.details}` : (json.error ?? "Failed to generate floor plan.");
        throw new Error(message);
      }
      onGenerated(json.floorPlan);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate floor plan.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-300 bg-white p-3">
      <h2 className="mb-2 text-sm font-medium text-slate-700">AI Prompt Controls</h2>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <label className="text-xs text-slate-700">
          Area (sqft)
          <input
            type="number"
            min={200}
            step={10}
            value={areaSqft}
            onChange={(event) => setAreaSqft(Number(event.target.value))}
            className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5"
          />
        </label>
        <label className="text-xs text-slate-700">
          Rooms
          <input
            type="number"
            min={1}
            step={1}
            value={roomCount}
            onChange={(event) => setRoomCount(Number(event.target.value))}
            className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5"
          />
        </label>
        <label className="text-xs text-slate-700">
          Bathrooms
          <input
            type="number"
            min={0}
            step={1}
            value={bathroomCount}
            onChange={(event) => setBathroomCount(Number(event.target.value))}
            className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5"
          />
        </label>
        <label className="text-xs text-slate-700">
          Style
          <select
            value={style}
            onChange={(event) => setStyle(event.target.value as DesignStyle)}
            className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5"
          >
            <option value="modern">modern</option>
            <option value="minimal">minimal</option>
            <option value="traditional">traditional</option>
            <option value="contemporary">contemporary</option>
          </select>
        </label>
      </div>

      <label className="mt-3 block text-xs text-slate-700">
        Additional Prompt
        <textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          className="mt-1 h-20 w-full rounded-md border border-slate-300 p-2"
          placeholder="Example: Add one balcony connected to living room and prefer cross-ventilation."
        />
      </label>

      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={generate}
          disabled={isLoading}
          className="rounded-md bg-emerald-700 px-3 py-1.5 text-xs text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isLoading ? "Generating..." : "Generate Plan"}
        </button>
        {error ? <p className="text-xs text-red-600">{error}</p> : null}
      </div>
    </div>
  );
}
