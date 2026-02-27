import requests
import os

# --- CONFIGURATION ---
SAVES_FILE = "seen_images.txt" ## This file will store the IDs of images we've already shown to avoid repeats. To be integrated with DB.
USER_AGENT = "ImageSwipeCapstone/1.0 (capstoneimagecollector@gmail.com)"
WIKI_API_URL = "https://commons.wikimedia.org/w/api.php"

def load_seen_ids():
    if not os.path.exists(SAVES_FILE):
        return set()
    with open(SAVES_FILE, "r") as f:
        return set(line.strip() for line in f)

def save_seen_id(page_id):
    with open(SAVES_FILE, "a") as f:
        f.write(f"{page_id}\n")

def get_10_random_images():
    seen_ids = load_seen_ids()
    images_to_display = []
    
    # We loop in case some random results were already 'seen'
    while len(images_to_display) < 10:
        params = {
            "action": "query",
            "format": "json",
            "generator": "random",
            "grnnamespace": 6,  # Namespace 6 is for Files/Images
            "grnlimit": 10,     # Ask for 10 at a time
            "prop": "imageinfo",
            "iiprop": "url|extmetadata", # Get URL and Metadata (Author/License)
        }
        
        headers = {"User-Agent": USER_AGENT}
        response = requests.get(WIKI_API_URL, params=params, headers=headers).json()
        
        pages = response.get("query", {}).get("pages", {})
        
        for page_id, data in pages.items():
            if page_id not in seen_ids and len(images_to_display) < 10:
                # Basic validation: ensure it's a common image format
                url = data.get("imageinfo", [{}])[0].get("url", "")
                if url.lower().endswith(('.jpg', '.jpeg', '.png')):
                    images_to_display.append({
                        "id": page_id,
                        "url": url,
                        "title": data.get("title", ""),
                        "license": data.get("imageinfo", [{}])[0].get("extmetadata", {}).get("LicenseShortName", {}).get("value", "Unknown")
                    })
                    save_seen_id(page_id) # Mark as seen immediately
                    
    return images_to_display

# --- RUN ---
batch = get_10_random_images()
for idx, img in enumerate(batch):
    print(f"[{idx+1}] ID: {img['id']} | URL: {img['url']}")