# Contrôle d'accès / autorisation par activité

Ce document explique comment restreindre l'accès aux données CSV en fonction
"d'une activité" (groupe) attribuée à chaque utilisateur Auth0. Les concepts
présentés ici peuvent être adaptés (rôles, permissions, règles, metadata, etc.)
mais l'objectif est simple : un utilisateur A ne doit voir que les lignes dont
`groupe_suivi` contient sa valeur attribuée (par exemple `popo`), un autre
utilisateur voit un autre groupe, et un super‑admin peut tout consulter.

---

## 1. Stratégie générale

1. **Attribuer un ou plusieurs groupes à chaque utilisateur**
   - utiliser `app_metadata` ou les **Roles** d'Auth0.
   - plusieurs groupes possibles (ex : `['popo','qux']`).
   - définir un marqueur `is_admin` pour les comptes à accès global.

2. **Ajouter ces informations au token JWT**
   - par défaut, `app_metadata` n'est *pas* envoyé dans le token.
   - créez une **Rule** Auth0 qui copie les champs utiles dans la charge utile
     du token (ID token ou access token). Exemple ci‑dessous.

3. **Côté client**
   - lire les revendications (`user` ou `getIdTokenClaims()`) pour connaître
     les groupes autorisés.
   - afficher la liste des activités (`select`) filtrée selon ces groupes.
   - bloquer l'accès / rediriger si aucun groupe n'est autorisé.

4. **Côté serveur** (plus sûr)
   - lors de l'appel à `/api/get-csv`, décoder et (idéalement) vérifier le JWT.
   - appliquer un filtre sur les lignes CSV pour ne renvoyer que celles dont
     `groupe_suivi` figure dans les groupes autorisés, sauf si `is_admin=true`.
   - cette vérification empêche les utilisateurs d'accéder à des données
     en manipulant le front‑end ou le token.

---

## 2. Exemple de règle Auth0

Dans le dashboard Auth0 : **Auth Pipeline → Rules → Create Rule → Empty** et
collez :

```js
function addGroupsToToken(user, context, callback) {
  const namespace = 'https://flashprod.example/';

  // supposons que l'app_metadata contient :
  // { app_metadata: { groups: ['popo'], is_admin: false } }
  const groups = user.app_metadata?.groups || [];
  const isAdmin = user.app_metadata?.is_admin === true;

  // ajoute au idToken et accessToken
  context.idToken[namespace + 'allowed_groups'] = groups;
  context.accessToken[namespace + 'allowed_groups'] = groups;
  context.idToken[namespace + 'is_admin'] = isAdmin;
  context.accessToken[namespace + 'is_admin'] = isAdmin;

  callback(null, user, context);
}
```

> **namespace** : Auth0 exige un URI propre à votre application pour les
> revendications personnalisées. Adaptez `flashprod.example` à votre domaine.

Vous pouvez également utiliser l'extension **Roles** pour gérer ceci via une
interface graphique ; dans ce cas, remplacez `groups` par le tableau de rôles
et la règle ci‑dessous injecte `roles` du `user`.

---

## 3. Configuration des utilisateurs

1. Allez dans **User Management → Users**.
2. Sélectionnez un utilisateur puis **App Metadata** :

   ```json
   {
     "groups": ["popo"],
     "is_admin": false
   }
   ```

3. Pour le super‑admin, cocher `"is_admin": true` (et éventuellement
   `"groups": ["*"]`).
4. Sauvegardez et reconnectez‑vous pour que le token prenne effet.

Vous pouvez automatiser l'ajout de metadata via l'API Management lors de la
création de l'utilisateur.

---

## 4. Modifications de code

### 4.1. `App.jsx` (client)

Le code actuel calcule `allGroups` en lisant tout le CSV. Il faut restreindre
cette liste :

