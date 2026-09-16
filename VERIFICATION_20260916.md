# SmartSchool implementation and verification update

Date: 16 September 2026

The six pending workflow areas identified in the previous audit have been implemented with persisted application data. The backend API, Identity API and React app build successfully. The workflow suite passes 80 checks against an isolated PostgreSQL database engine. These results establish the behavior described below; they are not a claim that every feature of the wider application has been certified for production.

## Completed workflows

| Area | Result |
| --- | --- |
| Admissions | Applications save a validated academic placement. Acceptance checks configured marks, entrance tests, interview, age, gender policy, document requirements and capacity. Student/guardian links, enrollment, decision and application-document transfer commit together. Repeated acceptance and later rejection of an admitted application are blocked. |
| Teachers and academics | Teacher classes, student rosters and timetable reads use academic records. Academic setup saves education levels, years, classes and sections. Teaching allocations connect approved teachers, subjects and classes to assignments and exams. Existing HR allocations are migrated into the same academic records. |
| Learning | Teachers create assignments against their own teaching allocation. Students upload actual files or text; enrollment, deadline and attempt limits are enforced. Teachers save marks and feedback. Students can read saved grades and download their original file bytes. |
| Examinations | Exams save a class, subject schedule and marks policy. Result entry loads enrolled students and saves marks or absence. Incomplete results cannot be published; published results are visible to students and linked parents and are locked against edits. Grade ranges are configurable per campus. |
| Transport | Administrators register vehicles and driver profiles, maintain routes/stops and assign students within vehicle capacity. Drivers see their saved roster, record dated boarding/drop-off/absence and save delay notices. Notices are available to the transport team; no outbound SMS or email is implied. |
| Documents | Uploads validate tenant and owner, persist file bytes and support authenticated download. Compliance counts are calculated from required-document rules and uploaded evidence. File types, checklist types and role requirements can be configured in the UI. |

## Supporting repairs

- Reconciled active model mappings with the PostgreSQL schema in Organization, Students, Admissions, HR, Learning, Examinations, Documents and Transport.
- Added `database/SmartSchool.FreshInstall.sql` and the repeatable `database/postgresql/V123__persisted_school_workflows.sql` upgrade.
- Preserved legacy class identifiers while changing admission foreign keys to canonical grade levels. Backfilled existing HR teaching allocations and class-teacher links.
- Added Dapper date/time conversions required by current PostgreSQL query projections.
- Rejected cross-tenant requests and strengthened campus/actor checks on the repaired workflows.
- Removed unsupported admission automation claims and replaced operational placeholders in the six audited areas.
- Disabled mock mode by default and corrected multipart requests, expired-token handling and API error display.
- Kept feature data access within its owning slices, with Dapper read queries and EF mutations. Module DbContexts and EF configurations remain in Persistence.
- All 83 source/configuration files in the Identity module and Identity API project match the supplied checkpoint byte-for-byte. Shared application tenant-scope validation was tightened separately.

## Verification evidence

| Check | Outcome |
| --- | --- |
| Main API and integration-check project, .NET 10.0.401 | Build succeeded, 0 warnings and 0 errors |
| Identity API | Build succeeded, 0 warnings and 0 errors |
| React TypeScript/Vite production build, Node.js 24.19.0 | Passed; Vite retains a non-blocking large-chunk advisory |
| Fresh application schema with pgcrypto and pgvector | Passed |
| Applying V123 again | Passed |
| Upgrade from the prior baseline with legacy class, section, teacher allocation and admission fixtures | Relationships preserved; repeat application passed |
| EF mapping comparison for eight repaired modules | 73 entity mappings covering 67 tables; no missing mapped tables or columns |
| HTTP/database workflow suite | 80 checks passed |
| Identity project source comparison | 83 files compared; no differences |

The workflow suite exercises saved academic setup, duplicate allocation rejection, teacher ownership, cross-tenant denial, student submission limits, authenticated file bytes, grading bounds, publication rules, parent-child result scope, driver operations, document compliance, admission policy checks and accepted-student document transfer. Details are in `test-results/workflow-checks.json` and the accompanying logs.

## Run and configure

The ZIPs contain source, lockfiles, migration scripts, instructions and verification evidence. Generated binaries and dependency directories are excluded.

For a new application database, install PostgreSQL with pgcrypto and pgvector available, then run `database/SmartSchool.FreshInstall.sql` with stop-on-error enabled. Do not apply the fresh-install script over an existing school database. For an existing database at the supplied baseline, test V123 against a restored copy before applying it to the live database. Keep the Identity database and its existing provisioning process separate.

Configure `ConnectionStrings:SmartSchool`, Identity service credentials and the existing external-service settings for your environment. Restore and build the main API and Identity API using the .NET 10 SDK. The bundled API launch profile exposes HTTP on port 61342. For local development, run Identity explicitly on HTTP port 7101 to match its existing issuer configuration:

```sh
dotnet run --project src/SmartSchool.Identity.Api --no-launch-profile --urls http://localhost:7101
dotnet run --project src/SmartSchool.Api
```

Run these hosts in separate terminals. The React `.env.example` uses `http://localhost:61342`, Identity at `http://localhost:7101`, and `VITE_USE_MOCKS=false`. Configure the matching portal origin in both hosts, copy the example environment settings, then run `npm ci` and `npm run dev` in the frontend folder. Production hosting must use your deployed URLs and issuer configuration.

Reproduce the isolated checks from `tests/SmartSchool.IntegrationChecks`:

```sh
npm ci
node run-checks.mjs
node check-upgrade.mjs
```

See the test project's README for native PostgreSQL verification and environment overrides.

## Verification limits and deployment status

The app has not been deployed. The checks use PGlite's PostgreSQL engine with real EF/Dapper persistence, production authorization policies, test authentication and a test double for external account provisioning. They do not verify live sign-in/token issuance, production account provisioning, connection pooling or concurrent production load.

The React build passed; a complete browser-driven regression across every role was not performed. Attendance, timetable authoring, fees/payments, payroll, library loans, chat/notifications, certificate generation and AI services were not exercised end-to-end in this run. Existing external email/SMS, payment and AI integrations still require validation with the deployment's actual services and credentials.
