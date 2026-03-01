"""
core.py

Main controller for ArchiBot system.

Flow:
Input → Validation → Layout → Preference → 2D → 3D → Output
"""

# Import modules
from rules.validation import validate_house_data
from rules.layout_rules import generate_layout
from rules.preference_rules import apply_preferences
from template_loader import load_template




def run_archibot(user_data, user_preferences):
    """
    Main function to run ArchiBot.

    Input:
        user_data (dict)       → basic house info
        user_preferences(dict)→ user wishes

    Output:
        result (dict) → file paths
    """

    print("🔹 Step 1: Validating data...")
    clean_data = validate_house_data(user_data)

    print("🔹 Step 2: Generating base layout...")
    layout = generate_layout(clean_data)

    base_layout = load_template(layout["template"])

    print("🔹 Step 3: Applying preferences...")
    final_layout = apply_preferences(base_layout, user_preferences)

    

    result = {
        
        "layout_data": final_layout
    }

    print("✅ ArchiBot finished successfully!")

    return result


# For testing only
if __name__ == "__main__":

    # Sample input (from backend)
    sample_data = {
        "plot_area_sqft": 900,
        "floors": 2,
        "bedrooms": 3,
        "bathrooms": 2,
        "kitchen": 1,
        "living": 1
    }

    sample_preferences = {
        "kitchen_position": "back",
        "attached_bathroom": True,
        "big_sitout": False,
        "more_windows": True
    }

    output = run_archibot(sample_data, sample_preferences)

    print("\nFinal Output:")
    print(output)