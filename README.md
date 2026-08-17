# SmartSchool React

Premium, modular React/TypeScript frontend based on the approved SmartSchool visual theme.

## Architecture
The frontend is **decoupled from the backend**. Feature components never call ASP.NET endpoints directly. They depend on the `ApiClient` abstraction through `core/api/api.ts`.

- `VITE_USE_MOCKS=true`: runs entirely from local mock data.
- `VITE_USE_MOCKS=false`: switches to `HttpApiClient`.
- `VITE_API_BASE_URL`: points to any compatible backend/API gateway.
- Authentication and tenant headers are injected centrally by the HTTP client.
- TanStack Query owns server-state caching.
- Each business capability lives under `src/features/<module>`.
- Shared UI/layout belongs under `src/components`.
- Environment/configuration belongs under `src/config`.
- No backend DTO or generated C# code is imported into React.

## Modules scaffolded
Dashboard, Academics, Students, Teachers, Examinations, Attendance, Finance, HR & Payroll, Library, Transport, Communication, AI Assistant, Reports and Settings.

Dashboard and Students have working mock-backed screens matching the premium navy/purple theme. Remaining modules have isolated route/page scaffolds ready to expand without growing one giant component.

## Run
```bash
npm install
cp .env.example .env
npm run dev
```

## Backend integration
Keep API contracts behind feature API adapters. For production, add OIDC Authorization Code + PKCE and replace the simple session-storage demonstration token handling with the chosen OIDC client/session strategy.
