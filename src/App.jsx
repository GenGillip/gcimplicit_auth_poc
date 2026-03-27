import { useState, useEffect } from 'react';
import platformClient from 'purecloud-platform-client-v2';

const CLIENT_ID = import.meta.env.VITE_GC_CLIENT_ID;  // OAuth client id
const REDIRECT_URI = import.meta.env.VITE_GC_REDIRECT_URI; // http://localhost:5173
const ENVIRONMENT = import.meta.env.VITE_GC_REGION;        // e.g. mypurecloud.com
const client = platformClient.ApiClient.instance;

function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    client.setEnvironment(ENVIRONMENT);

    if (window.location.hash) {
      client.loginImplicitGrant(CLIENT_ID, REDIRECT_URI)
        .then(() => {
          setAuthenticated(true);
          return new platformClient.UsersApi().getUsersMe();
        })
        .then(userMe => setUser(userMe))
        .catch(err => setError(err.message));
    }
  }, []);

  const handleLogin = () => {
    client.setEnvironment(ENVIRONMENT);
    client.loginImplicitGrant(CLIENT_ID, REDIRECT_URI);
  };

  const handleLogout = () => {
    client.logout(REDIRECT_URI);
    setAuthenticated(false);
    setUser(null);
    // amazonq-ignore-next-line
    window.location.hash = '';
  };

  if (error) {
    return <div style={{ padding: '20px' }}>Error: {error}</div>;
  }

  if (authenticated && user) {
    return (
      <div style={{ padding: '20px' }}>
        <h1>Genesys Cloud Implicit Auth</h1>
        <p>Welcome, {user.name}!</p>
        <p>Email: {user.email}</p>
        <button onClick={handleLogout}>Logout</button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Genesys Cloud Implicit Auth</h1>
      <button onClick={handleLogin}>Login with Genesys Cloud</button>
    </div>
  );
}

export default App;
