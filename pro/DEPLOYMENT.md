# Déploiement séparé de TonMenu Pro

TonMenu Pro est autonome et peut être déployé comme un projet Vercel distinct du site client.

## Créer le projet Vercel Pro

1. Dans Vercel, créer un projet et importer `monateliercoutures-alt/leplats-`.
2. Choisir la branche `arena/7a8970cf-leplats` pour une Preview.
3. Régler **Root Directory** sur `pro`.
4. Choisir **Other** comme framework ; ne définir ni commande de build ni dossier de sortie.
5. Déployer. Vercel attribuera une adresse temporaire `*.vercel.app`.

Les chemins HTML, les icônes, les images, le manifeste et le service worker sont relatifs au projet : le même portail marche donc à `/pro/` dans le projet client et à la racine de ce projet séparé. Les images utilisées par Pro sont regroupées dans `media/`.

## Connexion à l’API partagée

Après le déploiement du projet API, définir `window.TONMENU_API_BASE_URL` dans `api-config.js` avec l’adresse publique de cette API. Le navigateur et le backend devront autoriser les origines Vercel Client et Pro.
