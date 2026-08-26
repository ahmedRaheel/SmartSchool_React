# SmartSchool React v84

This pass establishes the code-quality baseline requested for the UI.

- Navigation configuration is separated from rendering.
- Navigation items use typed `LucideIcon` instead of `any`.
- Sidebar JSX is formatted and readable; no compressed one-line component implementation.
- Student creation is driven by the actual OpenAPI request contract, not by existing table rows.
- `CreateStudent.Request` currently exposes TenantId, UserId, StudentNumber, FirstName, LastName, DateOfBirth, Gender, Photo, PhotoContentType, PhotoFileName, AdmissionDate and Status.
- Byte/photo fields support file selection and base64 request serialization.
- Required fields are derived from OpenAPI and validated before submission.
- Existing global loader, confirmation modal, toast/error handling and tenant context remain enabled.

Important: generic backend-contract screens remain useful for administrative/reference resources, but actor workflows should continue to be implemented as dedicated feature pages rather than compressed generic CRUD.
