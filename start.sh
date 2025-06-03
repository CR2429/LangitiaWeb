#!/bin/bash

echo "🚫 Arrêt des processus existants (PM2)..."
pm2 delete langitia-server 2>/dev/null || true
pm2 delete langitia-bot 2>/dev/null || true

echo "📥 Pull du dernier code depuis Git..."
git reset --hard origin/main
git pull

echo "📦 Mise à jour des dépendances dans /client..."
cd client
npm install
npm audit fix || true
npm run build

echo "📦 Mise à jour des dépendances dans /server..."
cd ../server
npm install
npm audit fix || true

echo "🚀 Démarrage du serveur Node.js avec PM2..."
pm2 start server.js --name langitia-server

echo "🤖 Démarrage du bot Node.js avec PM2..."
cd ../bot_dicord
npm install
pm2 start bot.js --name langitia-bot

pm2 save

echo "✅ Déploiement terminé ! Le serveur tourne maintenant avec PM2."
