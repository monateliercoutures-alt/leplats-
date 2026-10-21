# Déploiement de TonMenu Pro & Courses

TonMenu Pro est indépendant du Client et du panneau Admin. Pour inclure également la mini-application livreur à la racine du domaine Pro :

1. Dans Vercel, importer `monateliercoutures-alt/leplats-`.
2. Choisir **Root Directory** `.` (racine du dépôt).
3. Choisir **Other** comme framework.
4. Build Command : `bash scripts/build-pro.sh`.
5. Output Directory : `pro-dist`.
6. Vérifier les logs et l’URL `/` (portail restaurant) ainsi que `/courier.html` (livreurs).

Le build copie le portail Pro, les ressources `media/`, le module partagé `shared/finance-*` et l’application livreur. Le lien livreur est aussi inclus dans le Client en `/pro/courier.html` pour la démo. Pour une publication GitHub Pages au même domaine de projet, le workflow racine publie les trois espaces et le coursier ensemble sous `/leplats-/`.

## Backend

`pro/api-config.js` ne définit pas l’URL d’API par défaut. Ne la renseigner qu’après publication de l’API partagée, application des migrations et tests RBAC. En mode démo, les finances restent dans `localStorage` et ne doivent pas être utilisées pour des commandes ou paiements réels. Les origines Client, Pro/Courses et Admin devront être autorisées côté API.
