const express = require('express');
const pool = require('../db');
const auth = require('../middleware/auth');
const { fetchWikimediaImages } = require('../services/wikimedia');

const router = express.Router();

// POST /api/datasets — Create a new dataset and fetch images from Wikimedia
router.post('/', auth, async (req, res) => {
  const { name, search_term, total_images } = req.body;

  if (!name || !search_term || !total_images) {
    return res.status(400).json({ error: 'name, search_term, and total_images are required.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Create the dataset
    const datasetResult = await client.query(
      `INSERT INTO datasets (user_id, name, search_term, total_images, provider_offsets, created_at)
       VALUES ($1, $2, $3, $4, '{}', NOW())
       RETURNING *`,
      [req.user.user_id, name, search_term, total_images]
    );
    const dataset = datasetResult.rows[0];

    // Fetch images from Wikimedia
    const { images, nextOffset } = await fetchWikimediaImages(search_term, total_images, 0);

    // Insert images into the database, skipping any duplicate URLs
    for (const img of images) {
      await client.query(
        `INSERT INTO images (dataset_id, url, title, license, status, added_at)
         SELECT $1, $2, $3, $4, 'pending', NOW()
         WHERE NOT EXISTS (
           SELECT 1 FROM images WHERE dataset_id = $1 AND url = $2
         )`,
        [dataset.dataset_id, img.url, img.title, img.license]
      );
    }

    // Save the offset so next fetch continues where we left off
    const offsets = nextOffset != null ? { wikimedia: nextOffset } : {};
    await client.query(
      'UPDATE datasets SET provider_offsets = $1 WHERE dataset_id = $2',
      [JSON.stringify(offsets), dataset.dataset_id]
    );

    await client.query('COMMIT');

    res.status(201).json({
      ...dataset,
      total_count: images.length,
      pending_count: images.length,
      provider_offsets: offsets,
      images_fetched: images.length,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Create dataset error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  } finally {
    client.release();
  }
});

// GET /api/datasets — List all datasets for the logged-in user
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT d.*,
        COUNT(i.image_id) AS total_count,
        COUNT(i.image_id) FILTER (WHERE i.status = 'pending')  AS pending_count,
        COUNT(i.image_id) FILTER (WHERE i.status = 'approved') AS approved_count,
        COUNT(i.image_id) FILTER (WHERE i.status = 'rejected') AS rejected_count
       FROM datasets d
       LEFT JOIN images i ON i.dataset_id = d.dataset_id
       WHERE d.user_id = $1
       GROUP BY d.dataset_id
       ORDER BY d.created_at DESC`,
      [req.user.user_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('List datasets error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/datasets/:id — Get a single dataset (must be yours)
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT d.*,
        COUNT(i.image_id) AS total_count,
        COUNT(i.image_id) FILTER (WHERE i.status = 'pending')  AS pending_count,
        COUNT(i.image_id) FILTER (WHERE i.status = 'approved') AS approved_count,
        COUNT(i.image_id) FILTER (WHERE i.status = 'rejected') AS rejected_count
       FROM datasets d
       LEFT JOIN images i ON i.dataset_id = d.dataset_id
       WHERE d.dataset_id = $1 AND d.user_id = $2
       GROUP BY d.dataset_id`,
      [req.params.id, req.user.user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Dataset not found.' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get dataset error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// DELETE /api/datasets/:id — Delete a dataset (cascades to images)
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM datasets WHERE dataset_id = $1 AND user_id = $2 RETURNING dataset_id',
      [req.params.id, req.user.user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Dataset not found.' });
    }

    res.json({ message: 'Dataset deleted.' });
  } catch (err) {
    console.error('Delete dataset error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
