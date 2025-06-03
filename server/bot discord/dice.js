const pool = require('../db');

function roll(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports = {
  d2: () => roll(1, 2),
  d3: () => roll(1, 3),
  d4: () => roll(1, 4),
  d5: () => roll(1, 5),
  d9: () => roll(1, 9),
  d10: () => roll(1, 10),
  d20: () => roll(1, 20),
  d30: () => roll(1, 30),
  d80: () => roll(1, 80),

  d100: async (interaction = null) => {
    const result = roll(1, 100);

    if (interaction) {
      try {
        const userId = interaction.user.id;

        const conn = await pool.getConnection();
        try {
          await conn.execute(
            "INSERT INTO dice_logs (user_id, result) VALUES (?, ?)",
            [userId, result]
          );
        } finally {
          conn.release();
        }

        console.log(`🎲 d100 enregistré pour ${userId} : ${result}`);
      } catch (err) {
        console.error("Erreur SQL d'enregistrement du dé :", err);
      }
    }

    return result;
  }
};
