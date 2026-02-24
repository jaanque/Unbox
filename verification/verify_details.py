from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    try:
        # Navigate to the home page
        print("Navigating to home page...")
        page.goto("http://localhost:8081", timeout=60000)

        # Wait for any offer card to be visible
        print("Waiting for offers...")
        # Assuming the text "Nuevas ofertas" or "Terminan pronto" is visible
        expect(page.get_by_text("Nuevas ofertas").first).to_be_visible(timeout=30000)

        # Click the first available offer card (any TouchableOpacity with an image inside generally, or just by text if we knew it)
        # We can find an image and click its parent
        print("Clicking an offer...")
        page.locator("img").nth(1).click() # Click the second image (first might be header icon?)
        # Or better, look for a price text which is unique to cards
        # page.get_by_text("€").first.click()

        # Wait for navigation
        print("Waiting for details page...")
        page.wait_for_timeout(3000)

        # Check for elements on the details page
        # "Precio total" label
        expect(page.get_by_text("Precio total")).to_be_visible()
        # "Reservar ahora" button
        expect(page.get_by_text("Reservar ahora")).to_be_visible()

        print("Taking screenshot of details page...")
        page.screenshot(path="/home/jules/verification/offer_details.png")

    except Exception as e:
        print(f"Error: {e}")
        page.screenshot(path="/home/jules/verification/error_details.png")
        raise e
    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
