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

Ce projet a été développé avec l’aide d’outils d’intelligence artificielle (notamment **Cursor** et des modèles de langage associés), **uniquement comme accélérateur de développement**.

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
| **Vite** — template React + TypeScript | MIT | Structure initiale du client (`client/`), configuration Vite, ESLint de base | [vitejs/vite](https://github.com/vitejs/vite) |
| **React** | MIT | Framework UI du client | [facebook/react](https://github.com/facebook/react) |
| **react-bootstrap-icons** (icônes dérivées de Bootstrap Icons) | MIT | Icônes dans l’interface CartageOS | [ismamz/react-bootstrap-icons](https://github.com/ismamz/react-bootstrap-icons) |

---

## Dépendances directes — serveur (racine)

Packages déclarés dans le `package.json` racine. Chaque licence autorise l’utilisation dans un projet propriétaire ou open source, sous réserve de conserver les avis de copyright des auteurs originaux (inclus dans `node_modules/`).

| Package | Version déclarée | Licence | Dépôt |
|---------|------------------|---------|-------|
| bcryptjs | ^3.0.2 | BSD-3-Clause | [dcodeIO/bcrypt.js](https://github.com/dcodeIO/bcrypt.js) |
| cors | ^2.8.5 | MIT | [expressjs/cors](https://github.com/expressjs/cors) |
| discord.js | ^14.14.1 | Apache-2.0 | [discordjs/discord.js](https://github.com/discordjs/discord.js) |
| dotenv | ^16.5.0 | BSD-2-Clause | [motdotla/dotenv](https://github.com/motdotla/dotenv) |
| exceljs | ^4.4.0 | MIT | [exceljs/exceljs](https://github.com/exceljs/exceljs) |
| express | ^4.21.2 | MIT | [expressjs/express](https://github.com/expressjs/express) |
| express-rate-limit | ^7.5.0 | MIT | [express-rate-limit/express-rate-limit](https://github.com/express-rate-limit/express-rate-limit) |
| helmet | ^8.1.0 | MIT | [helmetjs/helmet](https://github.com/helmetjs/helmet) |
| jsonwebtoken | ^9.0.2 | MIT | [auth0/node-jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) |
| luxon | ^3.6.1 | MIT | [moment/luxon](https://github.com/moment/luxon) |
| marked | ^15.0.12 | MIT | [markedjs/marked](https://github.com/markedjs/marked) |
| moment-timezone | ^0.6.0 | MIT | [moment/moment-timezone](https://github.com/moment/moment-timezone) |
| mysql2 | ^3.14.1 | MIT | [sidorares/node-mysql2](https://github.com/sidorares/node-mysql2) |
| path | ^0.12.7 | MIT | [jinder/path](https://github.com/jinder/path) |
| react-bootstrap-icons | ^1.11.6 | MIT | [ismamz/react-bootstrap-icons](https://github.com/ismamz/react-bootstrap-icons) |
| uuid | ^11.1.1 | MIT | [uuidjs/uuid](https://github.com/uuidjs/uuid) |

### Dépendances de développement — serveur

| Package | Version déclarée | Licence | Dépôt |
|---------|------------------|---------|-------|
| @types/react | ^19.1.4 | MIT | [DefinitelyTyped/DefinitelyTyped](https://github.com/DefinitelyTyped/DefinitelyTyped) |
| concurrently | ^7.0.0 | MIT | [open-cli-tools/concurrently](https://github.com/open-cli-tools/concurrently) |

---

## Dépendances directes — client

| Package | Version déclarée | Licence | Dépôt |
|---------|------------------|---------|-------|
| react | ^19.0.0 | MIT | [facebook/react](https://github.com/facebook/react) |
| react-bootstrap-icons | ^1.11.5 | MIT | [ismamz/react-bootstrap-icons](https://github.com/ismamz/react-bootstrap-icons) |
| react-dom | ^19.0.0 | MIT | [facebook/react](https://github.com/facebook/react) |
| react-router-dom | ^7.4.0 | MIT | [remix-run/react-router](https://github.com/remix-run/react-router) |

### Dépendances de développement — client

| Package | Version déclarée | Licence | Dépôt |
|---------|------------------|---------|-------|
| @eslint/js | ^9.21.0 | MIT | [eslint/eslint](https://github.com/eslint/eslint) |
| @types/react | ^19.1.4 | MIT | [DefinitelyTyped/DefinitelyTyped](https://github.com/DefinitelyTyped/DefinitelyTyped) |
| @types/react-dom | ^19.1.5 | MIT | [DefinitelyTyped/DefinitelyTyped](https://github.com/DefinitelyTyped/DefinitelyTyped) |
| @vitejs/plugin-react-swc | ^3.8.0 | MIT | [vitejs/vite-plugin-react](https://github.com/vitejs/vite-plugin-react) |
| concurrently | ^9.1.2 | MIT | [open-cli-tools/concurrently](https://github.com/open-cli-tools/concurrently) |
| eslint | ^9.21.0 | MIT | [eslint/eslint](https://github.com/eslint/eslint) |
| eslint-plugin-react-hooks | ^5.1.0 | MIT | [facebook/react](https://github.com/facebook/react) |
| eslint-plugin-react-refresh | ^0.4.19 | MIT | [ArnaudBarre/eslint-plugin-react-refresh](https://github.com/ArnaudBarre/eslint-plugin-react-refresh) |
| globals | ^15.15.0 | MIT | [sindresorhus/globals](https://github.com/sindresorhus/globals) |
| typescript | ~5.7.2 | Apache-2.0 | [microsoft/TypeScript](https://github.com/microsoft/TypeScript) |
| typescript-eslint | ^8.24.1 | MIT | [typescript-eslint/typescript-eslint](https://github.com/typescript-eslint/typescript-eslint) |
| vite | ^6.2.0 | MIT | [vitejs/vite](https://github.com/vitejs/vite) |

---

## Dépendances transitives

Les packages ci-dessus entraînent des dépendances indirectes (Express → body-parser, Discord.js → @discordjs/*, ExcelJS → archiver, etc.). Leurs licences sont en majorité **MIT**, **ISC**, **BSD-2/3-Clause** ou **Apache-2.0**, toutes compatibles avec une utilisation dans ce projet.

Pour régénérer la liste complète à partir de l’arborescence installée :

```bash
# Serveur (racine)
npx license-checker --production --csv --out licenses-server.csv

# Client
cd client && npx license-checker --production --csv --out licenses-client.csv
```

Les fichiers `licenses-*.csv` ne sont pas versionnés par défaut ; ils servent à l’audit ponctuel.

### Points d’attention licence

| Package (transitif possible) | Licence | Note |
|------------------------------|---------|------|
| jszip (via exceljs) | MIT **ou** GPL-3.0-or-later | Usage courant sous branche **MIT** ; conserver l’avis de licence du package. |
| bcryptjs | BSD-3-Clause | Conserver copyright et clause de non-garantie. |
| discord.js / @discordjs/* | Apache-2.0 | Conserver NOTICE si redistribution du code source. |

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
