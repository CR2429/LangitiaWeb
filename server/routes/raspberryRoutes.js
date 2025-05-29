const express = require('express');
const pool = require('../db');
const { DateTime } = require('luxon');
const router = express.Router();

// Un seul token autorisé
const AUTHORIZED_TOKEN = process.env.AUTHORIZED_TOKEN;

router.get('/raspberry/ping', async (req, res) => {
    const token = req.query.token;

    if (token !== AUTHORIZED_TOKEN) {
        return res.status(403).json({ error: 'Token invalide.' });
    }

    try {
        const now = DateTime.now().toISO();

        await pool.query("UPDATE raspberry SET value = ? WHERE `key` = 'last_ping'", [now]);

        const [rows] = await pool.query("SELECT value FROM raspberry WHERE `key` = 'wake_on_lan'");
        const wake = rows.length > 0 ? rows[0].value : 'false';

        if (wake === 'true') {
            await pool.query("UPDATE raspberry SET value = 'false' WHERE `key` = 'wake_on_lan'");
        }

        res.json({ wake_on_lan: wake });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur interne.' });
    }
});

module.exports = router;
