# Legal Ecosystem

React/Vite client and Express API for the Legal Ecosystem project.

## Run locally

1. Copy `server/.env.example` to `server/.env` and fill in your own MongoDB and email credentials. Keep `.env` private.
2. In one terminal, run `cd server`, `npm install`, then `npm run dev`.
3. Copy `client/.env.example` to `client/.env` if you need to change the API URL. In another terminal, run `cd client`, `npm install`, then `npm run dev`.
4. Open the Vite URL shown in the client terminal.

## Priority prediction status

The clerk form can request an optional binary model status. It never changes the clerk's Low/Medium/High selection. The supplied dataset does not currently support a useful estimate; see [server/ml/README.md](server/ml/README.md). Use a reviewed and representative dataset before relying on this feature.

## Git and deployment

The root `.gitignore` excludes local secrets, dependencies, build output, and uploaded documents. Before publishing, review `git status` and confirm that no `.env` files, uploaded documents, or private case data are staged.

For hosting, configure `VITE_API_BASE_URL` to the deployed API URL in the client service. Configure `MONGO_URI`, `JWT_SECRET`, `EMAIL_USER`, `EMAIL_PASS`, and `CLIENT_ORIGIN` as private environment variables in the backend service. Set the frontend build command to `npm run build` with `client` as the root directory; set the backend start command to `npm start` with `server` as the root directory. Persistent storage is needed if uploaded documents must survive backend restarts.
