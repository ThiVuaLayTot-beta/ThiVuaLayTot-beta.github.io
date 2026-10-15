from playwright.sync_api import sync_playwright
import time

def verify_play():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1280, "height": 800})

        # Navigate to local server
        page.goto('http://127.0.0.1:4000/play/')

        # Wait for iframe to load slightly
        time.sleep(2)

        # Take a screenshot
        page.screenshot(path="play_page_verify.png", full_page=True)
        browser.close()

if __name__ == '__main__':
    verify_play()
