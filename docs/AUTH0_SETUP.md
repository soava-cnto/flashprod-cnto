# Auth0 Integration for flashprod_v3

Ce document explique comment configurer Auth0 dans votre projet React/Vite et
quelques bonnes pratiques pour l'utiliser avec Vercel.

---

## 1. Créer un compte Auth0

1. Rendez‑vous sur https://auth0.com et créez un compte (gratuit pour développement).
2. Une fois connecté, sélectionnez (ou créez) un **tenant**. Le nom du tenant
   apparaîtra dans l'URL (`<votre-tenant>.us.auth0.com`).

## 2. Créer une application « Single Page Application »

1. Dans le tableau de bord Auth0, allez dans **Applications → Applications**.
2. Cliquez sur **+ Create Application**.
3. Donnez un nom (par ex. `flashprod_v3 app`).
4. Choisissez le type **Single Page Web Applications** et cliquez sur **Create**.

### 2.1 Configurer les URLs autorisées

Dans les réglages de l'application (`Settings` tab) :

- **Allowed Callback URLs** :
  - `http://localhost:5173` (ou le port de dev Vite)
  - `https://<votre‑domaine>.vercel.app` (URL de production)
  - *(ajoutez d'autres sous‑domains si besoin)*

- **Allowed Logout URLs** :
  - les mêmes que précédemment (ou simplement `https://<votre‑domaine>.vercel.app`)

- **Allowed Web Origins** et **Allowed CORS Origins** :
  - ajoutez `http://localhost:5173` et `https://<votre‑domaine>.vercel.app`.

Sauvegardez les modifications.

### 2.2 Récupérer les identifiants

Copiez :

- _Domain_ (`dev-xxxxx.us.auth0.com`) → `VITE_AUTH0_DOMAIN`
- _Client ID_ → `VITE_AUTH0_CLIENT_ID`

> **Ne partagez jamais** le _Client Secret_ ; il n'est pas nécessaire pour un SPA.

## 3. Variables d'environnement

1. Créez un fichier `.env` (`.env.local` si vous préférez) à la racine du projet :

```env
VITE_AUTH0_DOMAIN=dev-xxxxx.us.auth0.com
VITE_AUTH0_CLIENT_ID=XXXXXXXXXXXX
# autres variables (voir .env.example)
```

2. Ajoutez les mêmes variables dans les **Environment Variables** de Vercel :

   - `VITE_AUTH0_DOMAIN`
   - `VITE_AUTH0_CLIENT_ID`
   - `BLOB_READ_WRITE_TOKEN` si vous utilisez l'API blob.

Les variables commençant par `VITE_` sont exposées au code client par Vite;
elle ne contiennent **aucune donnée secrète**. Les jetons privés (par ex. blob)
sont utilisés uniquement côté serveur dans `/api/*`.

## 4. Code déjà présent dans le projet

Le projet inclut déjà les points essentiels :

- Dépendance `@auth0/auth0-react` dans `package.json`.
- `src/main.jsx` :
  ```jsx
  <Auth0Provider
      domain={import.meta.env.VITE_AUTH0_DOMAIN}
      clientId={import.meta.env.VITE_AUTH0_CLIENT_ID}
      authorizationParams={{ redirect_uri: window.location.origin }}
  >
      <Root />
  </Auth0Provider>
  ```
  Le `Root` rend `App` si l'utilisateur est authentifié, sinon le composant
  `Login` (voir ci‑dessous). Cette logique fonctionne déjà pour bloquer
  l'accès à l'application si le visiteur n'est pas connecté.

- `src/components/Login.jsx` : écran minimal proposant login, signup et logout.
  Il gère l'état `isAuthenticated` et affiche le profil.

- `src/App.jsx` n'est pas encore lié à Auth0 ; si vous avez besoin de connaître
  l'utilisateur courant ou de récupérer un jeton pour appeler des API privées,
  utilisez le hook `useAuth0()` :

  ```jsx
  import { useAuth0 } from '@auth0/auth0-react';
  
  function App() {
    const { user, getAccessTokenSilently } = useAuth0();
    // ...
  }
  ```

## 5. Travailler avec des routes (optionnel)

Le projet n'utilise pas `react-router-dom` pour l'instant. Si vous prévoyez
des pages multiples, installez-le :

```bash
npm install react-router-dom
```

Puis créez un composant `ProtectedRoute` :

```jsx
// src/components/ProtectedRoute.jsx
import { useAuth0 } from '@auth0/auth0-react';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth0();
  if (isLoading) return null;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}
```

Et configurez vos routes :

```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';

<BrowserRouter>
  <Routes>
    <Route path="/login" element={<Login />} />
    <Route
      path="/*"
      element={
        <ProtectedRoute>
          <App />
        </ProtectedRoute>
      }
    />
  </Routes>
</BrowserRouter>
```

## 6. Appeler une API privée avec un token

Si vous avez un endpoint server‑side (par ex. `/api/my-data`) qui exige un
jeton d'accès, récupérez-le ainsi :

```jsx
const token = await getAccessTokenSilently();
const resp = await fetch('/api/my-data', {
  headers: { Authorization: `Bearer ${token}` }
});
```

Puis, dans votre fonction serverless (`api/my-data.js`), vérifiez le jeton
avec `jwks-rsa` / `express-jwt` ou la bibliothèque de votre choix.

---

## 7. Déploiement sur Vercel

- Vérifiez que votre repo GitHub est connecté et que les variables sont définies.
- Les build settings par défaut (`npm run build`, `dist` output) suffisent.
- Après déploiement, testez l'URL `/api/get-csv` et l'authentification en
  naviguant sur le site. L'application devrait rediriger vers la page de
  connexion Auth0 si l'utilisateur n'est pas loggé.

## 8. FAQ rapide

- **Pourquoi `window.location.origin` ?**
  Auth0 a besoin d'une URL de redirection. En développement elle sera
  `http://localhost:5173`, en production le domaine Vercel.

- **Comment forcer une déconnexion ?**
  Appelez `logout({ logoutParams: { returnTo: window.location.origin } })`.

- **Puis-je stocker des données utilisateur ?**
  Les informations du profil (`user`) ne doivent pas être modifiées. Stockez
  ce dont vous avez besoin dans votre propre base ou via les `app_metadata`.

---

Ce document constitue une base complète ; adaptez-le en fonction de vos besoins
spécifiques. Bonne implémentation ! 🎉