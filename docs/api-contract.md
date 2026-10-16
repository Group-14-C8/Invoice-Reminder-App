# API contract derived from the ASP.NET Core backend code

This contract was inferred from the backend code in `src/InvoiceApp.Api` and is the source of truth for the frontend integration. The backend is read-only for this task.

## 1. Backend structure

- API entry point: `src/InvoiceApp.Api/Program.cs`
- Controllers: `src/InvoiceApp.Api/Controllers/AuthController.cs`, `ClientsController.cs`, `InvoicesController.cs`
- DTOs: `src/InvoiceApp.Api/Dtos/AuthDtos.cs`, `ClientDtos.cs`, `InvoiceDtos.cs`
- Models / enum definitions: `src/InvoiceApp.Api/Models/Entities.cs`
- JWT creation: `src/InvoiceApp.Api/Services/TokenService.cs`
- Invoice overdue logic: `src/InvoiceApp.Api/Services/InvoiceRules.cs`
- Local startup profile: `src/InvoiceApp.Api/Properties/launchSettings.json`

## 2. Runtime and infrastructure

### Local URLs and dev profile

- `launchSettings.json` defines these profiles:
  - HTTP: `http://localhost:5031`
  - HTTPS: `https://localhost:7228;http://localhost:5031`
- Swagger is enabled in development with `app.UseSwagger()` and `app.UseSwaggerUI()`.
- Health checks are mapped to `/health` via `app.MapHealthChecks("/health")`.
- HTTPS redirection is enabled with `app.UseHttpsRedirection();`.
- `Program.cs` also adds EF Core health checks and a DB context check.

### CORS / origins

- There is no explicit `AddCors` or custom CORS policy in the code examined.
- This means the backend does not configure a custom allowed-origin list in the code read here.

### Auth / JWT

- JWT config is read from `Jwt:Key`, `Jwt:Issuer`, and `Jwt:Audience` in appsettings.
- `AddAuthentication(JwtBearerDefaults.AuthenticationScheme)` is configured in `Program.cs`.
- `options.MapInboundClaims = false` and `TokenValidationParameters` are set.
- `NameClaimType = "sub"`
- `RoleClaimType = "role"`
- Tokens are created in `TokenService.CreateToken(User user)` by `JwtSecurityTokenHandler().WriteToken(token)`.
- Claim set:
  - `sub` = user.Id as string
  - `email` = user.Email
  - `role` = user.Role.ToString()
- Token lifetime: created with `expires: DateTime.UtcNow.AddHours(8)`.
- No refresh-token flow is present.

### Database and serialization

- EF Core uses `UseSqlServer(...)` against the `Default` connection string from `appsettings.json`.
- `User.Role` and `Invoice.Status` are stored as integers in SQL Server (`UserRole` and `InvoiceStatus` enums), but string serialization is visible in controller responses because the API uses `.ToString()` for the `Role` and `Status` values when returning DTOs.
- Dates are returned as `DateTime` values (`DateTime` / `DateTime?`), not `DateOnly`.
- The backend uses UTC on the server side (`DateTime.UtcNow`) for created/paid timestamps and for computations. `IssueDate`, `DueDate`, and `PaidDate` are `DateTime` values.
- `InvoiceItem.UnitPrice` has precision 18,2 in EF Core.
- `InvoiceResponse.Total` is computed server-side as `i.Items.Sum(x => x.Quantity * x.UnitPrice)`.
- `InvoiceResponse.Items[].LineTotal` is computed server-side as quantity × unit price.

## 3. Controllers and routes

### Auth

`src/InvoiceApp.Api/Controllers/AuthController.cs`

- POST `/api/auth/register`
  - Auth: none
  - Request body: `RegisterRequest`
    - `Email: string` (required, valid email)
    - `Password: string` (required, min length 8)
  - Success: `200 OK` with `AuthResponse`
  - Duplicate email: `409 Conflict` with `{ message: "Email is already registered." }`
  - Validation errors: ASP.NET automatic `ValidationProblemDetails` / model validation failure

