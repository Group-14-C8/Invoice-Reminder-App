using InvoiceApp.Api.Models;
using InvoiceApp.Api.Services;

namespace InvoiceApp.Tests;

public class InvoiceRulesTests
{
    private static readonly DateTime Today = new(2026, 10, 7);

    [Fact]
    public void Unpaid_invoice_past_due_date_is_overdue()
    {
        var invoice = new Invoice { Status = InvoiceStatus.Unpaid, DueDate = new DateTime(2026, 10, 1) };
        Assert.True(InvoiceRules.IsOverdue(invoice, Today));
    }

    [Fact]
    public void Unpaid_invoice_due_today_is_not_overdue()
    {
        var invoice = new Invoice { Status = InvoiceStatus.Unpaid, DueDate = Today };
        Assert.False(InvoiceRules.IsOverdue(invoice, Today));
    }

    [Fact]
    public void Paid_invoice_is_never_overdue()
    {
        var invoice = new Invoice { Status = InvoiceStatus.Paid, DueDate = new DateTime(2026, 9, 1) };
        Assert.False(InvoiceRules.IsOverdue(invoice, Today));
    }
}