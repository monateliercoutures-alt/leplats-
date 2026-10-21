# API partagée TonMenu (Vercel + PostgreSQL/Neon)

L’API actuelle (`api/[...path].js`) sert le catalogue et le portail partenaire historique. Le module centralisation financière livré dans cette branche est encore **mocké côté navigateur**; il ne remplace pas les routes de production par un système sécurisé.

## Schéma PostgreSQL

1. Exécuter `schema.sql` sur une base **staging**.
2. Examiner et appliquer `migrations/002_finance_and_couriers.sql` ensuite. Cette migration ajoute paiements clients, paramètres marchands, ledger append-only, wallets calculés, lots/reversements, livreurs/documents/courses, espèces, litiges et journal d’audit. Elle élargit les contraintes de statuts d’`orders`.
3. Tester les migrations et les contraintes (notamment trigger d’immutabilité ledger et unicité des références) avant toute donnée réelle.

Aucune base n’est provisionnée par cette branche; `seed-demo.sql` concerne seulement l’ancien catalogue Pro. Ne pas exécuter la migration en production sans sauvegarde, revue comptable, RLS/RBAC et plan de rollback.

## Déploiement API

Projet Vercel indépendant, Root Directory `backend`, Framework `Other`, sans build command. Configurer uniquement dans les secrets Vercel :

- `DATABASE_URL` — chaîne PostgreSQL ;
- `JWT_SECRET` — secret aléatoire d’au moins 32 caractères ;
- `ALLOWED_ORIGINS` — origines autorisées Client, Pro/Courses et Admin.

Ne jamais placer ces variables dans le frontend, Git ou le chat. Après déploiement, renseigner l’URL d’API dans `api-config.js` et `pro/api-config.js`, puis effectuer des essais en staging.

## Routes de catalogue et Pro déjà amorcées

- `GET /api/health`, `GET /api/restaurants`, `GET /api/restaurants/:slug`;
- `POST /api/orders` (l’ancienne route n’est pas encore reliée à la nouvelle file de revue des paiements);
- `POST /api/auth/register`, `POST /api/auth/login`;
- `GET /api/partner/bootstrap`, `/api/partner/restaurant`, `/api/partner/dishes`, `/api/partner/orders`, `/api/partner/promotions`, `/api/partner/reviews`.

## Routes de finance à construire et sécuriser côté serveur

Le mock et le SQL décrivent les contrats, mais **ces routes ne sont pas implémentées dans l’API actuelle** :

- `POST /api/customer/orders`; `POST /api/customer/orders/:id/payment-report`;
- `GET /api/admin/payments`; `POST /api/admin/payments/:id/confirm|reject|request-info`;
- `POST /api/admin/orders/:id/refund`;
- `POST /api/admin/payout-batches/generate|approve`; `POST /api/admin/payouts/:id/mark-paid`;
- `POST /api/webhooks/mobile-money/:operator` (future, signature vérifiée et idempotence);
- `POST /api/couriers/applications`, `/api/courier/jobs/:id/*`, `/api/courier/cash-collections`;
- relevés, exports comptables et flux SSE/WebSocket authentifiés.

Seul l’admin doit pouvoir confirmer un paiement, traiter un remboursement et valider/clôturer un reversement. Le prototype `/admin/` n’a pas de contrôle d’accès et ne doit pas être exposé à des données ou transferts réels. Le code OTP `123456`, les captures (nom de fichier local), le partage `localStorage` et la géolocalisation de démo ne constituent pas une authentification, un stockage de document ou un registre comptable.