```jsx
const { user, isAuthenticated, getAccessTokenSilently } = useAuth0();

// lecture des données envoyées par la Rule
const allowedGroups =
  user?.['https://flashprod.example/allowed_groups'] || [];
const isAdmin = user?.['https://flashprod.example/is_admin'] === true;

const handleAutoLoad = useCallback(async () => {
  // ...fetch du CSV comme avant...

  const groups = [...new Set(parsed.map((r) => r.groupe_suivi).filter(Boolean))].sort();
  const filtered = isAdmin ? groups : groups.filter((g) => allowedGroups.includes(g));
  const first = filtered[0] || '';

  setRawData(parsed);
  setAllGroups(filtered);
  setSelectedGroup(first);
  setDataIdx(buildIndex(parsed, first));
  setStatusMsg(`${parsed.length} lignes · ${filtered.length} activité(s)`);
}, [getAccessTokenSilently, allowedGroups, isAdmin]);
```

> **remarque** : un utilisateur sans groupe autorisé ne verra rien ; vous
> pouvez lui afficher un message d'erreur ou l'empêcher de se connecter.

Le `TopBar` (sélecteur d'activité) est déjà alimenté par la prop `allGroups`.
Dans l'exemple de code nous avons même modifié `TopBar` pour masquer le
`<select>` lorsque la liste ne contient qu'une seule valeur : l'utilisateur
voit alors simplement le nom de son activité. Les admins, quant à eux, peuvent
encore basculer entre plusieurs activités.
Aucun ajustement supplémentaire n'est nécessaire à moins de vouloir
complètement retirer le contrôle pour certains rôles.

### 4.2. `api/get-csv.js` (serveur)

Le handler décode maintenant le JWT et filtre les lignes :

```js
import jwt from 'jsonwebtoken';

const auth = req.headers.authorization || '';
// ...contrôle 401 comme précédemment...

let csvText = await response.text();

// décode sans vérification (voir note ci‑dessous)
const decoded = jwt.decode(auth.split(' ')[1]) || {};
const allowedGroups = decoded['https://flashprod.example/allowed_groups'] || [];
const isAdmin = decoded['https://flashprod.example/is_admin'];

if (!isAdmin && allowedGroups.length) {
  // filtrage sur la colonne "groupe_suivi" identifiée via l'entête CSV
}
```

> ❗Pour sécuriser complètement, installez `jsonwebtoken` (déjà présent dans
> `package.json`) et vérifiez la signature JWT contre la clé publique de
> votre tenant (via le JWKS endpoint). Le décodage seul convient en phase de
> prototypage, mais un attaquant capable de forger un token non signé pourrait
> contourner la restriction.

### 4.3. Dépendances à installer

```bash
npm install jsonwebtoken
```

(et reconstruire le projet : `npm run build`).

---

## 5. Option : utiliser les *Roles* Auth0

- Dans **User Management → Users → Roles**, rattachez un rôle à un utilisateur
  (`popo`, `autreActivite`, `admin`...).
- Modifiez la Rule pour lire `user.roles` au lieu de `user.app_metadata.groups`.
- Dans votre logique, traitez `allowedGroups = user.roles` ; `isAdmin` peut
  être déterminé par la présence du rôle `admin`.

Cela donne une interface plus conviviale pour l'administrateur.

---

## 6. Tests

1. Connectez‑vous avec un compte `popo` : la sélection d'activité doit
   contenir uniquement `popo` et les données affichées sont filtrées.
2. Essayez de modifier l'URL `/?group=autre` manuellement : rien ne doit
   s'afficher (handleAutoLoad ne propose pas le groupe). 3. Connectez‑vous avec
   un compte admin : vous voyez toutes les activités et pouvez changer de groupe.
4. Vérifiez les logs de `api/get-csv` (vercel/dev ou tableau de bord) : les
   `allowed_groups` extraits du token doivent correspondre au profil user.

---

## 7. Prochaines améliorations

- appliquer une validation stricte du JWT côté serveur (utiliser `jwks-rsa`)
- stocker une liste de groupes autorisés dans une base de données et comparer
  dynamiquement
- utiliser des **permissions** + **règles RBAC** d'Auth0 pour gérer
  l'accès à des actions (lecture CSV, export, etc.)

---

Ce guide devrait vous permettre de configurer un contrôle d'accès basique et
sûr pour votre application. Adaptez les namespaces, les noms de claim et le
format des données selon vos conventions.
