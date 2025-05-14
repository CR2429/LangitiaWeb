const jwt = require('jsonwebtoken');

function getUserIdFromToken(req) {
    const authHeader = req.headers.authorization;
    console.log('Authorization:', authHeader);
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error('Non authentifié');
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_TOKEN_KEY);
        return decoded.userId;
    } catch (err) {
        throw new Error('Token invalide');
    }
}

module.exports = { getUserIdFromToken };
