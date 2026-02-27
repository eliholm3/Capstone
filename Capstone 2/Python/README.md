# 📸 Image Classifier Capstone

This project is a full-stack image classification app using a **React (Vite)** frontend, a **Flask** backend, and a **PostgreSQL** database.

## 🛠️ Setup Instructions

### 1. Database Configuration
Before running the backend, update the database credentials.
* Open `Wikimedia_pull_db.py`
* Locate the `DB_CONFIG` dictionary.
* Enter your local PostgreSQL `dbname`, `user`, `password`, `host`, and `port`.

### 2. Backend Setup (Python)
Ensure you have Python installed, then install the required libraries:
```bash
pip install flask flask-cors requests psycopg2-binary

### 3. To run:
Start the backend using "python app.py" this will run on port 5000