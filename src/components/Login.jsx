import { useAuth0 } from "@auth0/auth0-react";
import logo from "../assets/logo.png";

// composant d'authentification (login/signup)
function Login() {
  const {
    isLoading, // SDK loading state
    isAuthenticated,
    error,
    loginWithRedirect: login, // démarrer le flux de connexion
    logout: auth0Logout, // démarrer le flux de déconnexion
    user, // profil utilisateur
  } = useAuth0();

  const signup = () =>
    login({ authorizationParams: { screen_hint: "signup" } });

  const logout = () =>
    auth0Logout({ logoutParams: { returnTo: window.location.origin } });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-t-2 border-gray-900"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-800">
        <div className="max-w-md w-full bg-white dark:bg-gray-900 p-8 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-4 text-center">Profil utilisateur</h2>
          <p className="text-center text-gray-700 dark:text-gray-300 mb-6">
            Connecté en tant que <span className="font-medium">{user.email}</span>
          </p>
          <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded overflow-x-auto text-sm">
            {JSON.stringify(user, null, 2)}
          </pre>
          <div className="mt-6 flex justify-center">
            <button
              onClick={logout}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors shadow-sm"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </div>
    );
  }

  // non authentifié
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-800">
      {/* 1. On ajoute 'overflow-hidden' pour que le fond vert respecte les coins arrondis de la carte */}
      <div className="max-w-sm w-full bg-white dark:bg-gray-900 rounded-lg shadow-lg overflow-hidden">

        {/* 2. Le bandeau vert : on enlève les dimensions fixes et on met du padding vertical (py-8) */}
        <div className="bg-[#00afa9] py-8 flex items-center justify-center">
          <img
            src="https://www.connecteo.mg/integration/images/design/logo-connecteo-with-text.svg"
            alt="Logo"
            /* On ajuste la hauteur de l'image pour qu'elle soit bien proportionnée */
            className="h-16 w-auto object-contain"
          />
        </div>

        {/* 3. Le contenu : On déplace le padding 'p-8' ici pour qu'il n'affecte pas le bandeau vert */}
        <div className="p-8">
          <h2 className="text-2xl text-gray-500 font-bold mb-4 text-center">Bienvenue</h2>
          <p className="text-center text-gray-500 dark:text-gray-400 mb-6 py-5 leading-8">
            Merci de vous connecter pour accéder aux données Flash Production.
          </p>

          {error && (
            <p className="text-red-500 text-center mb-4">Erreur : {error.message}</p>
          )}

          <div className="flex flex-col gap-3">
            <button type="submit"
              onClick={login}
              className="w-full bg-[#00afa9] hover:bg-teal-500 text-white px-4 py-2 rounded-lg font-semibold transition-colors shadow dark:bg-gray-700 dark:hover:bg-gray-600 cursor-pointer"
            >
              Se connecter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
