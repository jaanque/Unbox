from playwright.sync_api import sync_playwright, expect

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Using a mobile viewport to simulate the app look
        context = browser.new_context(
            viewport={'width': 390, 'height': 844},
            user_agent='Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
        )
        page = context.new_page()

        try:
            # 1. Go to the app
            print("Navigating to app...")
            page.goto("http://localhost:8081")

            # Wait for header
            print("Waiting for header...")
            header_label = page.get_by_text("Entregar ahora")
            header_label.wait_for()

            print("Taking screenshot of initial state (should be Pickup mode)...")
            page.screenshot(path="/home/jules/verification/header_initial.png")

            # Check if "Recogida en tienda" is visible in the header
            pickup_text = page.locator("text=Recogida en tienda").first
            if pickup_text.is_visible():
                print("SUCCESS: 'Recogida en tienda' text is visible initially.")
            else:
                print("FAILURE: 'Recogida en tienda' text is NOT visible initially.")

            # 2. Open Bottom Sheet and select Current Location
            print("Opening Bottom Sheet...")
            header_label.click()

            print("Waiting for Bottom Sheet options...")
            current_location_option = page.get_by_text("Ubicación actual")
            current_location_option.wait_for()

            print("Selecting 'Ubicación actual'...")
            current_location_option.click()

            # Allow time for sheet close and state update
            page.wait_for_timeout(2000)

            print("Taking screenshot after switching to Current Location...")
            page.screenshot(path="/home/jules/verification/header_current_location.png")

            # Verify text changed. It should be "Cargando ubicación..." or an address or "Dirección no encontrada"
            # We can check if "Recogida en tienda" is NO LONGER visible in header (it might still be in bottom sheet if hidden)
            # The header text should change.

            # Since geolocation is mocked or fails in headless without permission prompt handling,
            # we expect "Cargando ubicación..." or "Permiso de ubicación denegado" or "Error..."

            # Let's check for any text in the header area.
            # We can find the element by the "Entregar ahora" label's parent or sibling.

            # For now, just screenshot is enough for visual inspection.

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="/home/jules/verification/header_error.png")
        finally:
            browser.close()

if __name__ == "__main__":
    run()
