import dynamic from "next/dynamic";

const ViewerContainer = dynamic(
  () => import("@/features/floorplan/components/ViewerContainer").then((module) => module.ViewerContainer),
  { ssr: false }
);

export default function HomePage() {
  return (
    <main className="min-h-screen p-4 md:p-8">
      <section className="mx-auto max-w-[1440px] space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Archivision AI - Phase 3</h1>
        <p className="text-sm text-slate-600">
          Canonical FloorPlan JSON powers synchronized 2D/3D views with interactive Phase 3 editing.
        </p>
      </section>
      <ViewerContainer />
    </main>
  );
}
