const express = require('express');
const pool = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

// POST /api/datasets
router.post('/', auth, async (req, res) => {});

// GET /api/datasets
router.get('/', auth, async (req, res) => {});

// GET /api/datasets/:id
router.get('/:id', auth, async (req, res) => {});

// DELETE /api/datasets/:id
router.delete('/:id', auth, async (req, res) => {});

module.exports = router;
