# Déploiement sur Vercel

Ce guide explique comment tester localement et déployer l'application avec
les fonctions serverless fournies dans le dossier `api/`.

## 1. Préparer le dépôt
```bash
npm install            # installe les dépendances
cp .env.example .env.local
# remplir .env.local avec le jeton privé
```

#### 1.1. Ignorer les fichiers sensibles
Le `.gitignore` du projet contient déjà :
```
node_modules
dist
.env
.env.local
```
Cela protège votre jeton et évite de pousser des builds par erreur.

## 2. Exécution en local
Voici la séquence complète pas-à-pas pour démarrer le projet en local :

1. Cloner le dépôt et aller dans le dossier :
   ```bash
   git clone <url-du-repo>
   cd flash-production
   ```
2. Installer les dépendances npm :
   ```bash
   npm install
   ```
3. Créer un fichier d'environnement et insérer le jeton :
   ```bash
   cp .env.example .env.local
   # ouvrir .env.local et coller votre BLOB_READ_WRITE_TOKEN
   ```
4. Installer la CLI Vercel si besoin :
   ```bash
   npm install -g vercel
   ```
5. Lancer le serveur de développement Vercel :
   ```bash
   vercel dev
   ```

Le serveur démarre et expose :

- `http://localhost:5173` (ou un autre port indiqué) pour l'UI React.
- Toutes les requêtes `GET /api/...` sont redirigées vers les fonctions
  sous le dossier `api/` ; ici `/api/get-csv` utilisera la variable
  `BLOB_READ_WRITE_TOKEN` de `.env.local`.

> 💡 Vous pouvez ouvrir deux onglets : un pour l'interface et un pour les
> logs Vercel (la CLI affiche l'activité des fonctions).

- Pour simuler un URL publique, définissez temporairement
  `VITE_BLOB_URL` dans `.env.local` et rechargez la page.

> Vous pouvez également déployer un environnement de staging avec `vercel
> --prod` pour tester des variations.

## 3. Construire et déployer
Lorsque vous poussez sur le dépôt connecté à Vercel (par exemple `git push
origin main`), la plateforme :

1. exécute `npm run build` ce qui génère le dossier `dist/` pour le front.
2. détecte les fichiers sous `api/` et les transforme en lambdas Node.js.
3. déploie le tout ; vos visiteurs accéderont au site statique et à la
   fonction via `/api/get-csv`.

Assurez-vous que la variable `BLOB_READ_WRITE_TOKEN` est renseignée dans
la configuration du projet Vercel (Settings ➜ Environment Variables).

## 4. Maintenance
- Si vous changez de jeton, mettez à jour `.env.local` et les variables sur
  Vercel.
- Pour purger un cache ou forcer une reconstruction, utilisez l'option
  "Redeploy" dans le dashboard.
