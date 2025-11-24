const express = require("express");
const jwt = require("jsonwebtoken");
const pool = require("../db");

const router = express.Router();
const SECRET = process.env.JWT_TOKEN_KEY || "cartage_secret_key";

// =====================================================
// 🔧 UTILITAIRES
// =====================================================
function createToken(state = { cle: [] }) {
  return jwt.sign(state, SECRET);
}

function decodeToken(token) {
  try {
    return jwt.verify(token, SECRET);
  } catch {
    return { cle: [] };
  }
}

// =====================================================
// 🔹 1. INIT SYNC — Première connexion
// =====================================================
router.post("/init", (req, res) => {
  const token = createToken({ cle: [] });
  res.json({ token });
});

// =====================================================
// 🔹 2. SYNC — Synchronisation différentielle
// =====================================================
router.post("/", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  const state = decodeToken(token);
  const clientFiles = Array.isArray(req.body.files) ? req.body.files : [];

  try {
    // 1️⃣ Récupération de tous les fichiers accessibles selon les clés
    let query = `
      SELECT id, title, type, content, key_required, updated_at
      FROM files
      WHERE key_required IS NULL
    `;
    const params = [];

    if (state.cle.length > 0) {
      const placeholders = state.cle.map(() => "?").join(",");
      query += ` OR key_required IN (${placeholders})`;
      params.push(...state.cle);
    }

    const [accessibleFiles] = await pool.query(query, params);

    // 2️⃣ Création d’un index rapide pour comparaison
    const serverFilesById = new Map(accessibleFiles.map(f => [f.id, f]));

    const newFiles = [];
    const updatedFiles = [];
    const deletedFiles = [];

    // 3️⃣ Détection des fichiers supprimés ou non autorisés
    for (const cf of clientFiles) {
      const serverFile = serverFilesById.get(cf.id);
      if (!serverFile) {
        deletedFiles.push(cf.id); // n’existe plus ou non autorisé
      }
    }

    // 4️⃣ Détection des nouveaux fichiers ou des fichiers mis à jour
    for (const sf of accessibleFiles) {
      const clientMatch = clientFiles.find(f => f.id === sf.id);
      if (!clientMatch) {
        // Fichier nouveau pour le client
        newFiles.push(sf);
      } else if (
        new Date(sf.updated_at).getTime() !==
        new Date(clientMatch.updated_at).getTime()
      ) {
        // Fichier mis à jour
        updatedFiles.push(sf);
      }
    }

    res.json({
      token, // même token renvoyé (ou tu peux régénérer)
      new_files: newFiles,
      updated_files: updatedFiles,
      deleted_files: deletedFiles
    });
  } catch (err) {
    console.error("❌ Sync error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// =====================================================
// 🔹 3. ADD-KEY — Ajout d'une clé et mise à jour du token
// =====================================================
router.post("/add-key", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  const { keys } = req.body;
  if (!Array.isArray(keys) || keys.length === 0)
    return res.status(400).json({ error: "No keys provided" });

  let state = decodeToken(token);
  let newKeys = [];

  try {
    // 1️⃣ Trouver les clés valides (fichiers accessibles qui donnent une clé)
    let query = `
      SELECT key_give
      FROM files
      WHERE key_required IS NULL
    `;
    const params = [];

    if (state.cle.length > 0) {
      const placeholders = state.cle.map(() => "?").join(",");
      query += ` OR key_required IN (${placeholders})`;
      params.push(...state.cle);
    }

    const [rows] = await pool.query(query, params);
    const validKeys = new Set(rows.map(f => f.key_give).filter(Boolean));

    // 2️⃣ Ajoute les nouvelles clés valides
    for (const key of keys) {
      if (validKeys.has(key) && !state.cle.includes(key)) {
        state.cle.push(key);
        newKeys.push(key);
      }
    }

    if (newKeys.length === 0)
      return res.status(403).json({ error: "No valid keys provided" });

    // 3️⃣ Génère un nouveau token mis à jour
    const newToken = createToken(state);

    res.json({
      token: newToken,
      cle: state.cle
    });
  } catch (err) {
    console.error("❌ Add-key error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
