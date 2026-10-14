# Langitia.com

Ce dépôt contient **3 applications indépendantes**. Chacune a son propre `package.json`, son propre `node_modules` et son propre `.env`.

| Dossier | Quoi | Lancer |
|---|---|---|
| `apps/web` | Le site CartageOS (React + TypeScript + Vite) : ce que voit le visiteur | `npm run dev` (avec l'API) |
| `apps/api` | Le serveur du site (Express + MySQL) : sert `apps/web/dist` et les routes `/api` | `npm run dev` (avec le site) |
| `apps/bot` | Le bot Discord de JDR (dés, stats, crystite...). **Aucun lien avec le site**, à part la même base MySQL | `npm run dev:bot` |

## Première installation

```bash
npm run install:all
cp apps/api/.env.example apps/api/.env   # puis remplir les vraies valeurs
cp apps/bot/.env.example apps/bot/.env   # puis remplir les vraies valeurs
```

## Commandes (depuis la racine)

| Commande | Effet |
|---|---|
| `npm run dev` | Lance l'API (port 8080) et le site (port 5173) en même temps |
| `npm run dev:bot` | Lance le bot Discord |
| `npm run build` | Construit le site dans `apps/web/dist` |
| `npm test` | Lance les tests de l'API |

> Attention : pour l'instant, l'API et le bot se connectent à la **base de prod** (`langitia.com`), même en local. Au démarrage, l'API recrée la table `users` à partir de `USER_JSON`.

## Déploiement

Sur le serveur : `./start.sh`. Le script fait un `git reset --hard origin/main`, construit le site, puis lance 2 processus PM2 : `langitia-server` (site) et `langitia-bot` (bot).

## Le lore

Le lore privé est dans `lore-source/`, un dépôt git séparé et privé. Il n'est jamais commité ici.
