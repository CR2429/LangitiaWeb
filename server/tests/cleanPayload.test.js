// Tests de cleanPayload : les mots de passe ne doivent jamais arriver dans access_logs.
const test = require('node:test');
const assert = require('node:assert');
const cleanPayload = require('../utils/cleanPayload');

test('masque le mot de passe du login', () => {
    const texte = cleanPayload({ user: 'admin', password: 'secret123' });
    assert.ok(!texte.includes('secret123'));
    assert.ok(texte.includes('[masqué]'));
    assert.ok(texte.includes('admin'));
});

test('masque les jetons', () => {
    const texte = cleanPayload({ token: 'abc.def.ghi' });
    assert.ok(!texte.includes('abc.def.ghi'));
});

test('ne modifie pas le vrai corps de la requête', () => {
    const body = { password: 'secret123' };
    cleanPayload(body);
    assert.strictEqual(body.password, 'secret123');
});

test('retourne null si pas de corps', () => {
    assert.strictEqual(cleanPayload(undefined), null);
});

test('coupe les corps trop longs', () => {
    const texte = cleanPayload({ texte: 'a'.repeat(5000) });
    assert.ok(texte.length < 2100);
});
