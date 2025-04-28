const express = require('express');
const path = require('path');


const app = express();
const PORT = 8080;

// Sert les fichiers React une fois buildés
app.use(express.static(path.join(__dirname, '../client/dist')));

// Redirige tout vers index.html (React Router)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Serveur Node lancé sur http://localhost:${PORT}`);
});