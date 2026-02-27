# Diagnostic - Vérifier la connexion Vercel Blob

## Avant de lancer `vercel dev`

### 1. Vérifier le jeton dans `.env.local`
```bash
cat .env.local | grep BLOB_READ_WRITE_TOKEN
```
Le token doit commencer par `vercel_blob_rw_` et ne doit pas être vide.

### 2. Vérifier le fichier dans Vercel Blob
Via le dashboard Vercel ou en CLI (si vous avez `@vercel/blob` installé globalement) :
```bash
npx vercel env pull  # tire l'env de Vercel en local
```

---

## Lancer et tester

### 1. Démarrer `vercel dev`
```bash
vercel dev
```
Tu dois voir :
```
✓ Environment variables loaded
...
> Ready! Available at http://localhost:3000
```

### 2. Ouvrir le navigateur
Va sur `http://localhost:3000` et ouvre la **Console du développeur** (F12).

Tu dois voir dans l'onglet **Console** :
```
Raw CSV length: 1234
First 200 chars: date_appel,semaine,groupe_suivi,...
parsed rows 45 {date_appel: "16/02/2026", semaine: "Sem-08", ...}
```

Si tu vois ceci, **tout fonctionne** ! Les données sont chargées correctement.

---

## Erreurs courantes et solutions

### Erreur : `GET /api/get-csv 500`
Signifie que la variable `BLOB_READ_WRITE_TOKEN` n'est pas définie.
- Vérifie que `.env.local` existe et contient le token.
- Relance `vercel dev` (il recharge les variables).

### Erreur : `Blob fetch failed with status 403`
Le token est présent mais invalide ou expiré.
- Réinitialise le token sur le dashboard Vercel.
- Copie-le à nouveau dans `.env.local`.

### Erreur : `Aucun fichier trouvé`
Le blob ne contient pas de fichier au format attendu.
- Vérifie que des fichiers sont bien uploadés dans Vercel Blob Storage.
- Vérifie le nom ou le chemin du fichier.

### Les données ne s'affichent pas
Si tu vois `Raw CSV length` mais `parsed rows 0` :
- Le formatCSV ne parse pas correctement.
- Vérifie que le CSV utilise un séparateur reconnu (`,` `;` `\t` ou `|`).
- Copie les 3 premières lignes du CSV et inspecteles dans la console.

---

## Vérifier rapidement l'API

Une fois `vercel dev` lancé, ouvre un autre terminal :
```bash
curl http://localhost:3000/api/get-csv | head -10
```

Ou en PowerShell (Windows) :
```powershell
Invoke-WebRequest http://localhost:3000/api/get-csv | Select-Object -ExpandProperty Content | Select-Object -First 500
```

Tu dois voir les premières lignes du CSV en format `DD/MM/YYYY`.

---

## Notes

- La fonction `get-csv.js` convertit maintenant les dates de `YYYY-MM-DD` vers `DD/MM/YYYY`
  pour que l'app puisse les reconnaître.
- Les helpers de date (`parseDate`, `getMois`, `shortDate`) acceptent maintenant
  les deux formats pour plus de flexibilité.
- Si l'API répond correctement mais les données ne s'affichent toujours pas,
  c'est un problème de parsing ou de format de colonne. Ouvre la Console
  et inspecte le premier enregistrement parsé.
