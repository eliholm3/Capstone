from flask import Flask, jsonify, request
from flask_cors import CORS
import Wikimedia_pull as wiki

app = Flask(__name__)
CORS(app) 

@app.route('/')
def home():
    return "Python Backend is Running!"

@app.route('/images', methods=['GET'])
def get_images():
    images = wiki.get_next_images_for_user(limit=10)
    formatted_images = [{"id": img['page_id'], "url": img['url'], "name": img['title']} for img in images]
    return jsonify(formatted_images)

@app.route('/swipe', methods=['POST'])
def swipe():
    data = request.json
    wiki.handle_swipe(data['id'], data['direction'])
    return jsonify({"status": "success"})

if __name__ == '__main__':
    print("\n" + "="*30)
    print("🚀 CAPSTONE BACKEND STARTING")
    print("Listening on: http://localhost:5000")
    print("Connected to logic: Wikimedia_pull_db.py")
    print("="*30 + "\n")
    
    wiki.init_db() # This will attempt to connect to Postgres
    app.run(debug=True, port=5000)