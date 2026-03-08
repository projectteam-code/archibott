import { fireEvent, render, screen } from "@testing-library/react";
import { ViewerContainer } from "@/features/floorplan/components/ViewerContainer";

vi.mock("@/features/floorplan/components/Plan2DView", () => ({
  Plan2DView: ({ plan }: { plan: { rooms: unknown[] } }) => (
    <div data-testid="mock-2d">2D rooms: {plan.rooms.length}</div>
  )
}));

vi.mock("@/features/floorplan/components/Plan3DView", () => ({
  Plan3DView: ({ segments }: { segments: unknown[] }) => (
    <div data-testid="mock-3d">3D segments: {segments.length}</div>
  )
}));

describe("ViewerContainer", () => {
  it("feeds synchronized plan state to both views", () => {
    render(<ViewerContainer />);

    expect(screen.getByTestId("mock-2d")).toHaveTextContent("2D rooms:");
    expect(screen.getByTestId("mock-3d")).toHaveTextContent("3D segments:");

    const editor = screen.getByLabelText("floorplan-json") as HTMLTextAreaElement;
    const nextPlan = {
      id: "new-plan",
      name: "One Room",
      version: "1.0.0",
      units: "cm",
      rooms: [
        {
          id: "r1",
          type: "bedroom",
          x: 0,
          y: 0,
          width: 300,
          height: 300,
          walls: [
            { id: "r1-n", edge: "north", thickness: 20, height: 300, connections: [{ kind: "corner" }] },
            { id: "r1-e", edge: "east", thickness: 20, height: 300, connections: [{ kind: "corner" }] },
            { id: "r1-s", edge: "south", thickness: 20, height: 300, connections: [{ kind: "corner" }] },
            { id: "r1-w", edge: "west", thickness: 20, height: 300, connections: [{ kind: "corner" }] }
          ],
          openings: []
        }
      ]
    };

    fireEvent.change(editor, { target: { value: JSON.stringify(nextPlan, null, 2) } });
    fireEvent.click(screen.getByRole("button", { name: "Apply JSON" }));

    expect(screen.getByTestId("mock-2d")).toHaveTextContent("2D rooms: 1");
    expect(screen.getByTestId("mock-3d")).toHaveTextContent("3D segments: 4");
  });
});
