const express = require('express');
const router = express.Router();
const pool = require('../db');

// Récupérer un fichier
router.get('/file', async (req, res) => {
    const { id } = req.query;

    if (!id) {
        return res.status(400).json({ error: 'Missing file ID' });
    }

    try {
        const [rows] = await pool.query(
            'SELECT id, name, type, content, url, path FROM files WHERE id = ? LIMIT 1',
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'File not found' });
        }

        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch file' });
    }
});

// Récupérer plusieurs fichiers par path
router.get('/files', async (req, res) => {
    const { path } = req.query;

    if (!path) {
        return res.status(400).json({ error: 'Missing path parameter' });
    }

    try {
        const [rows] = await pool.query(
            'SELECT id, name, type, content, url, path FROM files WHERE path = ?',
            [path]
        );
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch files' });
    }
});

module.exports = router;