- POST `/api/auth/login`
  - Auth: none
  - Request body: `LoginRequest`
    - `Email: string`
    - `Password: string`
  - Success: `200 OK` with `AuthResponse`
  - Bad credentials: `401 Unauthorized` with `{ message: "Invalid email or password." }`

- GET `/api/auth/me`
  - Auth: `[Authorize]`
  - Returns:
    - `id` from claim `sub`
    - `email` from claim `email`
    - `role` from claim `role`

### Clients

`src/InvoiceApp.Api/Controllers/ClientsController.cs`

- GET `/api/clients`
  - Auth: `[Authorize]`
  - Returns all clients owned by the current user, sorted by `Name`.
  - Response shape: `List<ClientResponse>`

- GET `/api/clients/{id:int}`
  - Auth: `[Authorize]`
  - Ownership check: `c.Id == id && c.UserId == userId`
  - `404 NotFound` if missing or not owned

- POST `/api/clients`
  - Auth: `[Authorize]`
  - Request body: `ClientRequest`
    - `Name: string`
    - `Email: string`
  - Creates a client bound to the logged-in user
  - Success: `201 Created` with the created object

- PUT `/api/clients/{id:int}`
  - Auth: `[Authorize]`
  - Ownership check: only the current user's client can be updated
  - Success: `200 OK` with updated object
  - `404 NotFound` if not found or not owned

- DELETE `/api/clients/{id:int}`
  - Auth: `[Authorize]`
  - Ownership check: current user only
  - Blocked if the client has invoices: `409 Conflict` with `{ message: "This client has invoices and cannot be deleted." }`
  - `204 NoContent` on success

### Invoices

`src/InvoiceApp.Api/Controllers/InvoicesController.cs`

- GET `/api/invoices?status=unpaid|paid|overdue`
  - Auth: `[Authorize]`
  - Query parameter: `status` (optional)
  - Filtering logic:
    - `paid` -> `Status == InvoiceStatus.Paid`
    - `unpaid` -> `Status == InvoiceStatus.Unpaid`
    - `overdue` -> `query.Overdue(today)`, where overdue is `Status == Unpaid && DueDate < today`
  - Order: `IssueDate desc, Id desc`
  - Returns `List<InvoiceResponse>`

- GET `/api/invoices/{id:int}`
  - Auth: `[Authorize]`
  - Ownership check: `i.Id == id && i.UserId == userId`
  - `404 NotFound` if not found or not owned

- POST `/api/invoices`
  - Auth: `[Authorize]`
  - Request body: `InvoiceRequest`
    - `ClientId: int` (must belong to the current user)
    - `IssueDate: DateTime?` (optional; defaults to today)
    - `DueDate: DateTime`
    - `Currency: string` (3-letter code enforced by `StringLength(3, MinimumLength = 3)`, e.g. `NGN`)
    - `Items: List<InvoiceItemRequest>`
  - Validation rules:
    - `DueDate` cannot be before `IssueDate`
    - Client must belong to the user
  - Invoice number generation: `INV-0001`, `INV-0002`, etc., per user, using a loop until a unique number is found.
  - Success: `201 Created` with `InvoiceResponse`
  - `400 BadRequest` for invalid client or due-date ordering

- Invoice update is not implemented: there is no `PUT /api/invoices/{id}` action. The frontend therefore exposes create, read, mark-paid, and delete only.

- POST `/api/invoices/{id:int}/mark-paid`
  - Auth: `[Authorize]`
  - Ownership check: current user only
  - If already `Paid`: `409 Conflict` with `{ message: "Invoice is already paid." }`
  - Otherwise sets `Status = InvoiceStatus.Paid` and `PaidDate = DateTime.UtcNow.Date`
  - Returns `200 OK` with updated invoice

- DELETE `/api/invoices/{id:int}`
  - Auth: `[Authorize]`
  - Ownership check: current user only
  - Prevents deleting an invoice if `Status == InvoiceStatus.Paid`: `409 Conflict` with `{ message: "Paid invoices cannot be deleted." }`
  - `204 NoContent` on success

## 4. DTO and model shapes

