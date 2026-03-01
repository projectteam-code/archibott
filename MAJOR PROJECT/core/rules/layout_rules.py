
"""
layout_rules.py

Purpose:
Decides the basic structure of the house.

Expected Input (basic_data):
{
    "plot_area_sqft": int,
    "bedrooms": int,
    "floors": int
}

Output:
{
    "area_type": "small|medium|large",
    "house_type": "XBHK_Single|XBHK_Duplex",
    "template": "template_file.json"
}
"""



# Classify plot size
def classify_area(plot_area_sqft):

    if plot_area_sqft < 800:
        return "small"

    elif plot_area_sqft < 1500:
        return "medium"

    else:
        return "large"


# Decide house category
def decide_house_type(bedrooms, floors):

    if floors > 1:
        return f"{bedrooms}BHK_Duplex"

    return f"{bedrooms}BHK_Single"


# Select template file
def choose_template(area_type, house_type):

    if area_type == "small":

        if house_type == "1BHK_Single":
            return "1bhk_compact.json"

        if house_type == "2BHK_Single":
            return "2bhk_compact.json"


    elif area_type == "medium":

        if house_type == "2BHK_Single":
            return "2bhk_standard.json"

        if house_type == "3BHK_Single":
            return "3bhk_standard.json"

        if house_type == "3BHK_Duplex":
            return "3bhk_duplex_v1.json"


    elif area_type == "large":

        if house_type == "3BHK_Single":
            return "3bhk_luxury.json"

        if house_type == "4BHK_Duplex":
            return "4bhk_luxury_duplex.json"


    return "default_template.json"


# Main function
def generate_layout(basic_data):
    plot_area = basic_data["plot_area_sqft"]
    bedrooms = basic_data["bedrooms"]
    floors = basic_data["floors"]
    #for validation if user type 600sqft and 2 floors
    

    area_type = classify_area(plot_area)
    house_type = decide_house_type(bedrooms, floors)
    template = choose_template(area_type, house_type)

    return {
        "area_type": area_type,
        "house_type": house_type,
        "template": template
    }