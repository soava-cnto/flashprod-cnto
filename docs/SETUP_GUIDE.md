# Guide Complet : Flash Production + Vercel Blob

Ce guide couvre l'intégralité du processus de configuration, développement et
déploiement du projet **Flash Production** avec stockage privé sur Vercel Blob.

---

## 📋 Vue d'ensemble

Le projet utilise :

- **Frontend** : React 19 + Vite 6 + Tailwind CSS v4
- **Stockage** : Vercel Blob (privé)
- **API** : Fonction serverless Vercel (`api/get-csv.js`)
- **Déploiement** : Vercel (push → build automatique)

### Architecture

```
┌─────────────────┐
│   React App     │ Client-side (dist/)
│  (navigateur)   │
└────────┬────────┘
         │ fetch('/api/get-csv')
         ↓
┌─────────────────────────────────┐
│  Lambda Vercel (api/get-csv.js) │ Serveur
│  - Lit BLOB_READ_WRITE_TOKEN    │
│  - Récupère le blob (privé)     │
│  - Retourne le CSV              │
└────────┬────────────────────────┘
         │
         ↓
┌─────────────────────────────┐
│ Vercel Blob Storage (privé) │
│ - Authentification requise   │
└─────────────────────────────┘
```

---

## 🚀 Installation initiale

### 1. Cloner le projet
```bash
git clone <url-du-repo>
cd flash-production
```

### 2. Installer les dépendances
```bash
npm install
```

### 3. Configurer l'environnement

Copier l'exemple :
```bash
cp .env.example .env.local
```

Éditer `.env.local` et ajouter votre jeton privé **Vercel Blob** :
```env
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_XXXXXXXXXXXXX
```

> **⚠️ Important** : Ne jamais commiter `.env.local` – il est déjà dans `.gitignore`.

### 4. Vérifier la configuration

Vérifier que le fichier existe et contient bien le jeton :
```bash
cat .env.local
```

---

## 💻 Développement local

### Lancer le serveur avec `vercel dev`

```bash
vercel dev
```

Cela démarre :
- Un serveur Vite sur `http://localhost:3000` (ou le port affiché)
- Les fonctions `api/*` comme micros Serverless locales
- Les variables d'environnement `.env.local` sont chargées automatiquement

### Vérifier que tout fonctionne

1. Ouvre `http://localhost:3000` dans le navigateur
2. Appuie sur **F12** pour ouvrir la **Console**
3. Tu dois voir :
   ```
   Raw CSV length: 1234
   First 200 chars: date_appel,semaine,groupe_suivi,...
   parsed rows 45 {date_appel: "16/02/2026", semaine: "Sem-08", ...}
   ```

Si tu vois ces logs avec des données réelles → **tout fonctionne** ✅

---

## 📊 Format des données

Ton CSV doit contenir **au minimum** ces colonnes :

```csv
date_appel,semaine,groupe_suivi,source,attribut,valeur
```

Exemple valide :
```csv
date_appel,semaine,groupe_suivi,source,attribut,valeur
2026-02-16,Sem-08,Mvola,rd,Appel entrant,797893.0
2026-02-16,Sem-08,Mvola,incoming,recu,3119.0
```

### ⚠️ Format de date

- **Accepté** : `YYYY-MM-DD` (ex: `2026-02-16`) ✅
  - La fonction `get-csv.js` le convertit automatiquement en `DD/MM/YYYY`
- **Accepté** : `DD/MM/YYYY` (ex: `16/02/2026`) ✅
  - Les helpers de date (dans `src/utils/helpers.js`) les reconnaissent

### Séparateurs acceptés

Le parser détecte automatiquement :
- `,` (virgule) ✅
- `\t` (tabulation) ✅
- `;` (point-virgule) ✅
- `|` (pipe) ✅

---

## 🔐 Variables d'environnement

### Local (développement)

Fichier `.env.local` :
```env
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_tGXowkUQiSo7SLEE_OiwcceQ8880cEnuWBqOqDTNnS2jQ2M
```

- Chargée automatiquement par `vercel dev`
- Jamais committée (incluse dans `.gitignore`)

### Production (Vercel Dashboard)

1. Va sur **Settings** > **Environment Variables**
2. Ajoute la variable pour tous les environnements :
   - **Name** : `BLOB_READ_WRITE_TOKEN`
   - **Value** : `vercel_blob_rw_…`

- Disponible automatiquement lors du build/exécution
- Utilisée par `api/get-csv.js` via `process.env.BLOB_READ_WRITE_TOKEN`

### (Optionnel) URL publique

Si ton CSV **doit** être accessible directement (données publiques) :
```env
VITE_BLOB_URL=https://example.public.blob.vercel-storage.com/file.csv
```

Le code client préférera cette URL, mais si elle retourne 403 il bascule
automatiquement vers `/api/get-csv`.

---

## 🛠 Architecture du code

### `api/get-csv.js`

Fonction Serverless qui :
1. Vérifie la présence de `BLOB_READ_WRITE_TOKEN`
2. Liste les blobs stockés
3. Récupère le plus récent **avec authentification**
4. Convertit les dates de `YYYY-MM-DD` → `DD/MM/YYYY`
5. Renvoie le CSV au client

```javascript
// En cas d'erreur, retourne un JSON explicite
res.status(500).json({ error: '...' })
```

### `src/App.jsx` - `handleAutoLoad()`

