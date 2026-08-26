# SmartSchool React completion pass v81

- Added application-wide blocking loader for live operations.
- Added reusable confirmation dialog and removed browser `window.confirm` from live CRUD.
- Fixed create dialogs on empty tables by deriving form fields from the OpenAPI request contract.
- Added date/email/phone input semantics.
- Added module-specific default resources and business titles for Students, Attendance, Academics, Exams, Finance, HR, Library and Transport.
- Split Admissions from Students in navigation.
- Added Library and Documents/Certificates to the role-aware sidebar.
- Preserved tenant switching, toast feedback, details modal, edit modal, search, refresh, responsive layout, dark mode, chat/notification drawers and AI workspace.
- All generic module screens remain driven by the backend OpenAPI contract, so newly exposed vertical slices become reachable without duplicating CRUD plumbing.
