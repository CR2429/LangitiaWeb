const express = require('express');
const pool = require('../db');
const { DateTime } = require('luxon');
const requireAdmin = require('../middleware/requireAdmin');
const router = express.Router();

// Un seul token autorisé (celui du Raspberry Pi)
const AUTHORIZED_TOKEN = process.env.AUTHORIZED_TOKEN;

// =====================================================
// Appelé régulièrement par le Raspberry Pi lui-même.
// Il note l'heure du ping et dit au Pi s'il doit faire un wake-on-LAN.
// =====================================================
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

// =====================================================
// ADMIN SEULEMENT : demander un wake-on-LAN au prochain ping du Pi.
// (Avant, c'était la commande "wake_on_lan" de /api/terminal.)
// =====================================================
router.post('/admin/wake-on-lan', requireAdmin, async (req, res) => {
    try {
        await pool.query("UPDATE raspberry SET value = 'true' WHERE `key` = 'wake_on_lan'");
        res.json({ output: 'wake_on_lan défini sur true.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur lors de la mise à jour de wake_on_lan.' });
    }
});

// =====================================================
// ADMIN SEULEMENT : voir le contenu de la table raspberry.
// (Avant, c'était la commande "raspberry" de /api/terminal.)
// =====================================================
router.get('/admin/raspberry', requireAdmin, async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT `key`, `value` FROM raspberry");
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur lors de la lecture de la table raspberry.' });
    }
});

module.exports = router;
