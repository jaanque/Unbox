import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context()
        page = await context.new_page()

        print("Opening app...")
        await page.goto("http://localhost:8081")

        try:
            await page.wait_for_selector("text=Explorar", timeout=10000)
            print("App loaded.")
        except:
            print("Timeout loading app.")
            await page.screenshot(path="app_load_error_profile.png")
            await browser.close()
            return

        # Navigate to Profile
        print("Navigating to Profile...")
        try:
             # Assuming bottom tab navigation works by text or role.
             # On web, tabs often have text labels.
            await page.click("text=Perfil")
            await asyncio.sleep(1)
        except Exception as e:
            print(f"Failed to navigate to Profile: {e}")
            await page.screenshot(path="profile_nav_error.png")
            await browser.close()
            return

        print("Verifying Profile UI...")
        try:
            # Check for "Bienvenido a Unbox" (Logged Out state default)
            if await page.is_visible("text=Bienvenido a Unbox"):
                print("Found 'Bienvenido a Unbox' text.")
                await page.screenshot(path="profile_logged_out.png")

                # Check for buttons
                if await page.is_visible("text=Iniciar Sesión"):
                    print("Found 'Iniciar Sesión' button.")
                else:
                    print("Missing 'Iniciar Sesión' button.")

                if await page.is_visible("text=Crear cuenta"):
                    print("Found 'Crear cuenta' button.")
                else:
                    print("Missing 'Crear cuenta' button.")

                # Check for feature icons/text
                if await page.is_visible("text=Ofertas exclusivas"):
                    print("Found feature text.")
            else:
                # Maybe logged in?
                if await page.is_visible("text=Cerrar Sesión"):
                    print("User is logged in. Verifying logged in UI.")
                    await page.screenshot(path="profile_logged_in.png")
                else:
                    print("Could not identify Profile state.")
                    await page.screenshot(path="profile_unknown_state.png")

        except Exception as e:
            print(f"Error during verification: {e}")
            await page.screenshot(path="verification_error_profile.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
