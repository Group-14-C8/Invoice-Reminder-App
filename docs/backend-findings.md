# Backend findings for the partner

This file lists the gaps, missing endpoints, and mismatches between the frontend assumptions and the actual ASP.NET Core backend code read in `src/InvoiceApp.Api`.

## 1. Missing dashboard and admin summary endpoints

- Endpoint: `/api/dashboard` and `/api/admin/summary`
- Code: no matching controllers or routes were found under `src/InvoiceApp.Api/Controllers`.
- Impact: the current frontend dashboard/admin screens assumed summary endpoints that do not exist.
- Severity: blocker
- Suggested fix: expose user and admin summary endpoints. A user summary can be derived from that user's invoices, but platform-wide figures cannot be derived from the current user-scoped invoice route.

## 2. No send endpoint for invoices

- Endpoint: `/api/invoices/{id}/send`
- Code: `src/InvoiceApp.Api/Controllers/InvoicesController.cs` has `mark-paid` and delete routes, but no `send` action.
- Impact: the app cannot send an invoice through the backend as currently implemented.
- Severity: blocker
- Suggested fix: add a server-side send action or hide the UI action when the backend contract lacks it.

## 3. Invoice lifecycle is not Draft/Sent/Overdue in the model

- Code: `src/InvoiceApp.Api/Models/Entities.cs` defines `InvoiceStatus { Unpaid, Paid }` only.
- Impact: UI assumptions about `Draft`, `Sent`, and a persisted overdue state do not match the backend data model.
- Severity: blocker
- Suggested fix: either add the missing lifecycle statuses to the backend or normalize the UI to use a derived `Overdue` display state while retaining `Unpaid`/`Paid` as the persisted status.

## 4. Invoice updates are not implemented

- Endpoint: `PUT /api/invoices/{id}`
- Code: `InvoicesController` has no update action; create, read, mark-paid, and delete are present.
- Impact: existing invoices cannot be edited through the current API.
- Severity: blocker
- Suggested fix: add an ownership-checked update action with an explicit request DTO, or keep editing unavailable in the frontend until that contract exists.

## 5. No nested auth user payload

- Endpoint: `/api/auth/register` and `/api/auth/login`
- Code: `src/InvoiceApp.Api/Dtos/AuthDtos.cs` returns `{ token, email, role }` only.
- Impact: the frontend previously expected a nested `user` object; the live backend does not send one.
- Severity: blocker
- Suggested fix: map the backend response into the frontend session model after login/register.

## 6. JWT claims do not carry profile fields

- Code: `src/InvoiceApp.Api/Services/TokenService.cs`
- Impact: tokens contain `sub`, `email`, and `role` but not `fullName`, `businessName`, or other profile claims.
- Severity: should fix
- Suggested fix: add app-specific profile claims if the frontend must show full names and business names without a separate user-me call.

## 7. No reminder history endpoint

- Code: `ReminderLog` and `ReminderService` exist, but no controller exposes reminder history.
- Impact: reminder timeline data cannot be rendered without a backend route.
- Severity: nice to have
- Suggested fix: expose a reminder endpoint or omit reminder history from the UI.

## 8. No CORS policy is configured in the backend code reviewed

- Code: `src/InvoiceApp.Api/Program.cs` has no `AddCors` configuration.
- Impact: the frontend should use the configured dev proxy and same-origin for production to avoid dependency on CORS during development.
- Severity: should fix
- Suggested fix: add an explicit CORS policy for the allowed dev origins if browser access is required from a separate frontend origin.

## 9. User summary and admin summary are missing

- Code: no `dashboard` or `admin` controllers.
- Impact: the frontend cannot render those summary screens exactly as designed. `GET /api/invoices` is restricted to the authenticated user's records, so it cannot produce cross-user admin figures.
- Severity: blocker
- Suggested fix: expose real backend summary endpoints; retain client-side aggregation only for the authenticated user's overview.

## 10. `Currency` is invoice-level only

- Code: `src/InvoiceApp.Api/Dtos/InvoiceDtos.cs` and `Models/Entities.cs`
- Impact: the frontend assumed a user-level currency or shared currency summary, but the server stores currency per invoice only.
- Severity: should fix
- Suggested fix: if multi-currency support is needed later, add user-level settings or summary grouping on the backend.

## 11. Validation responses are not fully standardized around the current frontend assumptions

- Code: `AuthController`, `ClientsController`, and `InvoicesController` return model validation errors and custom `{ message: ... }` objects.
- Impact: the frontend should map backend validation errors conservatively instead of assuming a single `errors` object shape.
- Severity: should fix
- Suggested fix: standardize the backend validation responses to `ValidationProblemDetails` or consistent custom error objects.
