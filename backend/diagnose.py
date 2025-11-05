from app import app as flask_app  # Import your Flask app instance


def diagnose_routes():
    """Prints all URL routes registered in the Flask application."""
    print("-" * 50)
    print("FLASK ROUTE DIAGNOSTIC")
    print("-" * 50)
    found_api_v1_plant = False

    # Iterate through all the rules Flask has defined for URL routing
    for rule in flask_app.url_map.iter_rules():
        route_string = (
            f"Endpoint: {rule.endpoint} | "
            f"Methods: {rule.methods} | "
            f"Path: {rule.rule}"
        )
        print(route_string)

        # Check specifically for the route we are interested in
        if rule.rule == '/api/v1/plants' and 'GET' in rule.methods:
            found_api_v1_plant = True

    print("-" * 50)
    if found_api_v1_plant:
        print("SUCCESS: Found route /api/v1/plants")
    else:
        print("Could not find route /api/v1/plants. Route not registered.")
        print(" Possible causes: Failed import in app.py")


if __name__ == '__main__':
    diagnose_routes()
