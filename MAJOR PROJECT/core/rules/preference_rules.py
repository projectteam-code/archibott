"""
preference_rules.py

Applies user preferences to layout.
"""


def apply_preferences(layout, preferences):
    """
    Input:
        layout (dict) - base layout
        preferences (dict) - user wishes

    Output:
        dict - updated layout
    """

    new_layout = layout.copy()

    for floor in new_layout["floors"]:
        rooms = floor["rooms"]

        # Kitchen at back
        if preferences.get("kitchen_position") == "back":
            for room in rooms:
                if room["name"] == "kitchen":
                    room["y"] = max(r["y"] for r in rooms) + 2 
                    """
                        So system does:

                            *)Find last room

                            *)Go behind it

                            *)Put kitchen there
                    """

        # Attached bathroom
        if preferences.get("attached_bathroom"):
            for room in rooms:
                if "bedroom" in room["name"]:
                    room["attached_bath"] = True

        # Big sitout
        if preferences.get("big_sitout"):
            rooms.append({
                "name": "sitout",
                "x": 0,
                "y": -6,
                "width": 12,
                "height": 6
            })

        # More windows
        if preferences.get("more_windows"):
            for room in rooms:
                room["windows"] = room.get("windows", 1) + 1

    return new_layout