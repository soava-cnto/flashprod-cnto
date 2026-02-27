# Flash Production ⚡ v2.0

Tableau de bord de suivi de production multi-activités — React 19 + Tailwind CSS v4.

## Stack
- **React 19** + Vite 6
- **Tailwind CSS v4** via `@tailwindcss/vite`

> ℹ️ **Guides détaillés** disponibles dans le dossier `docs/` :
> - **`SETUP_GUIDE.md`** : Guide complet (pour débuter rapidement)
> - `ENVIRONMENT.md` : Configuration des variables d'environnement
> - `DEPLOYMENT.md` : Déploiement sur Vercel
> - `TROUBLESHOOTING.md` : Diagnostic et erreurs courantes

## Installation
```bash
npm install
npm run dev
```

### Variables d'environnement
Le projet utilise un jeton privé pour accéder au blob Vercel (variable
`BLOB_READ_WRITE_TOKEN`).

1. Copiez l'exemple fourni :
   ```bash
   cp .env.example .env.local
   ```
2. Remplissez la valeur du jeton dans `.env.local` (ne commitez jamais ce
   fichier).
3. Les fichiers `.env` et `.env.local` sont déjà ignorés par Git (voir
   `.gitignore`).

Le serveur de développement (`vercel dev`, voir plus bas) et la plateforme
Vercel lisent ces variables automatiquement.

## Chargement automatique des données
Au démarrage de l'application le composant `<App />` effectue un `fetch`
vers `/api/get-csv`. Cette route est implémentée par une fonction
serverless située dans `api/get-csv.js` ; elle liste les blobs, récupère
le plus récent et renvoie son contenu CSV.

Le jeton utilisé pour interroger l'API Vercel Blob est stocké en variable
d'environnement (`BLOB_READ_WRITE_TOKEN`) et **n'est jamais embarqué** dans
le bundle client. C'est pourquoi le chargement automatique ne fonctionne
qu'avec la fonction `api/get-csv.js`; en cas de fichier public, remplacer
ce fetch par l'URL du blob est possible.

## Format CSV attendu
Colonnes : `date_appel`, `semaine`, `groupe_suivi`, `source`, `attribut`, `valeur`

> Le séparateur peut être une virgule, un tab, un point‑virgule ou même un
> pipe. La fonction de parsing détecte automatiquement celui qui apparaît
> le plus souvent sur la première ligne.

### Sources reconnues
| Source | Description |
|--------|-------------|
| `incoming` | Métriques appels entrants |
| `files` | Répartition par file |
| `prev` | Prévisions / planning global |
| `prev_yas_7-21h` | Prévisions tranche 7h-21h |
| `prev_yas_21-6h` | Prévisions tranche 21h-6h |
| `Yas_7-21h` | Appels tranche 7h-21h |
| `Yas_21-6h` | Appels tranche 21h-6h |
| `isol` | SL isolé (TRP 110%) |
| `rd` | Répartition des durées (RD) |

## Sections et formules

### Volumétrie
| Indicateur | Formule |
|------------|---------|
| % TRP vs Prévisions | recu / prevision |
| % TRP vs Reforecast | recu / reforecast |
| % QS | traite / recu |
| % SL | traite_sl / traite |
| % Transfert | transfert / recu |
| % Raccrochage | raccrochage / recu |

### Durée de traitement
| Indicateur | Formule |
|------------|---------|
| DMC | duree_com / traite |
| ACW | duree_acw / traite |
| MEA | rd::En attente / traite |
| DMT | (duree_com + duree_acw) / traite |
| Productivité | (duree_com + duree_acw) / heures_loguées |

### Appels courts
| Indicateur | Formule |
|------------|---------|
| % < 10 sec | appel_moins_10s / recu |
| % < 15 sec | appel_moins_15s / recu |
| % < 50 sec | appel_moins_50s / recu |

### Réitération
| Indicateur | Formule |
|------------|---------|
| % Reit Xh (typo) | reit_typo_Xh / recu |
| % Reit Xh (all) | reit_Xh / recu |
| %FCR | 1 - reit_1h / recu |

### Couverture de charge
| Indicateur | Formule |
|------------|---------|
| Heures loguées | Σ rd / 3600 |
| Taux de couverture | planning2 / besoin2 |
| Taux d'efficacité | heures_loguées / planning2 |
| Taux d'absence | (heures_loguées - planning2) / planning2 |

### Productivité & Occupation
| Indicateur | Formule |
|------------|---------|
| Taux d'occupation | h_productives / h_in-chair |
| Taux prod brut | h_in-chair / h_loguées |
| Taux prod net | h_productives / h_loguées |

### Finances
| Indicateur | Formule |
|------------|---------|
| CA | recu × 0.3 |
| CA/HP | CA / planning2 |
| CA/HL | CA / heures_loguées |