À **chaque chargement** de page :
1. Appelle `fetch('/api/get-csv')`
2. Parse le CSV avec `parseCSV()`
3. Extrait les groupes uniques
4. Construit l'index de données avec `buildIndex()`
5. Met à jour `statusMsg` avec le nombre de lignes

### `src/utils/csvParser.js`

- Détecte le séparateur automatiquement
- Supprime les BOM UTF-8 en début de fichier
- Normalise les retours à la ligne
- Retourne un tableau d'objets

### `src/utils/helpers.js`

Fonctions utilitaires, notamment :
- **`parseDate(s)`** : accepte `DD/MM/YYYY` ET `YYYY-MM-DD`
- **`getMois(s)`** : retourne `YYYY-MM`
- **`shortDate(s)`** : retourne `DD/MM`

Tous les formats de date sont acceptés.

---

## 🐛 Erreurs courantes et solutions

### ❌ `GET /api/get-csv 500` ou `BLOB_READ_WRITE_TOKEN n'est pas défini`

**Cause** : Jeton manquant ou `.env.local` non chargé

**Solution** :
```bash
# Vérifier que le fichier existe
cat .env.local

# Relancer vercel dev
vercel dev
```

### ❌ `GET /api/get-csv 403 Forbidden`

**Cause** : Jeton invalide ou expiré

**Solution** :
1. Va sur Vercel Dashboard
2. Génère un nouveau jeton
3. Remplace dans `.env.local` ET variable Vercel
4. Relance `vercel dev`

### ❌ `Aucun fichier trouvé`

**Cause** : Aucun fichier uploadé dans Vercel Blob Storage

**Solution** :
1. Va sur Vercel → Storage → Blob
2. Vérifie qu'un fichier est bien là
3. Sinon : upload-le

### ❌ Les données ne s'affichent pas (tableau vide)

**Cause** : CSV non parsé = `parsed rows 0`

**Solution** :
1. Console (F12) → cherche `parsed rows`
2. Si le nombre est 0 → le CSV n'a pas pu être parsé
3. Vérifier :
   - Format des colonnes (`date_appel`, `groupe_suivi`, etc.)
   - Séparateur détecté (`,` `;` `\t` `|`)
   - Absence de caractères spéciaux ou encodages bizarres

### ❌ Les dates ne s'affichent pas correctement

**Cause** : Format de date non reconnu

**Solution** :
- Vérifier que les dates sont en `YYYY-MM-DD` ou `DD/MM/YYYY`
- Ne pas mélanger les deux formats dans le même fichier

---

## 📦 Build & déploiement

### Build local

```bash
npm run build
```

Génère le dossier `dist/` (site statique).

### Déployer sur Vercel

#### Option 1 : Repo lié (recommandé)

```bash
git add .
git commit -m "prod update"
git push origin main
```

Vercel détecte automatiquement :
1. Build : `npm run build` → génère `dist/`
2. Fonctions : fichiers `api/` → déploiement serverless
3. Variables : lues depuis Settings > Environment Variables
4. Déploiement live

#### Option 2 : CLI Vercel

```bash
vercel --prod
```

---

## ✅ Checklist avant déploiement

- [ ] `.env.local` contient `BLOB_READ_WRITE_TOKEN` valide
- [ ] `.env.local` et `.env` sont dans `.gitignore`
- [ ] Un fichier CSV est bien uploadé dans Vercel Blob Storage
- [ ] Test local `vercel dev` → data affichées correctement
- [ ] Format CSV : colonnes `date_appel`, `groupe_suivi`, etc.
- [ ] Dates en `YYYY-MM-DD` ou `DD/MM/YYYY`
- [ ] Variable `BLOB_READ_WRITE_TOKEN` ajoutée au dashboard Vercel

---

## 📝 Workflow quotidien

### En développement

```bash
# 1. Démarrer
vercel dev

# 2. Éditer code/styles, la page se recharge automatiquement

# 3. Vérifier la console (F12)
#    - parsed rows [nombre] ✅
#    - Pas d'erreur 403/500 ✅

# 4. Tester import manuel de CSV aussi si besoin

# 5. Quitter
Ctrl+C
```

### Avant de pusher

```bash
# Vérifier que tout marche
vercel dev

# Build
npm run build

# Pas d'erreur ? Commit et push
git push
```

---

## 🔗 Ressources utiles

- **Docs Vercel Blob** : https://vercel.com/docs/storage/vercel-blob
- **Docs Vercel Functions** : https://vercel.com/docs/functions/serverless-functions
- **Vite Docs** : https://vitejs.dev
- **React 19 Docs** : https://react.dev

---

## 📞 Support rapide

Si tu rencontres une erreur :

1. **Console (F12)** : cherche le message d'erreur exact
2. **Terminal `vercel dev`** : regarde les logs de la fonction
3. **`.env.local`** : vérifie le jeton
4. **Format CSV** : teste en importable manuellement d'abord
5. **Voir `docs/TROUBLESHOOTING.md`** pour des cas spécifiques

---

## 🎯 Résumé

| Besoin | Solution |
|--------|----------|
| Développer | `vercel dev` |
| Tester API | `curl http://localhost:3000/api/get-csv` |
| Ajouter variable | Dashboard Vercel > Settings > Env Vars |
| Builder | `npm run build` |
| Déployer | `git push` (repo lié) ou `vercel --prod` |
| Diagnostiquer | Console (F12) + terminal `vercel dev` |

Bon développement ! 🚀
