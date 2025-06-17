require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const express = require('express');
const path = require('path');
const cors = require('cors');
const resetUsersOnStartup = require('./utils/initUser.js');
const helmet = require('helmet');

// gestion des differents element du serveur
const authRoutes = require('./routes/authRoutes');
const fileRoutes = require('./routes/fileRoutes');
const terminalRoutes = require('./routes/terminalRoutes');
const raspberryRoutes = require('./routes/raspberryRoutes');

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
app.use(logIpMiddleware);
app.use('/api', authRoutes);
app.use('/api', fileRoutes);
app.use('/api', terminalRoutes);
app.use('/api', raspberryRoutes);

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
