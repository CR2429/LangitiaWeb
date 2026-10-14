# LangitiaWeb

Le site [langitia.com](https://langitia.com), fait avec **Astro** (pages publiques) et **React** (bureau CartageOS).

Ce projet est déployé par le dépôt `VPS` (voir son `start.sh`). Le site construit (`dist/`) est servi par le serveur `langitia-api`, placé à côté (`../api`).

## Pages

| Adresse | Fichier | Rôle |
|---|---|---|
| `/` | `src/pages/index.astro` | Accueil : présentation de Langitia (la page que Google indexe en priorité) |
| `/cartage/` | `src/pages/cartage.astro` | Le bureau CartageOS (composant React `src/components/Home.tsx`) |
| `/protocoles_de_securite/` | `src/pages/protocoles_de_securite.astro` | Protocoles de sécurité (texte lu dans `public/protocoles_de_securite/`) |
| page d'erreur | `src/pages/404.astro` | Fichier introuvable |

Toutes les pages utilisent le gabarit `src/layouts/BaseLayout.astro`, qui contient le titre, la description et les balises pour Google et les partages.

## Ajouter une page publique

1. Créer `src/pages/ma-page.astro` (copier `404.astro` comme modèle).
2. Donner un `title` et une `description` à `BaseLayout`.
3. Ajouter l'adresse dans `public/sitemap.xml`.

> Règle du site à énigmes : aucun secret ni solution dans les pages ou dans le code React. Tout ce qui est caché reste sur le serveur.

## Commandes

```bash
npm install
npm run dev       # http://localhost:4321 (les appels /api vont vers langitia-api sur le port 8080)
npm run build     # construit le site dans dist/
npm run check     # vérifie les types TypeScript et les fichiers .astro
```

Node.js 22.19 ou plus récent est recommandé (Node 24 LTS idéalement).
