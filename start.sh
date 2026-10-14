#!/bin/bash
# Déploiement sur le serveur de prod.
# Le site (apps/web + apps/api) et le bot (apps/bot) tournent dans 2 processus PM2 séparés.

# Arrête le script à la première erreur
set -e

# Se place à la racine du projet (là où est ce script)
cd "$(dirname "$0")"

# Chaque app a son propre .env (voir apps/api/.env.example et apps/bot/.env.example)
for fichier in apps/api/.env apps/bot/.env; do
  if [ ! -f "$fichier" ]; then
    echo "❌ Fichier manquant : $fichier (copier le .env.example du même dossier)."
    exit 1
  fi
done

echo "🚫 Arrêt des processus existants (PM2)..."
pm2 delete langitia-server 2>/dev/null || true
pm2 delete langitia-bot 2>/dev/null || true

echo "📥 Pull du dernier code depuis Git..."
git reset --hard origin/main
git pull

# npm ci installe exactement les versions du package-lock.json (déploiement reproductible)
echo "📦 Site : build du client (apps/web)..."
cd apps/web
npm ci
npm run build
cd ../..

echo "📦 Site : dépendances du serveur (apps/api)..."
cd apps/api
npm ci --omit=dev
pm2 start server.js --name langitia-server
cd ../..

echo "🤖 Bot Discord (apps/bot)..."
cd apps/bot
npm ci --omit=dev
pm2 start bot.js --name langitia-bot
cd ../..

pm2 save

echo "✅ Déploiement terminé ! Le site et le bot tournent avec PM2."
