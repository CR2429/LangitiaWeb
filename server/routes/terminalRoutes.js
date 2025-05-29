const express = require('express');
const pool = require('../db');
const { getUserIdFromToken } = require('../utils/auth');
const { v4: uuidv4 } = require('uuid');
const { DateTime } = require('luxon');

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
        // VISUALISER LES FICHIER DU REPERTOIRE
        //
        case 'ls': {
            try {
                // chercher les informations dans la base de données
                const [rows] = await pool.query(
                    'SELECT name, type FROM files WHERE path = ?',
                    [path]
                );

                // dossier vide
                if (rows.length === 0) {
                    return res.json({ output: '(dossier vide)' });
                }

                // Trier les dossiers en premier, puis ordre alphabétique
                const sortedRows = rows.sort((a, b) => {
                    // 1. Dossiers d'abord
                    if (a.type === 'folder' && b.type !== 'folder') return -1;
                    if (a.type !== 'folder' && b.type === 'folder') return 1;

                    // 2. Tri alphabétique insensible à la casse
                    return a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' });
                });

                // Affichage formaté
                const formatted = sortedRows.map(file => {
                    let icon;
                    switch (file.type) {
                        case 'folder': icon = '📁'; break;
                        case 'file-text': icon = '📄'; break;
                        case 'file-image': icon = '🖼️'; break;
                        case 'file-video': icon = '🎥'; break;
                        case 'file-audio': icon = '🎵'; break;
                        default: icon = '❓';
                    }
                    return `[${icon}] ${file.name}`;
                });

                return res.json({ output: formatted.join('\n') });
            } catch (err) {
                console.error(err);
                return res.status(500).json({ output: 'Erreur lors de la lecture du dossier.' });
            }
        }
        //
        // NAVIGATION DANS LES FICHIERS
        //
        case 'cd': {
            let targetPath = path;

            if (args.length === 0) {
                // cd → reset à /home
                targetPath = '/home';
            } else if (args[0] === '..') {
                const parts = path.split('/').filter(Boolean);
                if (parts.length > 1) {
                    parts.pop(); // retire le dernier segment
                }
                targetPath = '/' + parts.join('/');
            } else {
                const rawName = args.join(' ').trim().replace(/\s+/g, '_');
                targetPath = rawName.startsWith('/')
                    ? rawName // permet cd /home/images
                    : path.replace(/\/$/, '') + '/' + rawName;
            }

            // blocage si on tente de remonter au-dessus de /home
            if (!targetPath.startsWith('/home')) {
                return res.json({ output: 'Erreur : accès interdit au-dessus de /home.' });
            }

            // validation dans la base
            const parts = targetPath.split('/').filter(Boolean);
            const folderName = parts.pop();
            const parentPath = '/' + parts.join('/');

            try {
                const [result] = await pool.query(
                    'SELECT id FROM files WHERE path = ? AND name = ? AND type = "folder"',
                    [parentPath, folderName]
                );

                if (result.length === 0 && targetPath !== '/home') {
                    return res.json({ output: `Erreur : le dossier "${args[0]}" n'existe pas.` });
                }

                return res.json({ newPath: targetPath });
            } catch (err) {
                console.error(err);
                return res.status(500).json({ output: 'Erreur lors du changement de dossier.' });
            }
        }
        //
        // CREER OU MODIFIER UN FICHIER TEXTUEL
        //
        case 'nano': {
            //login
            let userId;
            try {
                userId = getUserIdFromToken(req);
            } catch (err) {
                return res.status(401).json({ output: `Erreur : ${err.message}` });
            }

            const filename = args[0];
            if (!filename || !/\.(txt|md|log)$/.test(filename)) {
                return res.json({ output: 'Erreur : fichier invalide. Utilisez .txt, .md ou .log' });
            }

            // Détection du mode appendOnly
            const isAppendOnly = filename.endsWith('.log');

            // Envoyer une requête pour afficher l'interface de modification
            return res.json({
                action: 'openEditor',
                filename: filename,
                appendOnly: isAppendOnly // true uniquement pour .log
            });
        }
        //
        // METTRE WAKE_ON_LAN À TRUE
        //
        case 'wake_on_lan': {
            let userId;
            try {
                userId = getUserIdFromToken(req);
            } catch (err) {
                return res.status(401).json({ output: `Erreur : ${err.message}` });
            }

            try {
                await pool.query("UPDATE raspberry SET value = 'true' WHERE `key` = 'wake_on_lan'");
                return res.json({ output: '✅ wake_on_lan défini sur true.' });
            } catch (err) {
                console.error(err);
                return res.status(500).json({ output: '❌ Erreur lors de la mise à jour de wake_on_lan.' });
            }
        }

        //
        // AFFICHER LES INFOS DE LA TABLE RASPBERRY
        //
        case 'raspberry': {
            let userId;
            try {
                userId = getUserIdFromToken(req);
            } catch (err) {
                return res.status(401).json({ output: `Erreur : ${err.message}` });
            }

            try {
                const [rows] = await pool.query("SELECT `key`, `value` FROM raspberry");
                if (rows.length === 0) {
                    return res.json({ output: 'ℹ️ Aucune donnée dans la table raspberry.' });
                }

                const formatted = rows.map(row => `${row.key}: ${row.value}`).join('\n');
                return res.json({ output: formatted });
            } catch (err) {
                console.error(err);
                return res.status(500).json({ output: '❌ Erreur lors de la lecture de la table raspberry.' });
            }
        }
        //
        // MESSAGE D'ERREUR
        //
        default:
            return res.json({ output: `La commande "${commande}" n'existe pas.` });
    }
});
 
