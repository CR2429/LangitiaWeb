// Connexion MySQL du bot Discord.
// (Copie volontaire de apps/api/db.js : le bot est un projet indépendant du site.)
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: 'langitia.com',
    port: 3306,
    user: 'CartageUser',
    password: process.env.DB_PASSWORD,
    database: 'cartage'
});

module.exports = pool;
