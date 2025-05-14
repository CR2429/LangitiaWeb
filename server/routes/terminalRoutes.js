const express = require('express');
const pool = require('../db');
const { getUserIdFromToken } = require('../utils/auth');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

router.post('/terminal', async (req, res) => {
    const { command, path } = req.body;

    if (!command) {
        return res.status(400).json({ output: 'Aucune commande reçue.' });
    }

    const parts = command.trim().split(/\s+/);
    const commande = parts[0];
    const args = parts.slice(1);

    switch (commande) {
        //
        // HELP
        //
        case 'help':
            return res.json({ output: 'Bas va lire le README.txt' });
        //
        // CREATION DE FICHIER
        //
        case 'mkdir': {
            //login
            let userId;
            try {
                userId = getUserIdFromToken(req);
            } catch (err) {
                return res.status(401).json({ output: `Erreur : ${err.message}` });
            }

            //check si il y a bien un nom
            if (args.length === 0) {
                return res.json({ output: 'Erreur : Vous devez fournir un nom de dossier.' });
            }

            //donne necessaire pour la commande
            const rawName = args.join(' ').trim();
            const folderName = rawName.replace(/\s+/g, '_');
            const folderId = uuidv4();
            const folderUrl = `/folder/${folderId}`;
            const parentPath = path.endsWith('/') ? path.slice(0, -1) : path;
            
            //insert les datas dans la base de donner
            try {
                await pool.query(
                    'INSERT INTO files (id, name, type, url, path) VALUES (?, ?, ?, ?, ?)',
                    [folderId, folderName, 'folder', folderUrl, parentPath]
                );

                return res.json({ output: `Dossier "${folderName}" créé dans "${parentPath}".` });
            } catch (err) {
                console.error(err);
                return res.status(500).json({ output: 'Erreur lors de la création du dossier.' });
            }
        }
        //
        // MESSAGE D'ERREUR
        //
        default:
            return res.json({ output: `La commande "${commande}" n'existe pas.` });
    }
});

module.exports = router;
