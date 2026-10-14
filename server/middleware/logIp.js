const jwt = require('jsonwebtoken');
const pool = require('../db');
const cleanPayload = require('../utils/cleanPayload');

module.exports = async (req, res, next) => {
  // Ignorer la racine "/"
  const path = req.path.replace(/\/+$/, '');
  if (path === '') {
    return next();
  }

  // Ignorer la synchronisation : chaque visiteur l'appelle toutes les
  // 10 secondes, ça remplirait la table pour rien.
  if (path.startsWith('/sync')) {
    return next();
  }

  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const method = req.method;
  const endpoint = req.originalUrl;
  const timestamp = new Date();
  const userAgent = req.headers['user-agent'] || '';

  // Si la requête vient de l'admin connecté, on note son id
  let userId = null;
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_TOKEN_KEY);
      userId = decoded.userId || null;
    } catch (err) {
      // Jeton invalide ou jeton visiteur : on log sans id, ce n'est pas une erreur
    }
  }

  // Corps de la requête (POST, PUT, PATCH), SANS les mots de passe
  let payload = null;
  if (['POST', 'PUT', 'PATCH'].includes(method)) {
    payload = cleanPayload(req.body);
  }

  try {
    await pool.query(
      `INSERT INTO access_logs (
         ip_address,
         method,
         endpoint,
         timestamp,
         user_id,
         user_agent,
         payload
       )
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [ip, method, endpoint, timestamp, userId, userAgent, payload]
    );
  } catch (err) {
    console.error('❌ Erreur insertion log :', err);
  }

  next();
};
