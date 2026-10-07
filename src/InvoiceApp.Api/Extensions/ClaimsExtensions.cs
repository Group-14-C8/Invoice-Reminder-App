using System.Security.Claims;

namespace InvoiceApp.Api.Extensions;

public static class ClaimsExtensions
{
    public static int GetUserId(this ClaimsPrincipal user) =>
        int.Parse(user.FindFirst("sub")!.Value);
}