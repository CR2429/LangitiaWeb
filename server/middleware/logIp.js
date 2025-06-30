const jwt = require('jsonwebtoken');
const pool = require('../db');

module.exports = async (req, res, next) => {
  // Ignorer la racine "/"
  const path = req.path.replace(/\/+$/, '');
  if (path === '') {
    return next();
  }

  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const method = req.method;
  const endpoint = req.originalUrl;
  const timestamp = new Date();
  const userAgent = req.headers['user-agent'] || '';

  let userId = null;

  // Tentative d'extraction du token
  const authHeader = req.headers['authorization'];
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.id; // 🧠 Assure-toi que `id` est bien dans le payload JWT
    } catch (err) {
      console.warn('❌ Token JWT invalide ou expiré dans logIp');
    }
  }

  // Récupérer la charge utile si c'est un POST, PUT, PATCH
  let payload = null;
  if (['POST', 'PUT', 'PATCH'].includes(method)) {
    try {
      // On stringify le body proprement
      payload = JSON.stringify(req.body);
      // Attention si très gros payloads
      if (payload.length > 2000) {
        payload = payload.slice(0, 2000) + '... (truncated)';
      }
    } catch (err) {
      payload = '⚠️ Erreur lecture body';
    }
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
