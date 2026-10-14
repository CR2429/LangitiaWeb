const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const SECRET_KEY = process.env.JWT_TOKEN_KEY;
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,              // max 5 tentatives
  message: 'Trop de tentatives de connexion. Réessayez dans une minute.',
});

// Route login
router.post('/login', loginLimiter, async (req, res) => {
    const { user, password } = req.body;

    try {
        const [rows] = await pool.query('SELECT * FROM users WHERE user = ?', [user]);
        const dbUser = rows[0];

        // Même message dans les deux cas : on ne dit pas à un attaquant
        // si c'est le nom ou le mot de passe qui est faux.
        if (!dbUser) {
            return res.status(401).json({ message: 'Identifiants incorrects' });
        }

        const isValid = await bcrypt.compare(password, dbUser.password);
        if (!isValid) {
            return res.status(401).json({ message: 'Identifiants incorrects' });
        }

        // Jeton admin : role 'admin' + expiration après 12 heures
        const token = jwt.sign(
            { userId: dbUser.id, role: 'admin' },
            SECRET_KEY,
            { expiresIn: '12h' }
        );
        res.json({ message: 'Connexion réussie', token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erreur lors de la connexion' });
    }
});

module.exports = router;
