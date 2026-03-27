# Genesys Cloud Implicit Grant Auth — React POC

A minimal React + Vite proof-of-concept demonstrating **OAuth 2.0 Implicit Grant** authentication with the [Genesys Cloud Platform Client SDK](https://developer.genesys.cloud/devapps/sdk/docexplorer/purecloudjavascript/).

---

## How Genesys Cloud Implicit Grant Auth Works

The **Implicit Grant** flow is designed for browser-based (public client) applications that cannot securely store a client secret. Here's the step-by-step flow:

```
┌────────── ┐                          ┌──────────────────┐                     ┌──────────────┐
│  Browser  │                          │  Genesys Cloud   │                     │  Your App    │
│  (User)   │                          │  Auth Server     │                     │  (SPA)       │
└─────┬─────┘                          └────────┬─────────┘                     └──────┬───────┘
      │                                         │                                      │
      │  1. User clicks "Login"                 │                                      │
      │ ─────────────────────────────────────────────────────────────────────────────> │
      │                                         │                                      │
      │  2. App redirects to GC login page      │                                      │
      │ <───────────────────────────────────────────────────────────────────────────── │
      │         https://login.{env}/oauth/authorize?                                   │
      │           response_type=token&                                                 │
      │           client_id=YOUR_CLIENT_ID&                                            │
      │           redirect_uri=http://localhost:3001                                   │
      │                                         │                                      │
      │  3. User enters credentials             │                                      │
      │ ──────────────────────────────────────> │                                      │
      │                                         │                                      │
      │  4. GC validates & redirects back       │                                      │
      │     with token in URL fragment          │                                      │
      │ <────────────────────────────────────── │                                      │
      │         http://localhost:3001/#access_token=abc123&token_type=bearer&expires_in=...
      │                                         │                                      │
      │  5. Browser loads app, SDK reads hash   │                                      │
      │ ─────────────────────────────────────────────────────────────────────────────> │
      │                                         │                                      │
      │  6. App calls GC APIs with token        │                                      │
      │                                         │ <─────────── API request ─────────── │
      │                                         │ ────────── API response ───────────> │
      │                                         │                                      │
      │  7. App displays user data              │                                      │
      │ <───────────────────────────────────────────────────────────────────────────── │
```

### Key Concepts

| Concept | Description |
|---|---|
| **Implicit Grant** | OAuth 2.0 flow where the access token is returned directly in the URL fragment (`#access_token=...`). No client secret is needed. |
| **URL Fragment** | The `#` portion of the URL. Fragments are never sent to the server, so the token stays in the browser only. |
| **Access Token** | A short-lived bearer token (typically 24 hours) used to authenticate API calls to Genesys Cloud. |
| **No Refresh Token** | Implicit grant does **not** issue refresh tokens. When the token expires, the user must re-authenticate. |
| **Client ID** | A public identifier for your OAuth app — safe to embed in frontend code. |
| **Redirect URI** | The URL Genesys Cloud redirects to after authentication. Must exactly match what's configured in the OAuth client. |

### How the SDK Handles It

The `purecloud-platform-client-v2` SDK's `loginImplicitGrant(clientId, redirectUri)` method does two things depending on context:

1. **No token in URL hash** → Redirects the browser to the Genesys Cloud login page.
2. **Token present in URL hash** → Parses the token from `window.location.hash` and configures the SDK to use it for all subsequent API calls.

This is why the code calls `loginImplicitGrant` in both the login button handler and the `useEffect` callback.

### Security Considerations

- The implicit grant is considered **less secure** than Authorization Code + PKCE because the token is exposed in the URL.
- Tokens should be treated as sensitive — avoid logging them or storing them in `localStorage`.
- Always use HTTPS in production.
- Genesys Cloud recommends **Authorization Code Grant with PKCE** for new browser apps when possible. Implicit grant is still supported and common for simpler use cases.

---

## Project Structure

```
gcimplicit_auth_poc/
├── src/
│   ├── App.jsx          # Main component — handles auth flow and UI
│   └── main.jsx         # React entry point
├── .env                 # Environment variables (client ID, region, redirect URI)
├── .gitignore           # Ignores node_modules, dist, .env
├── index.html           # HTML shell
├── package.json         # Dependencies and scripts
└── vite.config.js       # Vite dev server config (port, plugins)
```

---

## Prerequisites

- **Node.js** ≥ 18
- A **Genesys Cloud** organization with admin access
- An **OAuth client** configured in Genesys Cloud (see below)

---

## Genesys Cloud OAuth Client Setup

1. Go to **Admin → Integrations → OAuth** in your Genesys Cloud org.
2. Click **Add Client**.
3. Configure:
   - **App Name**: Any descriptive name (e.g., "Implicit Auth POC")
   - **Grant Type**: `Token Implicit Grant (Browser)`
   - **Authorized Redirect URIs**: `http://localhost:3001`
4. Save and copy the **Client ID**.

> ⚠️ The redirect URI must **exactly** match `VITE_GC_REDIRECT_URI` in your `.env` file, including the port and trailing slash (or lack thereof).

---

## Environment Variables

Create a `.env` file in the project root:

```env
VITE_GC_REGION=mypurecloud.com
VITE_GC_CLIENT_ID=your-oauth-client-id-here
VITE_GC_REDIRECT_URI=http://localhost:3001
```

| Variable | Description | Example Values |
|---|---|---|
| `VITE_GC_REGION` | Genesys Cloud API host for your region | `mypurecloud.com`, `mypurecloud.ie`, `mypurecloud.de`, `mypurecloud.jp`, `mypurecloud.com.au`, `usw2.pure.cloud`, `cac1.pure.cloud`, `euw2.pure.cloud` |
| `VITE_GC_CLIENT_ID` | OAuth Client ID from Genesys Cloud Admin | `UUID...` |
| `VITE_GC_REDIRECT_URI` | Must match the Vite dev server URL and the OAuth client's authorized redirect URI | `http://localhost:3001` |

> The `VITE_` prefix is required by Vite to expose env vars to client-side code.

---

## Installation & Running

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

Open http://localhost:3001 in your browser.

### Build for Production

```bash
npm run build
npm run preview
```

---

## App Flow (Code Walkthrough)

### 1. Initial Load — No Token

When the app first loads, there's no `#access_token` in the URL. The `useEffect` check (`if (window.location.hash)`) is falsy, so nothing happens. The user sees a "Login with Genesys Cloud" button.

### 2. User Clicks Login

`handleLogin()` calls `loginImplicitGrant(CLIENT_ID, REDIRECT_URI)`. Since there's no token yet, the SDK **redirects the browser** to:

```
https://login.{ENVIRONMENT}/oauth/authorize?
  response_type=token&
  client_id={CLIENT_ID}&
  redirect_uri={REDIRECT_URI}
```

The user authenticates on the Genesys Cloud login page.

### 3. Redirect Back with Token

After successful login, Genesys Cloud redirects back to:

```
http://localhost:3001/#access_token=XXXXX&token_type=bearer&expires_in=86399
```

### 4. App Parses Token

The page reloads. This time `window.location.hash` contains the token. The `useEffect` fires, calling `loginImplicitGrant()` again — but now the SDK **parses the hash** instead of redirecting. It extracts the access token and configures itself for authenticated API calls.

### 5. Fetch User Info

After successful auth, the app calls `UsersApi().getUsersMe()` to fetch the logged-in user's profile and displays their name and email.

---

## Genesys Cloud Regions

| Region | Environment Value |
|---|---|
| US East (Virginia) | `mypurecloud.com` |
| US West (Oregon) | `usw2.pure.cloud` |
| Canada (Central) | `cac1.pure.cloud` |
| EU (Ireland) | `mypurecloud.ie` |
| EU (Frankfurt) | `mypurecloud.de` |
| EU (London) | `euw2.pure.cloud` |
| Asia Pacific (Sydney) | `mypurecloud.com.au` |
| Asia Pacific (Tokyo) | `mypurecloud.jp` |
| Asia Pacific (Mumbai) | `aps1.pure.cloud` |
| Asia Pacific (Seoul) | `apne2.pure.cloud` |
| Middle East (UAE) | `mec1.pure.cloud` |
| South America (São Paulo) | `sae1.pure.cloud` |

---

## Troubleshooting

| Issue | Cause | Fix |
|---|---|---|
| Redirect loops or blank page after login | Port mismatch between Vite config, `.env`, and OAuth client | Ensure all three use the same port (e.g., `3001`) |
| `401 Unauthorized` on API calls | Token expired or invalid region | Re-login; verify `VITE_GC_REGION` matches your org |
| "Invalid client id" error | Wrong `VITE_GC_CLIENT_ID` | Copy the correct Client ID from Admin → OAuth |
| "Redirect URI mismatch" | Redirect URI in `.env` doesn't exactly match the OAuth client config | Ensure exact match including protocol, host, port, and path |
| Login page shows but nothing happens after auth | `window.location.hash` not being read | Check browser console for errors; ensure `useEffect` runs |

---

## License

See [LICENSE](./LICENSE).
