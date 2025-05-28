require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const express = require('express');
const path = require('path');
const cors = require('cors');


// gestion des differents element du serveur
const authRoutes = require('./routes/authRoutes');
const fileRoutes = require('./routes/fileRoutes');
const terminalRoutes = require('./routes/terminalRoutes');
const raspberryRoutes = require('./routes/raspberryRoutes');

const app = express();
const PORT = 8080;

app.use(express.json());
app.use(cors({
  origin: ['http://localhost:5173', 'https://langitia.com'],
  credentials: true
}));

// redirection des routes
app.use('/api', authRoutes);
app.use('/api', fileRoutes);
app.use('/api', terminalRoutes);
app.use('/api', raspberryRoutes);

// Sert les fichiers React une fois buildés
app.use(express.static(path.join(__dirname, '../client/dist')));

// Redirige tout le reste vers index.html (React Router)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

//message qui confirme le lancement du serveur
app.listen(PORT, () => {
    console.log(`🚀 Serveur Node lancé sur http://localhost:${PORT}`);
});
