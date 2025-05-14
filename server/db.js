require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'CartageUser',
    password: process.env.DB_PASSWORD,
    database: 'cartage'
});

module.exports = pool;