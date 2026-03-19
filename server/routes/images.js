const express = require('express');
const pool = require('../db');
const auth = require('../middleware/auth');
const { fetchWikimediaImages } = require('../services/wikimedia');

const router = express.Router();

// GET /api/datasets/:datasetId/images
router.get('/:datasetId/images', auth, async (req, res) => {
  const { datasetId } = req.params;
  const { limit = 10 } = req.query; // No more 'exclude' needed

  try {
    // 1. Get images that are strictly 'pending'
    // This is much faster than using "NOT IN (long list of IDs)"
    const result = await pool.query(
      "SELECT image_id, url, title FROM images WHERE dataset_id = $1 AND status = 'pending' LIMIT $2",
      [parseInt(datasetId), parseInt(limit)]
    );
    
    const imagesForUser = result.rows.map(img => ({ ...img, id: img.image_id }));

    // 2. Send images to user immediately
    res.json(imagesForUser);

    // 3. Optimized Background Refill
    const countRes = await pool.query(
      "SELECT COUNT(*) FROM images WHERE dataset_id = $1 AND status = 'pending'",
      [parseInt(datasetId)]
    );
    const pendingInDb = parseInt(countRes.rows[0].count);

    // Refill sooner (at 15) to ensure the user NEVER sees an empty screen
    if (pendingInDb < 15) {
      const dsRes = await pool.query(
        "SELECT search_term, provider_offsets FROM datasets WHERE dataset_id = $1",
        [parseInt(datasetId)]
      );

      if (dsRes.rows.length > 0) {
        const { search_term, provider_offsets } = dsRes.rows[0];
        const currentOffset = provider_offsets?.wikimedia || 0;

        // Fetch a larger batch (40) to reduce the number of times we have to hit Wikimedia
        fetchWikimediaImages(search_term, 40, currentOffset).then(async ({ images, nextOffset }) => {
          if (images && images.length > 0) {
            for (const img of images) {
              await pool.query(
                `INSERT INTO images (dataset_id, url, title, license, status, added_at)
                 SELECT $1, $2, $3, $4, 'pending', NOW()
                 WHERE NOT EXISTS (SELECT 1 FROM images WHERE dataset_id = $1 AND url = $2)`,
                [datasetId, img.url, img.title, img.license]
              );
            }
            await pool.query(
              "UPDATE datasets SET provider_offsets = $1 WHERE dataset_id = $2",
              [JSON.stringify({ wikimedia: nextOffset }), datasetId]
            );
          }
        }).catch(err => console.error("Refill Error:", err));
      }
    }
  } catch (err) {
    console.error('Fetch Error:', err);
    if (!res.headersSent) res.status(500).json({ error: 'Database error' });
  }
});

// PATCH /api/datasets/:datasetId/images/:imageId
router.patch('/:datasetId/images/:imageId', auth, async (req, res) => {
  const { imageId } = req.params;
  const { status } = req.body;

  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    const result = await pool.query(
      "UPDATE images SET status = $1 WHERE image_id = $2 RETURNING *",
      [status, imageId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Image not found' });
    }

    res.json({ success: true, image: result.rows[0] });
  } catch (err) {
    console.error('PATCH ERROR:', err);
    res.status(500).json({ error: 'Failed to update image status' });
  }
});

// Placeholders for other routes
router.post('/:datasetId/images', auth, async (req, res) => { res.status(501).send("Not implemented"); });
router.get('/:datasetId/images/:imageId', auth, async (req, res) => { res.status(501).send("Not implemented"); });
router.delete('/:datasetId/images/:imageId', auth, async (req, res) => { res.status(501).send("Not implemented"); });

module.exports = router;