### Auth DTOs

`src/InvoiceApp.Api/Dtos/AuthDtos.cs`

```csharp
public class RegisterRequest
{
    [Required, EmailAddress] public string Email { get; set; } = "";
    [Required, MinLength(8)] public string Password { get; set; } = "";
}

public class LoginRequest
{
    [Required] public string Email { get; set; } = "";
    [Required] public string Password { get; set; } = "";
}

public class AuthResponse
{
    public string Token { get; set; } = "";
    public string Email { get; set; } = "";
    public string Role { get; set; } = "";
}
```

### Client DTOs

`src/InvoiceApp.Api/Dtos/ClientDtos.cs`

```csharp
public class ClientRequest
{
    [Required, MaxLength(200)] public string Name { get; set; } = "";
    [Required, EmailAddress, MaxLength(200)] public string Email { get; set; } = "";
}

public class ClientResponse
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string Email { get; set; } = "";
}
```

### Invoice DTOs

`src/InvoiceApp.Api/Dtos/InvoiceDtos.cs`

```csharp
public class InvoiceItemRequest
{
    [Required, MaxLength(300)] public string Description { get; set; } = "";
    [Range(1, 100000)] public int Quantity { get; set; }
    [Range(0.01, 1000000000)] public decimal UnitPrice { get; set; }
}

public class InvoiceRequest
{
    [Range(1, int.MaxValue)] public int ClientId { get; set; }
    public DateTime? IssueDate { get; set; }
    public DateTime DueDate { get; set; }
    [Required, StringLength(3, MinimumLength = 3)] public string Currency { get; set; } = "NGN";
    [Required, MinLength(1)] public List<InvoiceItemRequest> Items { get; set; } = new();
}

public class InvoiceItemResponse
{
    public int Id { get; set; }
    public string Description { get; set; } = "";
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal LineTotal { get; set; }
}

public class InvoiceResponse
{
    public int Id { get; set; }
    public string InvoiceNumber { get; set; } = "";
    public int ClientId { get; set; }
    public string ClientName { get; set; } = "";
    public DateTime IssueDate { get; set; }
    public DateTime DueDate { get; set; }
    public string Status { get; set; } = "";
    public bool IsOverdue { get; set; }
    public int DaysOverdue { get; set; }
    public DateTime? PaidDate { get; set; }
    public string Currency { get; set; } = "";
    public decimal Total { get; set; }
    public List<InvoiceItemResponse> Items { get; set; } = new();
}
```

### Entities

`src/InvoiceApp.Api/Models/Entities.cs`

```csharp
public enum UserRole { User = 0, Admin = 1 }
public enum InvoiceStatus { Unpaid = 0, Paid = 1 }

public class User
{
    public int Id { get; set; }
    public string Email { get; set; } = "";
    public string PasswordHash { get; set; } = "";
    public UserRole Role { get; set; } = UserRole.User;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class Client
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string Name { get; set; } = "";
    public string Email { get; set; } = "";
}

public class Invoice
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int ClientId { get; set; }
    public Client? Client { get; set; }
    public string InvoiceNumber { get; set; } = "";
    public DateTime IssueDate { get; set; }
    public DateTime DueDate { get; set; }
    public InvoiceStatus Status { get; set; } = InvoiceStatus.Unpaid;
    public DateTime? PaidDate { get; set; }
    public string Currency { get; set; } = "NGN";
    public List<InvoiceItem> Items { get; set; } = new();
}

public class InvoiceItem
{
    public int Id { get; set; }
    public int InvoiceId { get; set; }
    public string Description { get; set; } = "";
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
}

public class ReminderLog
{
    public int Id { get; set; }
    public int InvoiceId { get; set; }
    public DateTime SentAt { get; set; } = DateTime.UtcNow;
    public string Type { get; set; } = "";
}
```

## 5. Serialization and validation details

