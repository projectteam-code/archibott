import json
import os


def load_template(template_name):

    base_path = os.path.dirname(__file__) #to get current directory(in order to work at any pc)
    template_path = os.path.join(base_path, "templates", template_name) #for portability in order to work in any os 

    with open(template_path, "r") as file:
        data = json.load(file)

    return data