router.get('/terminal/nano', async (req, res) => {
    const { filename, path } = req.query;

    //verifier l'extension du fichier
    if (!filename || !/\.(txt|md|log)$/.test(filename)) {
        return res.status(400).json({ error: 'Nom de fichier invalide.' });
    }

    try {
        const [rows] = await pool.query(
            'SELECT content FROM files WHERE name = ? AND path = ?',
            [filename, path]
        );

        if (rows.length === 0) {
            // Fichier inexistant
            return res.json({
                content: '',
                appendOnly: filename.endsWith('.log')
            });
        }

        res.json({
            content: rows[0].content || '',
            appendOnly: filename.endsWith('.log')
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur lors de la récupération du contenu.' });
    }
});

router.post('/terminal/nano', async (req, res) => {
    const { filename, path, content } = req.body;

    // verifier le nom du fichier
    if (!filename || !/\.(txt|md|log)$/.test(filename)) {
        return res.status(400).json({ error: 'Nom de fichier invalide.' });
    }

    //verifier le login
    let userId;
    try {
        userId = getUserIdFromToken(req);
    } catch (err) {
        return res.status(401).json({ error: `Erreur : ${err.message}` });
    }

    try {
        // recuperer le user
        const [userRows] = await pool.query('SELECT user FROM users WHERE id = ?', [userId]);
        const username = userRows.length > 0 ? userRows[0].username : 'inconnu';

        // verifie si le fichier exite deja
        const [rows] = await pool.query(
            'SELECT id, content FROM files WHERE name = ? AND path = ?',
            [filename, path]
        );

        const isLogFile = filename.endsWith('.log');

        // creer le fichier
        if (rows.length === 0) {
            const fileId = uuidv4();

            if (isLogFile) { // fichier log
                const entry = {
                    message: content.trim(),
                    date: DateTime.local().toISO(), // ✅ pas de setZone ici
                    user: username
                };

                await pool.query(
                    'INSERT INTO files (id, name, type, url, path, content) VALUES (?, ?, ?, ?, ?, ?)',
                    [fileId, filename, 'file-text', `/file/${fileId}`, path, JSON.stringify([entry], null, 2)]
                );
            } else {
                await pool.query(
                    'INSERT INTO files (id, name, type, url, path, content) VALUES (?, ?, ?, ?, ?, ?)',
                    [fileId, filename, 'file-text', `/file/${fileId}`, path, content]
                );
            }

            // modifier un fichier
        } else {
            const existing = rows[0];

            if (isLogFile) { // fichier log
                let entries = [];
                try {
                    entries = JSON.parse(existing.content || '[]');
                    if (!Array.isArray(entries)) entries = [];
                } catch {
                    entries = [];
                }

                const newEntry = {
                    message: content.trim(),
                    date: DateTime.local().toISO(), // ✅ horodatage serveur
                    user: username
                };

                entries.push(newEntry);

                await pool.query(
                    'UPDATE files SET content = ? WHERE id = ?',
                    [JSON.stringify(entries, null, 2), existing.id]
                );

            } else {
                await pool.query(
                    'UPDATE files SET content = ? WHERE id = ?',
                    [content, existing.id]
                );
            }
        }

        res.json({ success: true });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur lors de l\'enregistrement du fichier.' });
    }
});


module.exports = router;
