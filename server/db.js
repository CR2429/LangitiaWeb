const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Lire le mot de passe depuis le fichier
const passwordFilePath = path.join(__dirname, 'SQL_password.txt');
let dbPassword = '';

try {
    dbPassword = fs.readFileSync(passwordFilePath, 'utf8').trim();
} catch (err) {
    console.error('Erreur : impossible de lire le fichier SQL_password.txt');
    process.exit(1);
}

const pool = mysql.createPool({
    host: 'localhost',
    user: 'CartageUser',
    password: dbPassword,
    database: 'cartage'
});

module.exports = pool;