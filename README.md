# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

## Running the app locally

The app has two parts that must both be running: the **FastAPI backend** (port `8080`) and the **Vite frontend** (port `5173`). The Vite dev server proxies `/api` requests to the backend on `8080`, so the backend must be on `8080`.

### 1. Backend (FastAPI) — port 8080

Requires **Python 3.11** and the dependencies in `backend/requirements.txt`.

```bash
# From the repo root
# (first time only) install dependencies
py -3.11 -m pip install -r backend/requirements.txt

# start the backend on port 8080
py -3.11 -m uvicorn backend.app:app --host 0.0.0.0 --port 8080
```

The backend reads Databricks credentials from `backend/.env` (host, token, warehouse id, catalog, schema). It must be running before the UI can load data.

> Note: use `py -3.11` (Python 3.11). Do not use the `.venv-1` environment (Python 3.14) — some native dependencies fail to build there.

### 2. Frontend (Vite + React) — port 5173

Requires **Node.js** and the dependencies in `package.json`.

```bash
# From the repo root
# (first time only) install dependencies
npm install

# start the dev server
npm run dev
```

Then open the URL Vite prints (usually **http://localhost:5173/**; if 5173 is busy it uses 5174, etc.).

### Quick checks

```bash
# backend health (should return JSON, not HTML)
curl http://localhost:8080/api/enterprise/sources/capabilities
```

If the UI shows an "Unexpected token '<'" error, the backend is not running on `8080` (the proxy is serving the SPA fallback instead of JSON). Start the backend on `8080` and reload.

---

## Vite template notes

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```
