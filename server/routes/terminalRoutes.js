const express = require('express');
const pool = require('../db');
const jwt = require('jsonwebtoken')

const router = express.Router();

router.post('/terminal', async (req, res) => {
    const { command, path } = req.body;

    //commande non valide
    if (!command) {
        return res.status(400).json({ output: 'Aucune commande reçue.' });
    }

    //recupere la commande
    const parts = command.trim().split(/\s+/);
    const commande = parts[0];
    const args = parts.slice(1);

    switch (commande) {
        case 'help':
            res.json({ output: 'Bas va lire le README.txt' });
            break;
        case 'mkdir':
            if (args.length === 0) {
                return res.json({ output: 'Erreur : Vous devez fournir un nom de dossier.' });
            }

            const folderName = args[0];

            try {
                await pool.query(
                    'INSERT INTO files (name, type, path, ownerId) VALUES (?, ?, ?, ?)',
                    [folderName, 'folder', path, userId]
                );

                res.json({ output: `Dossier "${folderName}" créé dans "${path}".` });
            } catch (err) {
                console.error(err);
                res.status(500).json({ output: 'Erreur lors de la création du dossier.' });
            }
            break;
        default:
            res.json({ output: `La commande "${commande}" n'existe pas.` });
    }
});

module.exports = router;
