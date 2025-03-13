const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Pour servir des fichiers statiques (images, icônes)

app.get('/', (req, res) => {
    res.send('Backend is running...');
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
