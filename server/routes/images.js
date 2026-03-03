const express = require('express');
const pool = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

// POST /api/datasets/:datasetId/images
router.post('/:datasetId/images', auth, async (req, res) => {});

// GET /api/datasets/:datasetId/images
router.get('/:datasetId/images', auth, async (req, res) => {});

// GET /api/datasets/:datasetId/images/:imageId
router.get('/:datasetId/images/:imageId', auth, async (req, res) => {});

// PATCH /api/datasets/:datasetId/images/:imageId
router.patch('/:datasetId/images/:imageId', auth, async (req, res) => {});

// DELETE /api/datasets/:datasetId/images/:imageId
router.delete('/:datasetId/images/:imageId', auth, async (req, res) => {});

module.exports = router;
