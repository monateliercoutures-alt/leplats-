# TonMenu centralisation financière & TonMenu Courses

## Portée de la version livrée

Les interfaces de démonstration sont dans `accueil/`, `admin/` et `pro/`. `shared/finance-core.js` contient les règles pures et `shared/finance-store.js` les adapte à `localStorage` pour un parcours **sur le même navigateur et la même origine**. Les écrans étiquettent explicitement les actions comme démo : aucun SMS, transfert Mobile Money, remboursement, stockage documentaire privé, webhook, géolocalisation serveur ou notification multi-appareil n’est exécuté. La clé `tonmenu-finance-demo-v1` n’est ni une base partagée ni un registre comptable de production.

Le schéma de persistance PostgreSQL est proposé dans `backend/migrations/002_finance_and_couriers.sql`; il doit être revu avec l’équipe comptable et appliqué via une migration en environnement de test avant production.

## Machine d’état

### Paiement client

`awaiting_payment → reported → confirmed | rejected | expired`

- Le paiement Mobile Money est adressé au numéro marchand TonMenu choisi dans les paramètres d’administration. La référence est obligatoire, de 5 à 80 caractères, le montant déclaré doit égaler le total et une référence active ne peut être réutilisée.
- `reported` reste en revue admin. Seul `confirmPayment` libère la commande vers le restaurant. Le restaurant n’a aucune action de validation financière.
- Rappel admin/client après le délai configuré (défaut 10 min); expiration/annulation au délai configuré (défaut 30 min). L’intervalle de balayage local est une simulation côté navigateur, pas un ordonnanceur fiable.
- Après annulation avec paiement déjà confirmé, `refundDue` est posé. Le remboursement complet/partiel exige un motif; le ledger reçoit une écriture négative, jamais une modification rétroactive.
- `cash_due → cash_collected` est déclaré par le livreur, sous réserve de commune et plafond admin.

### Commande

`payment_pending → payment_review → pending_restaurant → accepted → preparing → ready → delivering → delivered`

Variantes : espèces autorisées commencent en `pending_restaurant`; retrait passe de `ready → delivered`. Refus/annulation avant préparation annulent sans crédit; annulation après paiement confirmé crée un remboursement à traiter. Un litige place la commande en `disputed` et bloque les reversements liés. Les actions d’état sont contrôlées par `transitionOrder`.

### Course

`offered → accepted → at_restaurant → picked_up → en_route → delivered` (ou `declined/cancelled`). La livraison exige le code de remise à 4 chiffres. Une course espèces exige une déclaration du montant avant la clôture.

## Calculs ledger (entiers FCFA)

Après livraison uniquement, et de façon idempotente par commande :

- **Restaurant** : sous-total des plats − commission plateforme − promotion financée par le restaurant.
- **Livreur** : frais de livraison − part plateforme du livreur + pourboire.
- **TonMenu** : commission + frais de service + part plateforme de livraison + promotion imputée.
- **Espèces** : écriture négative `cash_due_to_tonmenu` correspondant au cash collecté qui ne revient pas au livreur; elle réduit son prochain reversement. Une collecte est rapprochée séparément.
- Chaque ligne est append-only; un paiement/reversement ultérieur crée une contre-écriture. Le schéma SQL interdit UPDATE/DELETE sur `ledger_entries`.

Génération des lots : période précédente lundi 00:00 à dimanche 23:59 UTC dans la démo; seuil sous `minPayout` reporté. Les lots sont validables; au-dessus du seuil de double approbation, deux identifiants admin distincts sont exigés par le cœur de règles. La clôture requiert une référence unique de virement et crée des contre-écritures.

## Écrans et chemins

- Client : `/paiement` puis `/commandes/:id`. Référence de transaction obligatoire et capture facultative (le fichier n’est pas téléversé en démo); affichage du marchand TonMenu, confirmation en attente, copie du numéro et limites d’espèces.
- Admin : `/admin/` — vue d’ensemble, paiements à confirmer, remboursements à traiter, reversements, gestion/attribution des livreurs, ledger/audit, paramètres.
- Restaurant : `/pro/` — les paiements non confirmés apparaissent séparément comme « En attente de paiement »; ils ne sont pas acceptables/préparables. Les finances montrent les crédits ledger et lots de reversement, sans validation client ni numéro marchand de restaurant.
- Candidat/livreur : `/pro/courier.html` — inscription + fichiers indiqués par noms seulement, OTP démo `123456`, formation 3 étapes, disponibilité, course, code de remise, espèces, portefeuille et profil.
- Site vitrine : lien « Devenir livreur » dans le pied de page; Client : lien dans Compte; Pro : action de candidature.

## Contrats API production à implémenter avant de traiter des paiements réels

1. `POST /api/customer/orders` ouvre une commande `awaiting_payment`; calculs de prix côté serveur.
2. `POST /api/customer/orders/:id/payment-report` valide référence/montant, téléverse la preuve dans un bucket privé et crée une demande de revue.
3. `GET /api/admin/payments`, `POST /api/admin/payments/:id/confirm|reject|request-info`, protégés par RBAC, CSRF et audit.
4. `POST /api/admin/orders/:id/refund` (idempotency key, montant ≤ solde remboursable, double contrôle selon seuil).
5. `POST /api/webhooks/mobile-money/:operator` accepte uniquement les webhooks signés/horodatés, contrôle l’idempotence et rapproche opérateur + montant + référence; ne jamais faire confiance à une valeur saisie par le client seule.
6. `POST /api/admin/payout-batches/generate`, `/approve`, `/mark-paid`, import/export, et `GET /api/beneficiary/statements/:period`.
7. Routes courier avec OTP réel, dépôt privé des documents, contrôle d’identité, offres verrouillées atomiquement, code de remise hashé, cash reconciliation et permissions par coursier.
8. Flux SSE/WebSocket authentifiés pour les états et position, rétention minimale des coordonnées, sauvegardes chiffrées, clés en secrets d’environnement et journal d’audit exportable.

Le prototype local ne fournit pas d’isolation par rôle. `/admin/` n’est pas protégé; il ne doit pas être exposé publiquement comme console financière. Avant production, ajouter un backend unique avec transactions DB atomiques, RLS/permissions vérifiées côté serveur, MFA admin, limitation de débit OTP, double validation et migration/seed. Ne jamais saisir de mot de passe, clé marchande, secret API ou capture d’identité dans Git ou dans le chat.
