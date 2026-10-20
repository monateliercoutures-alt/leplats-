# TonMenu

Landing page statique inspirée des captures fournies : découverte de cuisines et restaurants d'Abidjan, présentation de TonMenu et espace partenaires.

## Lancer en local

```bash
python3 -m http.server 4173 --bind 0.0.0.0
```

Puis ouvrir `http://localhost:4173`.

## Déploiement Vercel

Le projet est un site statique sans étape de build. Importer le dépôt dans Vercel, laisser le framework sur **Other**, garder le répertoire racine (`.`) et ne définir aucune commande de build. Faire d'abord un déploiement Preview; le catalogue et les commandes sont des interactions de démonstration et ne sont pas encore reliés à un backend.
