using InvoiceApp.Api.Models;

namespace InvoiceApp.Api.Services;

public static class InvoiceRules
{
    // Overdue = not paid AND due date is before today. It is calculated, never stored.
    public static bool IsOverdue(Invoice invoice, DateTime today) =>
        invoice.Status == InvoiceStatus.Unpaid && invoice.DueDate.Date < today;

    // Same rule for database queries (used by lists now, and by the admin dashboard later).
    public static IQueryable<Invoice> Overdue(this IQueryable<Invoice> query, DateTime today) =>
        query.Where(i => i.Status == InvoiceStatus.Unpaid && i.DueDate < today);
}