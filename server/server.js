const express = require('express');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('./db');
const cors = require('cors');

const app = express();
const PORT = 8080;
const SECRET_KEY = 'ta_cle_ultra_secrete';

app.use(express.json());

// Fonction pour reset les utilisateurs depuis login.json
async function resetUsers() {
    try {
        const data = fs.readFileSync(path.join(__dirname, 'user.json'), 'utf8');
        const users = JSON.parse(data);

        await pool.query('DELETE FROM users');

        for (const user of users) {
            const hashedPassword = await bcrypt.hash(user.password, 10);
            await pool.query(
                'INSERT INTO users (user, password) VALUES (?, ?)',
                [user.user, hashedPassword]
            );
        }

        console.log(`✅ ${users.length} utilisateurs réinitialisés dans la base.`);
    } catch (err) {
        console.error('Erreur lors du reset des utilisateurs :', err);
    }
}

// Démarrer le reset au lancement
resetUsers();

// Route login
app.post('/api/login', async (req, res) => {
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

        const token = jwt.sign({ userId: dbUser.id }, SECRET_KEY, { expiresIn: '1h' });
        res.json({ message: 'Connexion réussie', token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erreur lors de la connexion' });
    }
});

//recuperer les informations d'un fichier
app.get('/api/file', async (req, res) => {
  const { id } = req.query;

  if (!id) {
      return res.status(400).json({ error: 'Missing file ID' });
  }

  try {
      const [rows] = await db.query(
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

//recuperer plusieur fichier par rapport a la route
app.get('/api/files', async (req, res) => {
  const { path } = req.query;

  if (!path) {
      return res.status(400).json({ error: 'Missing path parameter' });
  }

  try {
      const [rows] = await db.query(
          'SELECT id, name, type, content, url, path FROM files WHERE path = ?',
          [path]
      );
      res.json(rows);
  } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to fetch files' });
  }
});


// Sert les fichiers React une fois buildés
app.use(express.static(path.join(__dirname, '../client/dist')));

// Redirige tout le reste vers index.html (React Router)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Serveur Node lancé sur http://localhost:${PORT}`);
});
