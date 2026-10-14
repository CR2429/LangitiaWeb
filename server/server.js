require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

// Vérifie que toutes les variables obligatoires sont dans le .env.
// Sans elles, le serveur serait vulnérable ou planterait plus tard : on arrête tout de suite.
const VARIABLES_OBLIGATOIRES = ['JWT_TOKEN_KEY', 'VISITOR_TOKEN_KEY', 'DB_PASSWORD', 'AUTHORIZED_TOKEN'];
for (const nom of VARIABLES_OBLIGATOIRES) {
  if (!process.env[nom]) {
    console.error(`❌ Variable manquante dans le .env : ${nom}. Arrêt du serveur.`);
    process.exit(1);
  }
}
if (process.env.JWT_TOKEN_KEY === process.env.VISITOR_TOKEN_KEY) {
  console.error('❌ JWT_TOKEN_KEY et VISITOR_TOKEN_KEY doivent être différentes. Arrêt du serveur.');
  process.exit(1);
}

const express = require('express');
const path = require('path');
const cors = require('cors');
const resetUsersOnStartup = require('./utils/initUser.js');
const helmet = require('helmet');

// gestion des differents element du serveur
const authRoutes = require('./routes/authRoutes');
const raspberryRoutes = require('./routes/raspberryRoutes');
const syncRoutes = require('./routes/syncRoutes');

const app = express();
const logIpMiddleware = require('./middleware/logIp');
const PORT = 8080;

app.disable('x-powered-by');

app.use(express.json());
app.use(cors({
  origin: ['http://localhost:5173', 'https://langitia.com'],
  credentials: true
}));

app.use(helmet());

// Réinitialise les utilisateurs
resetUsersOnStartup();

// redirection des routes
app.use('/api', logIpMiddleware);
app.use('/api', authRoutes);
app.use('/api', raspberryRoutes);
app.use('/api/sync', syncRoutes);

// Sert les fichiers React avec gestion du cache intelligente
app.use(express.static(path.join(__dirname, '../client/dist'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      // On ne met pas index.html en cache fort
      res.setHeader('Cache-Control', 'no-cache');
    } else {
      // Cache fort pour tout le reste (versionné)
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  }
}));

// Redirige tout le reste vers index.html (React Router)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'), {
    headers: {
      'Cache-Control': 'no-cache'
    }
  });
});


//message qui confirme le lancement du serveur
app.listen(PORT, () => {
    console.log(`🚀 Serveur Node lancé sur http://localhost:${PORT}`);
});
