# TonMenu Client — design system, routes & modèle mock

## Design system

Tokens principaux : rouge `#EC3D2E`, rouge foncé `#D32626`, jaune `#FFD633`, anthracite `#262826`, crème `#FDFBF7`, beige `#F8F4EE`, vert `#1F9D55`. DM Sans pour l’interface, Playfair Display italique pour le wordmark TonMenu. Rayons 10–16 px, filtres et actions en pilule, cible tactile ≥44 px, focus clavier visible.

Composants dans `accueil/mobile.js` : `RestaurantCard`, `FilterPill`, `BottomNav`, `SiteHeader`, `AddressPill`, `BottomSheet`, `OrderTimeline`, `MapView`, `CartBar`. Les styles responsive sont dans `accueil/mobile.css`.

## Mode appareil et navigation

`useDeviceMode()` retourne `app` si l’écran fait moins de 1024 px, si l’appareil est tactile, ou si la PWA est installée; sinon `site`. Le résultat est inscrit sur `<html>` dans le `<head>` avant le premier rendu. La racine `/` conserve la vitrine ordinateur; sur mobile, tactile ou PWA, elle redirige vers `/accueil`. Les autres écrans de commande sont routés dans la SPA Client.

Routes implémentées : `/accueil`, `/explorer`, `/restaurants`, `/restaurant/:id`, `/promotions`, `/panier`, `/paiement`, `/commandes?onglet=en-cours|historique`, `/commandes/:id`, `/compte`, `/compte/profil`, `/compte/adresses`, `/compte/favoris`, `/compte/codes-promo`, `/compte/langue`, `/compte/notifications`, `/compte/faq`, `/compte/suppression`. Les rewrites de `vercel.json` servent l’application sur ces URL profondes.

## Modèle de données de démonstration

- `Client`: `name`, `phone`, `email`, `avatar`, `createdAt`.
- `Address`: `id`, `label`, `street`, `landmark`, `building`, `instructions`, `phone`, `lat`, `lng`, `default`.
- `Restaurant`: `id`, `name`, `category`, `cuisine`, `image`, `rating`, `positive`, `reviews`, `eta`, `fee`, `free`, `distance`, `promo`, `sponsored`, `open`, `openAt`, `address`, `phone`, `hours`, `cash`, `lat`, `lng`, `dishes[]`.
- `Dish`: `id`, `name`, `description`, `price`, `image`, `category`, `badge`, `available`, `options[]` (groupes requis/facultatifs et suppléments).
- `Cart`: un seul `restaurantId`, lignes avec quantité/options/note/prix, code promo et réduction.
- `Order`: numéro, restaurant, lignes, adresse/mode/créneau, paiement, statut, référence, temps, code de remise, note et avis.
- `Preferences` et `Notification`: consentements locaux, messages d’étapes de commande.

Dix restaurants fictifs et leurs menus sont définis au début de `accueil/mobile.js`. Le compte, le panier, les adresses, favoris, commandes, codes et préférences sont conservés dans `localStorage` (`tm-client-v3`). Le code SMS de démonstration est `1234`.

## Parcours inclus

Invitation/connexion par téléphone + code, profil facultatif, choix et ajout d’adresse avec demande de géolocalisation explicite, recherche, filtres, favoris, fiche/menu et options, panier mono-restaurant, coupons `TONMENU15` et `BIENVENUE`, retrait/livraison, paiement Mobile Money en validation manuelle, espèces si le restaurant les accepte, confirmation/suivi simulé, historique, reçu imprimable, recommande, avis, compte et suppression des données locales. L’évolution d’une commande est simulée dans le navigateur afin de parcourir la timeline et d’émettre des notifications locales. Le service worker conserve le shell et les images déjà consultées; panier et données demeurent locaux hors ligne.

## Contrat API cible

Catalogue déjà amorcé dans `backend/api/[...path].js` :

- `GET /api/restaurants`, `GET /api/restaurants/:slug` — restaurants publiés et plats disponibles.
- `POST /api/orders` — prix et disponibilité recalculés côté serveur.
- `POST /api/auth/register`, `POST /api/auth/login` — comptes partenaires (l’authentification Client devra être ajoutée séparément).
- `GET /api/partner/bootstrap`, `PATCH /api/partner/restaurant`, `/api/partner/dishes`, `/api/partner/orders`, `/api/partner/promotions`, `/api/partner/reviews` — portail Pro.

Pour une prochaine étape Client persistante, ajouter notamment `/api/auth/customer/*`, `/api/customer/profile`, `/api/customer/addresses`, `/api/orders/:id`, `/api/orders/:id/cancel`, `/api/orders/:id/review`, `/api/customer/favorites`, `/api/customer/notifications` et des événements WebSocket/SSE pour les statuts. Modèles serveur à prévoir : `customers`, `addresses`, `restaurants`, `dishes`, `option_groups`, `option_items`, `carts` (ou calcul serveur à la validation), `orders`, `order_items`, `payments`, `couriers`, `reviews`, `favorites`, `promo_codes`, `notifications`.

## Périmètre de démonstration / avant production

Aucune donnée Client n’est encore synchronisée au backend. Les cartes sont dessinées localement (pas de fournisseur de cartes), les distances/frais sont des valeurs mock, l’identité OTP/Google, le flux réel SMS/WhatsApp, l’intégration opérateur Mobile Money, les notifications push serveur, la position livreur, les remboursements et l’API Client restent à brancher. Le paiement reste en attente jusqu’à confirmation simulée. Ne pas utiliser les données de démonstration pour traiter de vraies commandes.
