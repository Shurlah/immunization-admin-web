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

In local development, this repo also includes a Vite proxy for `/api` and `/health` in [vite.config.ts](</home/manny/Documents/projects/immunization-admin-web/vite.config.ts:1>).

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

## Run Locally

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
```

## Environment

Example local `.env`:

```bash
VITE_API_BASE_URL=/
```

Use a full API URL when the frontend should call a deployed backend directly instead of the local proxy.
