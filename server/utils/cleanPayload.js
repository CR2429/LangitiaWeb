// Prépare le corps d'une requête avant de l'enregistrer dans access_logs.
// Les champs sensibles (mot de passe, jeton...) sont remplacés par "[masqué]"
// pour ne JAMAIS les stocker en clair dans la base.

const CHAMPS_SENSIBLES = ['password', 'token', 'jwt'];
const TAILLE_MAX = 2000;

function cleanPayload(body) {
    if (!body || typeof body !== 'object') {
        return null;
    }

    // Copie du corps pour ne pas modifier la vraie requête
    const copie = { ...body };

    for (const champ of CHAMPS_SENSIBLES) {
        if (champ in copie) {
            copie[champ] = '[masqué]';
        }
    }

    let texte = JSON.stringify(copie);
    if (texte.length > TAILLE_MAX) {
        texte = texte.slice(0, TAILLE_MAX) + '... (tronqué)';
    }
    return texte;
}

module.exports = cleanPayload;
