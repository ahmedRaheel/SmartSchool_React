# SmartSchool Portal v59

## UI principles
- No raw JSON editors in business screens.
- Sidebar is navigation; Create/Edit/Delete/Impersonate are contextual page actions.
- SuperAdmin works with an explicit tenant context.
- IDs are not manually entered where a searchable business selector can be used.
- Destructive actions require confirmation.
- Impersonation is visible, reversible and audited.

## SuperAdmin navigation
Site Dashboard, Tenants, Tenant Users, Plans & Features, Roles & Permissions,
Lookups, Workflows, Notifications, AI Operations, System Health,
Observability & Logs, Impersonation Audit, Platform Settings.

## Tenant list
Page header contains Add Tenant.
Rows expose View, Impersonate and More actions; More contains Enable/Disable,
Reset Admin Password and Delete. Tenant detail owns Schools/Branches, Users,
Features, Usage, Activity, Audit and Settings.

## Other actors
SchoolAdmin receives school operations; Teacher receives teaching operations;
Student receives learning operations; Parent receives child-centric operations;
Driver receives route/vehicle operations; Examiner receives examination operations.
