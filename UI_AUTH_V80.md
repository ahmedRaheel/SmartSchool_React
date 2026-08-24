# SmartSchool React v80

- Authentication is persisted in localStorage, so a hard browser refresh does not log out a valid user.
- Existing sessionStorage values remain readable for migration/compatibility.
- API 401 now attempts OAuth refresh-token renewal once before clearing authentication.
- Explicit logout still clears both localStorage and sessionStorage authentication values.
- Bootstrap 5.3 is added and imported before the SmartSchool theme, allowing the custom premium theme to override Bootstrap cleanly.
- Added Bootstrap-compatible premium buttons, forms, cards, tables, dropdowns, modal surfaces, badges, focus states and responsive content sizing.
