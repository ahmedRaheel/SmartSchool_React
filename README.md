# SmartSchool Web

Premium responsive React/Vite UI for SmartSchool.

## Demo login

- Email: `admin@smartschool.demo`
- Password: `SmartSchool@2026`

Authentication and module data are mocked in this frontend build. Login state is persisted in local storage and logout clears the session.

## Run

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
```

The frontend remains decoupled from the backend through the existing `ApiClient` abstraction and `VITE_USE_MOCKS` configuration.
