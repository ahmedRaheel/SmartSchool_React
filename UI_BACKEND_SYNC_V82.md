# SmartSchool React v82 — Backend Sync

- Teacher role now uses the dedicated `/api/teachers` operational API instead of the generic HR CRUD screen.
- Teacher workspace loads `/me`, dashboard, classes, students, timetable, assignments and workload from the backend.
- Added live Create Assignment modal wired to `POST /api/teachers/{employeeId}/assignments`.
- Added live Leave Request modal wired to `POST /api/teachers/{employeeId}/leave`.
- Admin roles retain the HR-backed teacher/staff management workspace.
- Existing v81 global busy loader, confirmation modal, OpenAPI-driven CRUD forms, tenant context, notifications, chat, workflow, AI, reports and role navigation remain in place.

Build note: dependency installation in the packaging environment timed out, so a clean local `npm ci && npm run build` should be run after extraction. The source change itself is isolated to the teacher workspace and theme additions.
