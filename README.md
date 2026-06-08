# Immunization Admin Web

React/Vite admin portal for supervisors and administrators.

Implemented foundation:

- Login against `/api/auth/login`.
- Session storage and authenticated API client.
- Dashboard metrics from report endpoints.
- Users and facilities list views.
- Report, sync, and audit workspaces wired to backend endpoint contracts.

Run:

```bash
npm install
npm run dev
```

Set `VITE_API_BASE_URL` in `.env` when the API is not running at `http://localhost:5000`.
