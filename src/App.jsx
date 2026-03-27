import { useState, useEffect } from 'react';
import platformClient from 'purecloud-platform-client-v2';

const CLIENT_ID = '2518cd72-b1f9-45ca-8b19-806774b4fb48';
const REDIRECT_URI = 'http://localhost:3001';
const ENVIRONMENT = 'usw2.pure.cloud';

function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const client = platformClient.ApiClient.instance;
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
    const client = platformClient.ApiClient.instance;
    client.setEnvironment(ENVIRONMENT);
    client.loginImplicitGrant(CLIENT_ID, REDIRECT_URI);
  };

  const handleLogout = () => {
    setAuthenticated(false);
    setUser(null);
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
