import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import Login from "./components/Login";
import { Auth0Provider, useAuth0 } from "@auth0/auth0-react";

// Wrapper pour sélectionner l'application ou l'écran de connexion
function Root() {
  const { isLoading, isAuthenticated } = useAuth0();
  if (isLoading) return null; // spinner possible
  return isAuthenticated ? <App /> : <Login />;
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Auth0Provider
      domain={import.meta.env.VITE_AUTH0_DOMAIN}
      clientId={import.meta.env.VITE_AUTH0_CLIENT_ID}
      authorizationParams={{ redirect_uri: window.location.origin }}
    >
      <Root />
    </Auth0Provider>
  </StrictMode>,
);
