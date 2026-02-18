require("dotenv").config();
const express = require("express");
const { Pool } = require("pg");

const app = express();
app.use(express.json());

// Create connection pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// Test DB connection at startup
pool.connect()
    .then(client => {
        console.log("Connected to database");
        client.release();
    })
    .catch(err => {
        console.error("Database connection error:", err);
    });

// Simple test route
app.get("/", async (req, res) => {
    try {
        const result = await pool.query("SELECT NOW()");
        res.json({
            message: "Server is running",
            time: result.rows[0].now
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
