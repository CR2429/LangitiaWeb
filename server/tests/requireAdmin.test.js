// Tests du middleware requireAdmin.
// Lancer avec : node --test   (depuis le dossier du serveur)
const test = require('node:test');
const assert = require('node:assert');
const jwt = require('jsonwebtoken');

// Clés de test (jamais les vraies)
process.env.JWT_TOKEN_KEY = 'cle-admin-de-test';
process.env.VISITOR_TOKEN_KEY = 'cle-visiteur-de-test';

const requireAdmin = require('../middleware/requireAdmin');

// Simule un appel au middleware et retourne ce qui s'est passé
function appeler(authorization) {
    const req = { headers: { authorization } };
    const resultat = { status: null, suivant: false };
    const res = {
        status(code) { resultat.status = code; return this; },
        json() { return this; },
    };
    requireAdmin(req, res, () => { resultat.suivant = true; });
    return resultat;
}

test('refuse une requête sans jeton', () => {
    const r = appeler(undefined);
    assert.strictEqual(r.suivant, false);
    assert.strictEqual(r.status, 401);
});

test('refuse un jeton visiteur (celui donné par /api/sync/init)', () => {
    const jetonVisiteur = jwt.sign({ cle: [] }, process.env.VISITOR_TOKEN_KEY);
    const r = appeler('Bearer ' + jetonVisiteur);
    assert.strictEqual(r.suivant, false);
    assert.strictEqual(r.status, 401);
});

test('refuse un jeton signé avec la clé admin mais sans role admin', () => {
    // C'était la faille : un jeton sans userId passait avant
    const jeton = jwt.sign({ cle: [] }, process.env.JWT_TOKEN_KEY);
    const r = appeler('Bearer ' + jeton);
    assert.strictEqual(r.suivant, false);
    assert.strictEqual(r.status, 403);
});

test('refuse un jeton admin expiré', () => {
    const jeton = jwt.sign({ userId: 1, role: 'admin' }, process.env.JWT_TOKEN_KEY, { expiresIn: -10 });
    const r = appeler('Bearer ' + jeton);
    assert.strictEqual(r.suivant, false);
    assert.strictEqual(r.status, 401);
});

test('accepte un vrai jeton admin', () => {
    const jeton = jwt.sign({ userId: 1, role: 'admin' }, process.env.JWT_TOKEN_KEY, { expiresIn: '12h' });
    const r = appeler('Bearer ' + jeton);
    assert.strictEqual(r.suivant, true);
});
