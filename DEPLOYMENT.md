# Déploiements TonMenu (Client, Pro/Courses, Admin, API)

Les quatre projets partagent le dépôt, mais restent séparés par origine et rôle. Les écrans financiers livrés ici fonctionnent en mode démo local; ils ne déclenchent aucun vrai encaissement ni reversement. Pour tester le parcours mock complet entre client/admin/Pro/coursier dans le même navigateur, utiliser le serveur preview racine du dépôt, pas des domaines Vercel différents.

## 1. Client

Projet Vercel Client : framework `Other`, Build Command `bash scripts/build-client.sh`, Output Directory `client-dist`. Le bundle comprend la vitrine `/`, la SPA `/accueil`, `shared/` et la page publique `/pro/courier.html`; il n’inclut pas le portail restaurant ni l’API. `vercel.json` conserve les rewrites SPA.

## 2. Restaurant & Courses (TonMenu Pro)

Créer/choisir le projet Vercel Pro, Root Directory `.` (racine du dépôt), Build Command `bash scripts/build-pro.sh`, Output Directory `pro-dist`. Le build inclut le portail partenaire, l’espace livreur et `shared/`. Alternative : Root Directory `pro`, sans build output, si le projet est configuré pour publier les fichiers statiques à cet emplacement; dans ce cas, `/shared/` doit être exposé au même origin via une règle Vercel.

## 3. Administration financière

Projet Vercel Admin, Root Directory `.` (racine), Build Command `bash scripts/build-admin.sh`, Output Directory `admin-dist`. La console démo ne possède pas encore d’authentification; ne pas l’exposer à des données réelles ou à des transactions. Ajouter RBAC admin côté API avant toute production.

## 4. API partagée

Projet API, Root Directory `backend`, framework `Other`; déployer les fonctions `/api`. `backend/schema.sql` et `backend/migrations/002_finance_and_couriers.sql` décrivent le schéma PostgreSQL/Neon cible. Appliquer en staging, vérifier les contraintes et politiques, puis seulement mettre en production. Les nouveaux écrans ne sont pas encore raccordés à ces routes : `shared/finance-store.js` persiste dans le navigateur pour la démo.

## Publication publique via GitHub Pages

Le workflow `.github/workflows/deploy-pages.yml` publie la branche `arena/55c8a4c0-leplats` après chaque push. Il assemble Client, Pro/Courses et Admin sous le préfixe `/leplats-/`, configure le fallback SPA `404.html`, puis déploie Pages. URL attendue : `https://monateliercoutures-alt.github.io/leplats-/`. La première activation de Pages doit utiliser la source **GitHub Actions** dans les paramètres du dépôt. Les apps partagent alors la même origine et le même stockage navigateur; le contenu reste une démo locale, pas un backend multi-utilisateur.

## Vérification et secrets

- Client: `bash scripts/build-client.sh`; Pro: `bash scripts/build-pro.sh`; Admin: `bash scripts/build-admin.sh`; Pages: `bash scripts/build-pages.sh`. Le répertoire `pages-dist/` est généré et ignoré par Git.
- Ne jamais commit `DATABASE_URL`, JWT signing key, numéros marchands réels ou identifiants Mobile Money. Les secrets sont configurés dans **Vercel → Project Settings → Environment Variables**.
- Vercel Deployments doit afficher `Ready` avant d’annoncer une publication. Déployer en preview avant production.
- Aucun vrai fournisseur SMS/WhatsApp/Mobile Money, webhook marchand, remboursement, stockage privé de documents, géolocalisation GPS live ni PWA push server n’est activé dans cette version.
