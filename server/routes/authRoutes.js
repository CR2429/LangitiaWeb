const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const SECRET_KEY = process.env.JWT_TOKEN_KEY;

// Fonction pour reset les utilisateurs
router.post('/reset-users', async (req, res) => {
    try {
        const data = fs.readFileSync(path.join(__dirname, '../user.json'), 'utf8');
        const users = JSON.parse(data);

        await pool.query('DELETE FROM users');
        for (const user of users) {
            const hashedPassword = await bcrypt.hash(user.password, 10);
            await pool.query(
                'INSERT INTO users (user, password) VALUES (?, ?)',
                [user.user, hashedPassword]
            );
        }

        res.json({ message: `✅ ${users.length} utilisateurs réinitialisés.` });
    } catch (err) {
        console.error('Erreur lors du reset des utilisateurs :', err);
        res.status(500).json({ message: 'Erreur lors du reset des utilisateurs' });
    }
});

// Route login
router.post('/login', async (req, res) => {
    const { user, password } = req.body;

    try {
        const [rows] = await pool.query('SELECT * FROM users WHERE user = ?', [user]);
        const dbUser = rows[0];

        if (!dbUser) {
            return res.status(401).json({ message: 'Utilisateur non trouvé' });
        }

        const isValid = await bcrypt.compare(password, dbUser.password);
        if (!isValid) {
            return res.status(401).json({ message: 'Mot de passe incorrect' });
        }

        const token = jwt.sign({ userId: dbUser.id }, SECRET_KEY);
        res.json({ message: 'Connexion réussie', token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erreur lors de la connexion' });
    }
});

module.exports = router;
