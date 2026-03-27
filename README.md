# Genesys Cloud Implicit Auth POC

React/Vite app demonstrating implicit grant authentication with Genesys Cloud JavaScript SDK.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure your Genesys Cloud OAuth client:
   - Open `src/App.jsx`
   - Replace `YOUR_CLIENT_ID` with your OAuth client ID
   - Update `REDIRECT_URI` if needed (default: http://localhost:5173)
   - Update `ENVIRONMENT` to match your region (e.g., mypurecloud.com, mypurecloud.ie, etc.)

3. In Genesys Cloud Admin:
   - Create an OAuth client with Grant Type: "Token Implicit Grant (Browser)"
   - Add `http://localhost:5173` to Authorized redirect URIs

## Run

```bash
npm run dev
```

Navigate to http://localhost:5173
