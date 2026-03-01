"""
validation_rules.py

Purpose:
Validates and fixes house configuration data.

Expected Input:
- house_data (dict)

Output:
- corrected house_data (dict)
"""


def validate_house_data(house_data):
    """
    Validate and auto-correct house data dynamically.
    """

    data = house_data.copy()

    plot = data.get("plot_area_sqft", 500)
    floors = data.get("floors", 1)

    # Small plot → limit floors
    if plot < 700 and floors > 1:
        data["floors"] = 1

    # Bedrooms limit
    if plot < 600 and data.get("bedrooms", 1) > 2:
        data["bedrooms"] = 2

    # Bathrooms ≤ Bedrooms
    if data.get("bathrooms", 1) > data.get("bedrooms", 1):
        data["bathrooms"] = data.get("bedrooms", 1)

    # Extra rooms scaling
    extras = ["office", "pooja", "store", "study"]

    for room in extras:
        if data.get(room, 0) > 1 and plot < 800:
            data[room] = 1

    return data