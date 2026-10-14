# Crédits et attributions — LangitiaWeb / CartageOS

Ce document recense les ressources tierces utilisées dans ce dépôt, les conditions de leur utilisation, et la place de l’assistance par intelligence artificielle dans le développement.

**Dépôt :** [github.com/CR2429/LangitiaWeb](https://github.com/CR2429/LangitiaWeb)

---

## Auteur et propriété intellectuelle

| Élément | Titulaire |
|---------|-----------|
| Univers de fiction **Langitia**, lore, personnages, matricules, calendrier interne, textes narratifs | **CR2429** (propriétaire) |
| Code applicatif, architecture CartageOS, interface et intégrations | **CR2429** (propriétaire) |
| Contenu publié via la base MySQL / le système de fichiers du site | **CR2429** (propriétaire), sauf mention contraire |

L’univers narratif, les idées créatives, les choix de design immersif et les décisions produit proviennent du propriétaire du projet. Aucune ressource tierce ne revendique la paternité de ce conteur fictionnel.

---

## Utilisation de l’intelligence artificielle

Ce projet a été développé avec l’aide d’outils d’intelligence artificielle, **uniquement comme accélérateur de développement**.

| Point | Précision |
|-------|-----------|
| **Idées et direction** | Conception de l’univers Langitia, architecture CartageOS, parcours utilisateur, ton narratif et choix fonctionnels : **CR2429**. |
| **Rôle de l’IA** | Rédaction assistée de code, refactorisation, documentation technique, suggestions d’implémentation, gain de temps sur les tâches répétitives. |
| **Ce que l’IA n’est pas** | L’IA n’est pas co-auteure créative du lore ni décisionnaire sur la vision du projet. |
| **Relecture** | Le propriétaire valide, modifie et intègre le code et le contenu avant mise en production. |
| **Code tiers** | Lorsque l’IA s’appuie sur des bibliothèques ou exemples open source, leur utilisation respecte les licences listées ci-dessous. |

Toute personne souhaitant s’inspirer de ce dépôt est invitée à respecter à la fois la licence du code (voir section [Licence du projet](#licence-du-projet-recommandée)) et la propriété intellectuelle du contenu fictionnel Langitia.

---

## Échafaudages et modèles tiers

Ressources dont la structure ou le boilerplate ont servi de point de départ (licences permissives, usage conforme) :

| Ressource | Licence | Usage dans le projet | Lien |
|-----------|---------|----------------------|------|
| **Astro** | MIT | Structure du site (pages, gabarit, build statique) | [withastro/astro](https://github.com/withastro/astro) |
| **Vite** (template React + TypeScript) | MIT | Structure initiale du client, avant la migration vers Astro | [vitejs/vite](https://github.com/vitejs/vite) |
| **React** | MIT | Bureau CartageOS (fenêtres, terminal, Cœur Élémentaire) | [facebook/react](https://github.com/facebook/react) |
| **react-bootstrap-icons** (icônes dérivées de Bootstrap Icons) | MIT | Icônes dans l’interface CartageOS | [ismamz/react-bootstrap-icons](https://github.com/ismamz/react-bootstrap-icons) |
| **Phosphor Icons** (`mouse-left-click`, `mouse-right-click`) | MIT | Aide visuelle Cœur Élémentaire (pivoter / déposer) | [phosphor-icons/core](https://github.com/phosphor-icons/core) |

---

## Dépendances directes du site

Packages déclarés dans `package.json`. Chaque licence autorise l’utilisation dans un projet propriétaire ou open source, sous réserve de conserver les avis de copyright des auteurs originaux (inclus dans `node_modules/`).

Les dépendances de l’API et du bot Discord sont listées dans leurs propres dépôts (`langitia-api`, `langitia-bot`).

| Package | Version déclarée | Licence | Dépôt |
|---------|------------------|---------|-------|
| astro | ^7.3.8 | MIT | [withastro/astro](https://github.com/withastro/astro) |
| @astrojs/react | ^7.0.1 | MIT | [withastro/astro](https://github.com/withastro/astro) |
| marked | ^15.0.12 | MIT | [markedjs/marked](https://github.com/markedjs/marked) |
| react | ^19.0.0 | MIT | [facebook/react](https://github.com/facebook/react) |
| react-dom | ^19.0.0 | MIT | [facebook/react](https://github.com/facebook/react) |
| react-bootstrap-icons | ^1.11.5 | MIT | [ismamz/react-bootstrap-icons](https://github.com/ismamz/react-bootstrap-icons) |

### Dépendances de développement

| Package | Version déclarée | Licence | Dépôt |
|---------|------------------|---------|-------|
| @astrojs/check | ^0.9.10 | MIT | [withastro/astro](https://github.com/withastro/astro) |
| @types/node | ^22 | MIT | [DefinitelyTyped/DefinitelyTyped](https://github.com/DefinitelyTyped/DefinitelyTyped) |
| @types/react | ^19.1.4 | MIT | [DefinitelyTyped/DefinitelyTyped](https://github.com/DefinitelyTyped/DefinitelyTyped) |
| @types/react-dom | ^19.1.5 | MIT | [DefinitelyTyped/DefinitelyTyped](https://github.com/DefinitelyTyped/DefinitelyTyped) |
| typescript | ^6.0.3 | Apache-2.0 | [microsoft/TypeScript](https://github.com/microsoft/TypeScript) |

---

## Dépendances transitives

Les packages ci-dessus entraînent des dépendances indirectes (Astro → Vite, Rolldown, etc.). Leurs licences sont en majorité **MIT**, **ISC**, **BSD-2/3-Clause** ou **Apache-2.0**, toutes compatibles avec une utilisation dans ce projet.

Pour régénérer la liste complète à partir de l’arborescence installée :

```bash
npx license-checker --production --csv --out licenses-web.csv
```

Les fichiers `licenses-*.csv` ne sont pas versionnés par défaut ; ils servent à l’audit ponctuel.

### Points d’attention licence

| Package (transitif possible) | Licence | Note |
|------------------------------|---------|------|
| typescript | Apache-2.0 | Outil de développement seulement, non distribué avec le site. |

---

## Licence du projet (recommandée)

Le `package.json` racine indique actuellement **ISC**, ce qui est permissif mais peu explicite pour un projet créatif mixant code et univers fictionnel.

**Recommandation : séparer code et contenu.**

| Couche | Licence suggérée | Pourquoi |
|--------|------------------|----------|
| **Code source** (client, serveur, outils) | **MIT** | Simple, très répandue, compatible avec toutes les dépendances actuelles (MIT, BSD, Apache-2.0, ISC). Autorise réutilisation du code avec attribution. |
| **Contenu fictionnel Langitia** (lore, textes, personnages, assets narratifs) | **Tous droits réservés © CR2429** | Protège l’univers créatif indépendamment du code open source. |

### Alternatives selon l’objectif

| Objectif | Licence code |
|----------|--------------|
| Garder le code ouvert tout en protégeant le lore | **MIT** + clause de contenu dans `CREDITS.md` ou `CONTENT_LICENSE.md` |
| Contrôle maximal, pas d’open source | **UNLICENSED** / « All Rights Reserved » — le dépôt reste privé ou lecture seule |
| Obliger les dérivés du code à rester open source | **GPL-3.0** — plus contraignant, moins adapté si tu veux un site « fermé » sans friction |
| Protéger une version hébergée (SaaS) | **AGPL-3.0** — fort copyleft ; rarement nécessaire pour un projet personnel |

**En pratique pour LangitiaWeb :** MIT pour le code + mention « contenu fictionnel © CR2429, tous droits réservés » est le meilleur équilibre entre crédibilité open source, compatibilité des dépendances et protection de ton univers.

Pour appliquer MIT au code, ajouter un fichier `LICENSE` à la racine (texte standard MIT avec `Copyright (c) 2026 CR2429`) et mettre à jour le champ `"license": "MIT"` dans `package.json`.

---

## Mise à jour de ce document

Mettre à jour `CREDITS.md` lors de :

- ajout ou suppression de dépendances directes ;
- intégration de code ou d’assets tiers (snippet, police, image, librairie) ;
- changement de politique sur l’usage de l’IA ;
- changement de licence du projet.

*Dernière mise à jour : juin 2026*
