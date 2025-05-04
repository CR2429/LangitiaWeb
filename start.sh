#!/bin/bash

echo "🚫 Arrêt des processus existants (PM2)..."
pm2 delete langitia-server 2>/dev/null || true

echo "📥 Pull du dernier code depuis Git..."
git reset --hard origin/main

echo "📦 Mise à jour des dépendances dans /client..."
cd client
npm install
npm audit fix || true
npm run build

echo "📦 Mise à jour des dépendances dans /server..."
cd ../server
npm install
npm audit fix || true

echo "🚀 Démarrage du serveur avec PM2..."
pm2 start server.js --name langitia-server
pm2 save

echo "✅ Déploiement terminé ! Le serveur tourne maintenant avec PM2."
