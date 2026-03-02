import matplotlib.pyplot as plt


def draw_2d_plan(layout):
    """
    Draws 2D floor plan for testing.

    Accepts BOTH formats:
    1) { "floors": [...] }
    2) { "layout_data": { "floors": [...] } }
    """

    # Handle both formats safely
    if "layout_data" in layout:
        floors = layout["layout_data"]["floors"]
    else:
        floors = layout["floors"]

    for floor in floors:

        fig, ax = plt.subplots(figsize=(8, 8))

        rooms = floor["rooms"]

        for room in rooms:

            x = room["x"]
            y = room["y"]
            w = room["w"]
            h = room["h"]
            name = room["name"]

            rect = plt.Rectangle(
                (x, y),
                w,
                h,
                fill=False,
                linewidth=2
            )

            ax.add_patch(rect)

            ax.text(
                x + w / 2,
                y + h / 2,
                name,
                ha="center",
                va="center",
                fontsize=9
            )

        ax.set_aspect("equal")
        ax.set_title(f"Floor {floor['floor_no']}")

        ax.autoscale()
        plt.axis("off")

        plt.show()