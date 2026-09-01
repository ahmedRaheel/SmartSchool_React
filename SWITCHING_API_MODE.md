# Switching Between Mock and Real API

## Quick toggle in .env

```bash
# Mock mode (default — no backend needed)
VITE_USE_MOCKS=true

# Real API mode
VITE_USE_MOCKS=false
VITE_API_BASE_URL=http://localhost:7001
VITE_IDENTITY_BASE_URL=http://localhost:7101
```

## Step-by-step for real API

### 1. Start the backend
```bash
cd SmartSchool/src/SmartSchool.Api
dotnet run --urls "http://localhost:7001"
```

### 2. Start identity server
```bash
cd SmartSchool/src/SmartSchool.Identity
dotnet run --urls "http://localhost:7101"
```

### 3. Switch frontend to real API
```bash
# In SmartSchool_React/.env:
VITE_USE_MOCKS=false
```

### 4. Run frontend
```bash
npm run dev
```

## How the toggle works

The single `VITE_USE_MOCKS` flag is read in `src/config/env.ts`:

```ts
export const env = {
  useMocks: (import.meta.env.VITE_USE_MOCKS ?? "false") === "true",
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:7001",
  identityBaseUrl: import.meta.env.VITE_IDENTITY_BASE_URL ?? "http://localhost:7101",
}
```

In `src/core/api/apiAdapter.ts`, every function is:
```ts
const M = env.useMocks;

export const getStudentsPage = (tenantId, page) =>
  M ? delay(mockData) : api.get("/api/students/student", { params }).then(r => r.data);
```

**Zero code changes needed** — just the .env flag.

## CORS (if you see CORS errors)

Add to your backend `Program.cs` or `appsettings.json`:
```csharp
builder.Services.AddCors(o => o.AddDefaultPolicy(p =>
    p.WithOrigins("http://localhost:5173")
     .AllowAnyHeader()
     .AllowAnyMethod()
     .AllowCredentials()));

app.UseCors();
```

## Login credentials (real API)

Use credentials created during tenant onboarding.
Default superadmin: check your identity server seed data.

## Mock login

Any email/password works in mock mode — the login form auto-fills
from the role picker. Just click a role and press Sign in.
