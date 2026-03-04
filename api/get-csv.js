import { list } from '@vercel/blob';
import jwt from 'jsonwebtoken';

// L'API `@vercel/blob` lit automatiquement la variable d'environnement
// BLOB_READ_WRITE_TOKEN. On vérifie qu'elle est bien définie afin de
// produire une erreur explicite en cas d'oubli.
const { BLOB_READ_WRITE_TOKEN } = process.env;

export default async function handler(req, res) {
  // Cette fonction s'exécute sur les serveurs de Vercel, pas dans le navigateur.
  // Elle peut donc utiliser ton jeton privé "BLOB_READ_WRITE_TOKEN" (stocké
  // dans une variable d'environnement et **jamais** exposé au client).

  // ---- simple contrôle Auth0 -------------------------------------------
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }
  // NOTE : ici on ne valide pas le JWT (pas de bibliothèque ajoutée) mais
  // on s'assure qu'un token a bien été envoyé. Pour une vérification complète
  // utilisez `jsonwebtoken` + JWKS ou `@auth0/nextjs-auth0`.

  if (!BLOB_READ_WRITE_TOKEN) {
    return res
      .status(500)
      .json({ error: 'La variable BLOB_READ_WRITE_TOKEN n\'est pas définie' });
  }
  
  try {
    // 1. Lister les fichiers pour trouver le plus récent
    const { blobs } = await list();
    const latestBlob = blobs[0]; // Prend le premier (le plus récent)

    if (!latestBlob) {
      return res.status(404).json({ error: "Aucun fichier trouvé" });
    }

    // 2. Récupérer le contenu du fichier avec authentification
    // IMPORTANT: le blob privé nécessite le jeton passé en header Authorization
    const response = await fetch(latestBlob.url, {
      headers: {
        'Authorization': `Bearer ${BLOB_READ_WRITE_TOKEN}`
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ 
        error: `Blob fetch failed with status ${response.status}` 
      });
    }

    let csvText = await response.text();

    // filtration basée sur le jeton (user autorisation)
    let allowedGroups = [];
    let isAdmin = false;
    try {
      const token = auth.split(' ')[1];
      const decoded = jwt.decode(token) || {};
      allowedGroups = decoded['https://flashprod.example/groups'] || [];
      isAdmin = decoded['https://flashprod.example/is_admin'] === true;
    } catch (e) {
      console.warn('Impossible de décoder le JWT :', e.message);
    }

    if (!isAdmin && allowedGroups.length > 0) {
      const allLines = csvText.split('\n');
      const header = allLines[0] || '';
      const body = allLines.slice(1);
      const idx = header.split(',').indexOf('groupe_suivi');
      if (idx !== -1) {
        const filtered = body.filter((line) => {
          const parts = line.split(',');
          return allowedGroups.includes(parts[idx]);
        });
        csvText = [header, ...filtered].join('\n');
      }
    }

    // 3. Normaliser les dates de YYYY-MM-DD vers DD/MM/YYYY
    // pour compatibilité avec l'app qui attend le format français
    const lines = csvText.split('\n');
    const processedLines = lines.map((line, idx) => {
      if (idx === 0) return line; // garder le header
      const parts = line.split(',');
      if (parts.length > 0 && /^\d{4}-\d{2}-\d{2}$/.test(parts[0])) {
        const [yyyy, mm, dd] = parts[0].split('-');
        parts[0] = `${dd}/${mm}/${yyyy}`;
      }
      return parts.join(',');
    });
    csvText = processedLines.join('\n');

    // 4. Envoyer la donnée à ton code React
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    return res.status(200).send(csvText);
  } catch (error) {
    console.error('Error in get-csv:', error);
    return res.status(500).json({ error: error.message });
  }
}