# TonMenu API partagée (Vercel + Neon)

Ce dossier constitue le troisième projet indépendant : Client et Pro y accèdent par HTTP, sans dépendre l’un de l’autre. Il utilise les fonctions Node Vercel (`api/[...path].js`) et Neon Postgres.

## Mise en route

1. Créer une base Neon et exécuter `schema.sql` dans son éditeur SQL. Pour la Preview uniquement, exécuter ensuite `seed-demo.sql` afin d’afficher un restaurant fictif côté client.
2. Dans Vercel, importer le même dépôt, choisir la branche Preview `arena/7a8970cf-leplats` et définir **Root Directory** sur `backend` (Framework **Other**, aucune commande de build).
3. Configurer les variables secrètes du projet API :
   - `DATABASE_URL` — chaîne de connexion Neon ;
   - `JWT_SECRET` — secret aléatoire d’au moins 32 caractères ;
   - `ALLOWED_ORIGINS` — origines Client et Pro séparées par des virgules, si les domaines sont personnalisés.
4. Après le premier déploiement, copier l’URL publique de l’API dans `api-config.js` à la racine et `pro/api-config.js`, puis redéployer les trois projets.

Ne jamais placer `DATABASE_URL` ou `JWT_SECRET` dans le code frontend ni dans Git.

## Routes prévues

- `GET /api/health` : vérification de l’API et de Neon ;
- `GET /api/restaurants` et `GET /api/restaurants/:slug` : catalogue public des restaurants validés et plats disponibles ;
- `POST /api/orders` : création d’une commande, avec prix recalculés côté serveur ;
- `POST /api/auth/register`, `POST /api/auth/login` : brouillon partenaire et connexion JWT ;
- `GET /api/partner/bootstrap` : restaurant, menu, commandes, promotions et avis du partenaire connecté ;
- `/api/partner/restaurant`, `/api/partner/dishes`, `/api/partner/orders`, `/api/partner/promotions`, `/api/partner/reviews` : gestion partenaire authentifiée.

Le statut Mobile Money est enregistré pour validation manuelle ; cette API n’effectue pas de transfert d’argent. Un restaurant reste invisible côté client tant que son `approval_status` n’est pas passé à `approved`. La vérification SMS n’est pas branchée : le code `123456` de l’interface reste un code de démonstration, à remplacer par un fournisseur SMS avant une mise en production.
