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

  d100: async (interaction = null, count = 1) => {
    const results = [];
    const userId = interaction?.user?.id;

    try {
      const conn = await pool.getConnection();
      try {
        // 1. Charger la distribution une seule fois
        console.log("📊 Chargement de la distribution depuis la base de données...");
        const [distributionRows] = await conn.query("SELECT value, count FROM dice_distribution");

        const total = distributionRows.reduce((sum, row) => sum + row.count, 0) || 1;
        const target = total / 100;
        console.log(`📈 Total d'enregistrements : ${total} | Cible par valeur : ${target.toFixed(2)}`);

        // 2. Créer une fonction de lancer pondéré
        console.log("🧠 Calcul des poids pondérés...");
        const weighted = [];
        distributionRows.forEach(row => {
          const diff = target - row.count;
          const ratio = diff / target;
          const weight = 1 + ratio;
          const adjusted = Math.max(0.01, weight); // empêcher 0
          weighted.push({ value: row.value, weight: adjusted });
        });

        const totalWeight = weighted.reduce((sum, w) => sum + w.weight, 0);
        const cumulative = [];
        let acc = 0;
        for (const { value, weight } of weighted) {
          acc += weight;
          cumulative.push({ value, threshold: acc / totalWeight });
        }
        console.log("🎯 Fonction de tirage biaisé prête.");

        function biasedRoll() {
          const rand = Math.random();
          for (const { value, threshold } of cumulative) {
            if (rand <= threshold) return value;
          }
          return 100; // fallback
        }

        // 3. Faire les lancers localement
        console.log(`🎲 Début du lancer de ${count} dés...`);
        for (let i = 0; i < count; i++) {
          const result = biasedRoll();
          results.push([userId, result]);

          let prog_log = false;
          if (count >= 100 && i % Math.floor(count / 10) === 0) {
            prog_log = true;
            const percent = Math.floor((i / count) * 100);
            console.log(`⏳ Progression : ${percent}% (${i}/${count})`);
          }
          if (prog_log) {
            console.log(`⏳ Progression : 100% (${count}/${count})`)
          }
        }
        console.log(`✅ Lancers terminés.`);

        // 4. Enregistrer les résultats
        if (interaction) {
          console.log("💾 Insertion des résultats dans dice_logs...");
          await conn.query("INSERT INTO dice_logs (user_id, result) VALUES ?", [results]);
          console.log(`🎲 ${count} d100 enregistrés pour ${userId}`);
        }

        // 5. Mise à jour groupée de la distribution
        console.log("🔁 Mise à jour de la distribution...");
        const updateMap = new Map();
        results.forEach(([, value]) => {
          updateMap.set(value, (updateMap.get(value) || 0) + 1);
        });

        for (const [value, delta] of updateMap.entries()) {
          await conn.query("UPDATE dice_distribution SET count = count + ? WHERE value = ?", [delta, value]);
        }
        console.log("📦 Mise à jour terminée.");

      } finally {
        conn.release();
      }

    } catch (err) {
      console.error("❌ Erreur SQL lors du lancer ou de la mise à jour :", err);
    }

    return results.map(r => r[1]);
  }

};