- The app does not configure a JSON enum converter in the controller pipeline, so enum values are serialized as strings when converted by `.ToString()` in the DTOs (for example `Status = "Unpaid"` or `Role = "Admin"`) and stored as integers in SQL Server.
- Dates are `DateTime` and are sent/returned as date-time values; in the backend code, `DateTime.UtcNow` is used for timestamps.
- Money is decimal-based and computed on the server from line items using `i.Items.Sum(...)` and `x.Quantity * x.UnitPrice`.
- IDs are `int` (not GUID or long) in the backend entities and DTOs.
- Validation uses DataAnnotations on request DTOs (`Required`, `EmailAddress`, `Range`, `MinLength`, `StringLength`).
- For 400 / 401 / 403 / 404 / 409, the controllers mostly return standard ASP.NET Core results: `BadRequest`, `Unauthorized`, `NotFound`, `Conflict`.
- The controllers do not return custom `ValidationProblemDetails` objects in the code examined; they rely on ASP.NET model validation and on custom inline objects like `{ message: "..." }` in conflict/unauthorized cases.

## 6. Business rules from the code

- Overdue is computed, not stored: `InvoiceRules.IsOverdue(invoice, today) => invoice.Status == InvoiceStatus.Unpaid && invoice.DueDate.Date < today`.
- The list route filters overdue as `Status == Unpaid && DueDate < today`.
- There is no invoice `PUT` update or `Send` endpoint; the only invoice action beyond create/read/delete is `mark-paid`.
- A user can only access their own clients and invoices. Client update is supported; invoice update is not.
- `InvoiceRequest.Currency` is required and must be a 3-letter code. The backend defaults new invoices to `NGN` but accepts any 3-letter code; the current frontend create form sends `NGN`.
- `AuthController.Register` assigns the default `UserRole.User` and does not create an admin automatically in the code read here.
- `TokenService.CreateToken` includes only `sub`, `email`, and `role` claims.
- There is no `/api/dashboard` or `/api/admin/summary` route in the backend code read here.
- `GET /api/invoices` always filters by the authenticated user's ID, including for an `Admin` role; it cannot provide cross-user platform analytics.
- Reminder logs exist in the model and service layer, but there is no API endpoint returning reminder history in the controller code read.

## 7. Differences from the assumptions in project.md

- The product assumptions talk about `Draft` and `Sent` states, but the backend data model defines only `InvoiceStatus.Unpaid` and `InvoiceStatus.Paid`.
- The backend does not return a `status` string like `Draft` or `Sent` for invoice records; it returns `"Unpaid"` or `"Paid"` and computes `IsOverdue` separately.
- The backend does not implement a `send` route. The frontend has no `POST /api/invoices/{id}/send` endpoint in the controller code read here.
- There is no `/api/dashboard` endpoint and no `/api/admin/summary` endpoint in the controllers.
- The backend token includes `email` and `role` but not `fullName`, `businessName`, or other custom profile claims.
- There is no reminder-history endpoint exposed to the frontend in the controller code.
- There is no `currency` in the user or admin summary payloads; invoice currency is only on each invoice.
- `AuthResponse` does not return a nested `user` object; it only returns `token`, `email`, and `role`.
- The backend uses SQL Server `int` enum storage, not string enum serialization in the database, even though response strings are human-readable.
- DataAnnotation validation on `[ApiController]` actions uses ASP.NET's automatic validation response; explicit business errors use `{ message: ... }` objects.
- The backend does not expose a top-overdue-users endpoint in the read code.
- The backend uses `DateTime` rather than `DateOnly` or an ISO date string only; values should be treated as date-time payloads in the frontend adapter.

## 8. Runtime assumptions not verified against a live API

- The API's deployed origin and any reverse proxy routing `/api` and `/health` to the backend are not confirmed. The frontend uses same-origin requests outside development and the configured Vite proxy in development.
- ASP.NET Core's default JSON web settings are expected to emit camelCase property names; adapters also accept PascalCase. No HTTP response was observed.
- DateTime values are expected to arrive in the standard JSON date-time representation. The UI intentionally uses the calendar portion for due-date display; timezone edge cases have not been verified against a running API.
- Authentication, database availability, HTTPS redirection, and actual status/error responses have not been exercised against a server.
