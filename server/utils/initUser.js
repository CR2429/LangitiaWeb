const bcrypt = require('bcrypt');
const pool = require('../db');

async function resetUsersOnStartup() {
    try {
        const raw = process.env.USER_JSON;
        if (!raw) {
            console.warn('⚠️ Aucune variable USER_JSON trouvée.');
            return;
        }

        let users;
        try {
            users = JSON.parse(raw);
        } catch (parseError) {
            console.error('❌ USER_JSON est mal formé :', parseError);
            return;
        }

        await pool.query('DELETE FROM users');

        for (const user of users) {
            if (!user.user || !user.password) {
                console.warn('⚠️ Utilisateur invalide détecté et ignoré :', user);
                continue;
            }

            const hashedPassword = await bcrypt.hash(user.password, 10);
            await pool.query(
                'INSERT INTO users (user, password) VALUES (?, ?)',
                [user.user, hashedPassword]
            );
        }

        console.log(`✅ ${users.length} utilisateurs réinitialisés depuis USER_JSON`);
    } catch (err) {
        console.error('❌ Erreur lors du reset des utilisateurs :', err);
    }
}

module.exports = resetUsersOnStartup;
