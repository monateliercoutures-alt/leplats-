# TonMenu — Le goût du quartier

Landing page TonMenu reproduite à partir des captures fournies. Les sections sont assemblées avec des Web Components natifs (sans framework lourd), les images de contenu sont optimisées en WebP et les interactions de démonstration n'ont pas de backend connecté.

## Développement local

```bash
python3 -m http.server 4173 --bind 0.0.0.0
```

Puis ouvrir `http://localhost:4173`. Sur un écran de moins de 1024 px, un appareil tactile ou une PWA installée, la page vitrine redirige vers `/accueil`, l'interface mobile dédiée.

## Déploiement Vercel

Site statique sans étape de build : framework **Other**, dossier racine `.`, commande de build vide et sortie statique à la racine. Les déploiements de branches non-`main` sont des aperçus Vercel. Le catalogue reste un état vide tant que les restaurants ne sont pas connectés à un backend.
