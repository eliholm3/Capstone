# This is a mock demonstration of the image retrieval and swipe handling logic, as well as the buffer management logic.
# It simulates the database interactions using an in-memory list and uses the Wikimedia API to fetch images.

import requests
import time

# --- MOCK DATABASE (In-Memory) ---
MOCK_DB = [] # This replaces the Postgres table for testing

def mock_save_to_db(image_list):
    """Simulates saving to Postgres."""
    for img in image_list:
        # Check if ID already exists (simulating Primary Key / Unique constraint)
        if not any(item['page_id'] == img['id'] for item in MOCK_DB):
            MOCK_DB.append({
                "page_id": img['id'],
                "url": img['url'],
                "swipe_status": "pending"
            })
    print(f"--- MOCK DB UPDATED: Total images in DB: {len(MOCK_DB)} ---")

def mock_get_next_batch(limit=10):
    """Simulates fetching 'pending' images."""
    pending = [img for img in MOCK_DB if img['swipe_status'] == 'pending']
    return pending[:limit]

def mock_handle_swipe(image_id, direction):
    """Simulates updating a row and checking the buffer."""
    # 1. Update the status in our list
    for img in MOCK_DB:
        if img['page_id'] == image_id:
            img['swipe_status'] = direction
            break
    
    # 2. Count remaining
    remaining = len([img for img in MOCK_DB if img['swipe_status'] == 'pending'])
    print(f"Swiped {direction} on {image_id}. Remaining in buffer: {remaining}")

    # 3. Buffer Logic (Matches your 3-image threshold)
    if remaining <= 3:
        print("!!! Buffer low. Triggering API Refill...")
        new_data = fetch_random_wikimedia_images(10) # Using the API function from before
        mock_save_to_db(new_data)

# --- REUSE THE API FUNCTION FROM BEFORE ---
def fetch_random_wikimedia_images(limit=10):
    USER_AGENT = "CapstoneTesting/1.0 (contact: yourname@email.com)"
    url = "https://commons.wikimedia.org/w/api.php"
    params = {
        "action": "query", "format": "json", "generator": "random",
        "grnnamespace": 6, "grnlimit": limit, "prop": "imageinfo", "iiprop": "url"
    }
    try:
        r = requests.get(url, params=params, headers={"User-Agent": USER_AGENT})
        pages = r.json().get("query", {}).get("pages", {})
        return [{"id": p["pageid"], "url": p["imageinfo"][0]["url"]} for p in pages.values()]
    except:
        return []

# --- THE TEST RUN ---
if __name__ == "__main__":
    print("Starting Mock Test...")
    
    # 1. Initial Fill
    initial_images = fetch_random_wikimedia_images(10)
    mock_save_to_db(initial_images)
    
    # 2. Get the queue for the user
    user_queue = mock_get_next_batch(10)
    
    # 3. Simulate Swiping
    for i in range(8):
        current_img = user_queue[i]
        mock_handle_swipe(current_img['page_id'], "right")
        time.sleep(0.5) # Just for readability in the console