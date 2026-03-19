import requests
import psycopg2
from psycopg2.extras import RealDictCursor
import time

# --- CONFIGURATION ---
# 1. Update with actual Postgres credentials
DB_CONFIG = {
    "dbname": "your_db",
    "user": "your_user",
    "password": "your_password",
    "host": "localhost",
    "port": "5432"
}

USER_AGENT = "ImageSwipeCapstone/1.0 (capstoneimagecollector@gmail.com)"
WIKI_API_URL = "https://commons.wikimedia.org/w/api.php"
BUFFER_THRESHOLD = 3
FETCH_LIMIT = 10

# --- DATABASE LOGIC ---

def get_db_connection():
    return psycopg2.connect(**DB_CONFIG)

def init_db():
    """Creates the table and index if they don't exist."""
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('''
        CREATE TABLE IF NOT EXISTS images (
            page_id TEXT PRIMARY KEY,
            url TEXT NOT NULL,
            title TEXT,
            license TEXT,
            swipe_status TEXT DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    ''')
    # Index for faster lookups when the database grows
    cur.execute("CREATE INDEX IF NOT EXISTS idx_swipe_status ON images (swipe_status);")
    conn.commit()
    cur.close()
    conn.close()
    print("Database initialized.")

# --- API SCRAPER LOGIC ---

def fetch_random_wikimedia_images(limit=10):
    """Hits the Wikimedia API to get a batch of random image URLs."""
    print(f"Fetching {limit} new images from Wikimedia...")
    params = {
        "action": "query",
        "format": "json",
        "generator": "random",
        "grnnamespace": 6,  # Files
        "grnlimit": limit,
        "prop": "imageinfo",
        "iiprop": "url|extmetadata",
    }
    
    headers = {"User-Agent": USER_AGENT}
    images_found = []
    
    try:
        response = requests.get(WIKI_API_URL, params=params, headers=headers)
        response.raise_for_status()
        data = response.json()
        
        pages = data.get("query", {}).get("pages", {})
        for _, info in pages.items():
            img_info = info.get("imageinfo", [{}])[0]
            url = img_info.get("url", "")
            
            # Basic check to ensure we are getting actual images
            if url.lower().endswith(('.jpg', '.jpeg', '.png')):
                images_found.append({
                    "id": info.get("pageid"),
                    "url": url,
                    "title": info.get("title", ""),
                    "license": img_info.get("extmetadata", {}).get("LicenseShortName", {}).get("value", "Unknown")
                })
        return images_found
    except Exception as e:
        print(f"Error fetching from API: {e}")
        return []

def save_to_db(image_list):
    """Saves images to Postgres, ignoring duplicates based on page_id."""
    conn = get_db_connection()
    cur = conn.cursor()
    for img in image_list:
        cur.execute('''
            INSERT INTO images (page_id, url, title, license)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (page_id) DO NOTHING;
        ''', (str(img['id']), img['url'], img['title'], img['license']))
    conn.commit()
    cur.close()
    conn.close()

# --- APP FLOW LOGIC ---

def get_next_images_for_user(limit=10):
    """Retrieves 'pending' images from the DB for the UI."""
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    cur.execute("SELECT page_id, url, title, license FROM images WHERE swipe_status = 'pending' LIMIT %s;", (limit,))
    batch = cur.fetchall()
    
    # If DB is empty, do an emergency fetch
    if not batch:
        new_imgs = fetch_random_wikimedia_images(FETCH_LIMIT)
        save_to_db(new_imgs)
        return get_next_images_for_user(limit)
        
    cur.close()
    conn.close()
    return batch

def handle_swipe(image_id, direction):
    """
    Updates the image status and checks the buffer. 
    'direction' should be 'left' or 'right'.
    """
    conn = get_db_connection()
    cur = conn.cursor()
    
    # 1. Update the status
    cur.execute("UPDATE images SET swipe_status = %s WHERE page_id = %s;", (direction, image_id))
    
    # 2. Check the buffer
    cur.execute("SELECT COUNT(*) FROM images WHERE swipe_status = 'pending';")
    remaining = cur.fetchone()[0]
    conn.commit()
    cur.close()
    conn.close()
    
    print(f"Image {image_id} marked as {direction}. Buffer remaining: {remaining}")
    
    # 3. Refill if low
    if remaining <= BUFFER_THRESHOLD:
        new_imgs = fetch_random_wikimedia_images(FETCH_LIMIT)
        save_to_db(new_imgs)

# --- EXECUTION EXAMPLE ---

if __name__ == "__main__":
    # Setup
    init_db()
    
    # 1. Simulate the App starting up: Get first batch
    user_queue = get_next_images_for_user(10)
    print(f"Loaded {len(user_queue)} images for the user.")
    
    # 2. Simulate user swiping through images
    for i in range(8):  # Swiping 8 times will trigger the refill (since 10 - 8 = 2, which is < 3)
        current_img = user_queue[i]
        # Simulate a right swipe for even, left for odd
        choice = "right" if i % 2 == 0 else "left"
        handle_swipe(current_img['page_id'], choice)