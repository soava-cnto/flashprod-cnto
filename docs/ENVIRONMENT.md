# Configuration des variables d'environnement

Ce projet a besoin d'un jeton privé pour accéder à l'API blob de Vercel.
Le jeton doit **jamais** être inclus dans le bundle client, et il n'est pas
non plus commité dans le dépôt.

## Fichiers d'exemple
- `.env.example` : contient un modèle avec la clé `BLOB_READ_WRITE_TOKEN`.
- `.env.local` (ou `.env`) : copié depuis l'exemple et rempli avec la vraie
  valeur. Ce fichier est listé dans `.gitignore`.

```bash
cp .env.example .env.local
# puis éditez .env.local pour insérer votre jeton
```

### En local
- `vercel dev` lit automatiquement les variables depuis `.env.local`.
- Si vous utilisez `vite` seul, la fonction `/api/get-csv` n'est pas servie
  automatiquement ; préférez `vercel dev` ou ajoutez un proxy dans
  `vite.config.js`.

### En production
Dans le dashboard Vercel, ajoutez la variable
`BLOB_READ_WRITE_TOKEN` dans **Settings > Environment Variables**. Lors du
build ou des exécutions de la lambda, cette variable sera disponible via
`process.env`.

## Données publiques
Si votre CSV peut être servi sans authentification, vous pouvez (optionnellement)
définir une variable Vite `VITE_BLOB_URL` contenant l'URL directe du blob.

⚠️ **Ne mettez jamais l'URL d'un blob privé** (celle qui contient
`private.blob.vercel-storage.com`) dans `VITE_BLOB_URL` : le navigateur
n'a pas accès au jeton et la requête renverra une erreur 403 Forbidden, puis
l'application tentera de faire un second appel à `/api/get-csv`.

Le code client est désormais résilient : s'il reçoit un 403 en utilisant
`VITE_BLOB_URL`, il bascule automatiquement vers `/api/get-csv` et affiche
un avertissement dans la console.

Dans le cas d'une URL publique, la fonction serverless n'est plus
nécessaire, mais la variable reste inoffensive.

> **Attention** : ne divulguez jamais ce jeton dans un ticket, un message
> Slack ou un fichier public.
