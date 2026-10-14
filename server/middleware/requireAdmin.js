// Middleware qui laisse passer uniquement l'admin (le propriétaire du site).
//
// Il y a DEUX sortes de jetons (JWT) sur le site :
//  - le jeton ADMIN : donné par /api/login, signé avec JWT_TOKEN_KEY,
//    il contient { userId, role: 'admin' }.
//  - le jeton VISITEUR : donné par /api/sync, signé avec VISITOR_TOKEN_KEY,
//    il contient seulement les clés trouvées par le visiteur.
//
// Comme les deux clés de signature sont différentes, un jeton visiteur
// ne peut jamais être accepté ici.

const jwt = require('jsonwebtoken');

function requireAdmin(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Non authentifié.' });
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_TOKEN_KEY);
    } catch (err) {
        return res.status(401).json({ error: 'Jeton invalide ou expiré.' });
    }

    // Double vérification : le jeton doit vraiment être un jeton admin
    if (decoded.role !== 'admin' || !decoded.userId) {
        return res.status(403).json({ error: 'Accès refusé.' });
    }

    // On garde l'id de l'admin pour les routes suivantes
    req.adminId = decoded.userId;
    next();
}

module.exports = requireAdmin;
