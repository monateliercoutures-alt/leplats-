# Déploiements TonMenu séparés

Les trois projets utilisent le même dépôt et la branche Preview `arena/7a8970cf-leplats`, mais leurs racines et leurs cycles de déploiement sont distincts.

## 1. TonMenu Client (projet Vercel existant)

Dans **Settings → Build and Deployment** : framework `Other`, Build Command `bash scripts/build-client.sh`, Output Directory `client-dist`. Ce build copie uniquement les fichiers Client (`index.html`, `app.js`, `styles.css`, `accueil/`, `images/`) ; il ne publie donc ni `pro/` ni `backend/`.

## 2. TonMenu Pro (nouveau projet Vercel)

Importer le même dépôt, choisir Root Directory `pro`, framework `Other`, sans commande de build et sans dossier de sortie. Voir `pro/DEPLOYMENT.md`.

## 3. API partagée (nouveau projet Vercel)

Importer le même dépôt, choisir Root Directory `backend`, framework `Other`, sans commande de build. Voir `backend/README.md` pour Neon et les variables secrètes.

Après les déploiements Pro et API, mettre l’URL publique de l’API dans `api-config.js` et `pro/api-config.js`, puis redéployer Client et Pro. La Preview ne touche pas à `main` ni à la production.
