const express = require('express');
const pool = require('../db');
const auth = require('../middleware/auth');
const { fetchWikimediaImages } = require('../services/wikimedia');

const router = express.Router();

// Fetch more images from Wikimedia and insert them into the DB
async function refillFromWikimedia(datasetId) {
  const dsRes = await pool.query(
    "SELECT search_term, provider_offsets FROM datasets WHERE dataset_id = $1",
    [parseInt(datasetId)]
  );
  if (dsRes.rows.length === 0) return;

  const { search_term, provider_offsets } = dsRes.rows[0];
  const currentOffset = provider_offsets?.wikimedia;

  // null means Wikimedia has no more results for this search
  if (currentOffset === null) return;

  const offset = currentOffset || 0;
  const { images: fetched, nextOffset } = await fetchWikimediaImages(search_term, 40, offset);

  if (fetched && fetched.length > 0) {
    for (const img of fetched) {
      // Dedup by both URL and title to catch same image with different thumbnail URLs
      await pool.query(
        `INSERT INTO images (dataset_id, url, title, license, status, added_at)
         SELECT $1, $2, $3, $4, 'pending', NOW()
         WHERE NOT EXISTS (
           SELECT 1 FROM images WHERE dataset_id = $1 AND (url = $2 OR title = $3)
         )`,
        [datasetId, img.url, img.title, img.license]
      );
    }
  }

  await pool.query(
    "UPDATE datasets SET provider_offsets = $1 WHERE dataset_id = $2",
    [JSON.stringify({ wikimedia: nextOffset }), datasetId]
  );
}

// GET /api/datasets/:datasetId/images
async function getImages(req, res) {
  const { datasetId } = req.params;
  const { limit = 10, after = 0 } = req.query;

  try {
    // Query for pending images past the client's cursor
    let result = await pool.query(
      "SELECT image_id, url, title FROM images WHERE dataset_id = $1 AND status = 'pending' AND image_id > $3 ORDER BY image_id LIMIT $2",
      [parseInt(datasetId), parseInt(limit), parseInt(after)]
    );

    // If we got nothing, refill synchronously and try once more
    if (result.rows.length === 0) {
      try {
        await refillFromWikimedia(datasetId);
      } catch (err) {
        console.error("Sync refill error:", err);
      }
      result = await pool.query(
        "SELECT image_id, url, title FROM images WHERE dataset_id = $1 AND status = 'pending' AND image_id > $3 ORDER BY image_id LIMIT $2",
        [parseInt(datasetId), parseInt(limit), parseInt(after)]
      );
    }

    const imagesForUser = result.rows.map(img => ({ ...img, id: img.image_id }));
    res.json(imagesForUser);

    // Background refill so the NEXT request is fast
    const countRes = await pool.query(
      "SELECT COUNT(*) FROM images WHERE dataset_id = $1 AND status = 'pending'",
      [parseInt(datasetId)]
    );
    if (parseInt(countRes.rows[0].count) < 30) {
      refillFromWikimedia(datasetId).catch(err => console.error("Background refill error:", err));
    }
  } catch (err) {
    console.error('Fetch Error:', err);
    if (!res.headersSent) res.status(500).json({ error: 'Database error' });
  }
}

// GET /api/datasets/:datasetId/images/:imageId
async function getImage(req, res) {
  const { datasetId, imageId } = req.params;

  try {
    const result = await pool.query(
      'SELECT * FROM images WHERE image_id = $1 AND dataset_id = $2',
      [imageId, datasetId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Image not found.' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get image error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
}

// POST /api/datasets/:datasetId/images — add images to a dataset manually
async function addImage(req, res) {
  const { datasetId } = req.params;
  const { url, title, license } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'url is required.' });
  }

  try {
    // Verify dataset belongs to user
    const dsCheck = await pool.query(
      'SELECT dataset_id FROM datasets WHERE dataset_id = $1 AND user_id = $2',
      [datasetId, req.user.user_id]
    );

    if (dsCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Dataset not found.' });
    }

    const result = await pool.query(
      `INSERT INTO images (dataset_id, url, title, license, status, added_at)
       VALUES ($1, $2, $3, $4, 'pending', NOW())
       RETURNING *`,
      [datasetId, url, title || null, license || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Add image error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
}

// PATCH /api/datasets/:datasetId/images/:imageId
async function patchImage(req, res) {
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
}

// DELETE /api/datasets/:datasetId/images/:imageId
async function deleteImage(req, res) {
  const { datasetId, imageId } = req.params;

  try {
    const result = await pool.query(
      'DELETE FROM images WHERE image_id = $1 AND dataset_id = $2 RETURNING image_id',
      [imageId, datasetId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Image not found.' });
    }

    res.json({ message: 'Image deleted.' });
  } catch (err) {
    console.error('Delete image error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
}

router.get('/:datasetId/images', auth, getImages);
router.get('/:datasetId/images/:imageId', auth, getImage);
router.post('/:datasetId/images', auth, addImage);
router.patch('/:datasetId/images/:imageId', auth, patchImage);
router.delete('/:datasetId/images/:imageId', auth, deleteImage);

module.exports = router;
module.exports.getImages = getImages;
module.exports.getImage = getImage;
module.exports.addImage = addImage;
module.exports.patchImage = patchImage;
module.exports.deleteImage = deleteImage;
