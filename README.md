# Immunization Admin Web

React/Vite admin portal for supervisors and administrators using the immunization backend API.

## Current Features

- Login against `POST /api/auth/login`
- Persistent session storage with JWT access token handling
- Automatic refresh-token rotation on `401` responses
- Session expiry warning modal with `Stay signed in` and `Sign out` actions
- Dashboard metrics for coverage, SMS delivery, sync reliability, and facility performance
- User administration with role assignment and disable actions
- Facility management
- Child registration, search, duplicate review, and CSV export
- Child due-vaccine visibility from vaccine schedules
- Appointment generation from vaccine schedules for a selected child and horizon date
- Vaccine management and vaccine schedule creation
- Appointment creation, completion, missed marking, and immunization recording
- Report exports for coverage, missed appointments, SMS delivery, sync reliability, and facility performance
- Sync monitor, SMS review, audit filtering, and device registration/approval workflows

## Authentication And Sessions

- The app stores the authenticated session in `localStorage`
- Access tokens are decoded locally so the UI can warn before expiry
- The warning modal appears 5 minutes before access token expiry
- Choosing `Stay signed in` calls `POST /api/auth/refresh-token`
- Failed refresh clears the local session and returns the user to login

## API Configuration

The Axios client uses:

- `VITE_API_BASE_URL` when provided
- otherwise `http://localhost:5000`

In local development, this repo also includes a Vite proxy for `/api` and `/health` in [vite.config.ts](vite.config.ts). It currently targets the deployed Railway API. Follow the full local URL setup below to use your own database.

## Children And Scheduling

The Children screen supports:

- exporting all children or filtered exports by date range, month range, year range, and facility
- viewing due vaccine doses for a selected child
- generating appointments from active vaccine schedules through a selected date

The scheduling panel depends on these backend endpoints:

- `GET /api/children/{id}/due-vaccines`
- `POST /api/children/{id}/generate-appointments`

## Report Exports

The Reports screen exposes CSV downloads for:

- immunization coverage
- missed appointments
- SMS delivery
- sync reliability
- facility performance

## Setup from scratch (beginner guide)

First complete the [backend setup guide](https://github.com/Shurlah/hospital-app#setup-from-scratch-beginner-guide), including a successful administrator login. Keep its PostgreSQL database and API running at `http://localhost:35299`.

### 1. Install and download

Install [Git](https://git-scm.com/downloads) and [Node.js 22](https://nodejs.org/en/download/archive/v22) (npm is included). Open a new **PowerShell** terminal and run each command in order:

```powershell
git --version
node --version
npm.cmd --version
New-Item -ItemType Directory -Force C:\dev | Out-Null
cd C:\dev
git clone https://github.com/Shurlah/immunization-admin-web.git
cd C:\dev\immunization-admin-web
npm.cmd ci
```

Sign in with an account that has repository access if Git prompts. If already cloned, open that folder instead. `npm ci` installs the versions in `package-lock.json`; wait for it to finish. On macOS/Linux use `npm` instead of `npm.cmd` and your own checkout path. All following commands run beside `package.json`.

### 2. Configure your local API

Create `.env.local` beside `package.json` containing:

```dotenv
VITE_API_BASE_URL=http://localhost:35299
```

Do not append `/api`; the client adds endpoint paths. Use the full local URL: setting `/` would use the checked-in proxy to the deployed backend. `VITE_` values are public browser configuration; do not put secrets in them.

### 3. Start and sign in

```powershell
npm.cmd run dev
```

Leave the terminal open and visit [http://localhost:5173](http://localhost:5173). Sign in with the credentials seeded by your local backend (`admin@example.com` / `LocalAdmin123!` if you followed its examples). There is no separate frontend account.

If Vite selects another port, free port 5173 or add the displayed browser origin to backend `CORS_ALLOWED_ORIGINS` and restart the API. Restart Vite after editing `.env.local`.

### 4. Prepare your first mobile user

1. Open Facilities and create a test facility.
2. Open Users and create a `HealthWorker` or `FacilitySupervisor`, select that facility, and set login credentials.
3. Create a vaccine and its dose schedule before trying vaccine scheduling.
4. Continue with the [mobile guide](https://github.com/Shurlah/immunization-mobile#readme), using made-up patient data.

Verify that facility/user lists load after saving. Empty dashboards and reports are expected until records exist.

### 5. Check and build

In a second terminal in this repository:

```powershell
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
```

The build produces `dist/`. `VITE_API_BASE_URL` is embedded at build time; set the intended API URL before a deployment build. The development proxy is not included in `dist/`. Stop Vite with **Ctrl+C**. Next time start the database/API, then run `npm.cmd run dev` here.

### Troubleshooting

| Problem | Action |
| --- | --- |
| PowerShell blocks npm.ps1 | Use `npm.cmd` as shown above. |
| Repository not found | Sign in with an account granted access to the repository. |
| Network Error | Open the API health URL, check `.env.local`, and restart Vite. |
| Requests go to Railway | Use the full local URL instead of `/`; check for a shell-level `VITE_API_BASE_URL` overriding the file. |
| CORS error | Match the browser origin in backend CORS configuration and restart the API. |
| 401/session expired | Sign in again with credentials from this backend database. |
| 403 | Check the user's role and assigned facility; use the administrator for administration. |
