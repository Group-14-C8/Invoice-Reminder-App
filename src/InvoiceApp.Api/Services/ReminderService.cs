using InvoiceApp.Api.Data;
using InvoiceApp.Api.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.UI.Services;
using Microsoft.EntityFrameworkCore;

namespace InvoiceApp.Api.Services;

public class ReminderService
{
    private readonly AppDbContext _db;
    private readonly IEmailSender _email;
    private readonly ILogger<ReminderService> _logger;

    public ReminderService(AppDbContext db, IEmailSender email, ILogger<ReminderService> logger)
    {
        _db = db;
        _email = email;
        _logger = logger;
    }

    // One pass: send every reminder that is due today. Returns how many were sent.
    public async Task<int> RunAsync(CancellationToken ct = default)
    {
        var today = DateTime.UtcNow.Date;

        // Only unpaid invoices due within the next 3 days (or already past due) can need a reminder.
        var invoices = await _db.Invoices
            .Include(i => i.Client)
            .Include(i => i.Items)
            .Where(i => i.Status == InvoiceStatus.Unpaid && i.DueDate <= today.AddDays(ReminderRules.DaysBeforeDue))
            .ToListAsync(ct);

        if (invoices.Count == 0) return 0;

        var invoiceIds = invoices.Select(i => i.Id).ToList();
        var ownerIds = invoices.Select(i => i.UserId).Distinct().ToList();

        var logs = (await _db.ReminderLogs.Where(r => invoiceIds.Contains(r.InvoiceId)).ToListAsync(ct))
            .ToLookup(r => r.InvoiceId);
        var owners = await _db.Users.Where(u => ownerIds.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, u => u.Email, ct);

        var sent = 0;
        foreach (var invoice in invoices)
        {
            var type = ReminderRules.GetDueReminder(invoice, today, logs[invoice.Id].ToList());
            if (type is null || invoice.Client is null) continue;

            try
            {
                var ownerEmail = owners.GetValueOrDefault(invoice.UserId, "");
                var (subject, body) = BuildEmail(type, invoice, ownerEmail, today);

                await _email.SendAsync(invoice.Client.Email, subject, body, ct);

                // Record it only after a successful send, so a failed email is retried next run.
                _db.ReminderLogs.Add(new ReminderLog { InvoiceId = invoice.Id, Type = type, SentAt = DateTime.UtcNow });
                await _db.SaveChangesAsync(ct);
                sent++;
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                _logger.LogError(ex, "Could not send {Type} reminder for invoice {Number}", type, invoice.InvoiceNumber);
            }
        }

        return sent;
    }

    private static (string Subject, string Body) BuildEmail(string type, Invoice invoice, string ownerEmail, DateTime today)
    {
        var total = invoice.Items.Sum(x => x.Quantity * x.UnitPrice);
        var due = invoice.DueDate.Date;
        var daysUntilDue = (due - today).Days;

        var (subject, intro) = type switch
        {
            ReminderTypes.BeforeDue => (
                $"Reminder: Invoice {invoice.InvoiceNumber} is due on {due:dd MMM yyyy}",
                $"This is a friendly reminder that the invoice below is due in {daysUntilDue} day(s)."),
            ReminderTypes.OnDue => (
                $"Invoice {invoice.InvoiceNumber} is due today",
                "This is a reminder that the invoice below is due today."),
            _ => (
                $"Overdue: Invoice {invoice.InvoiceNumber} was due on {due:dd MMM yyyy}",
                $"The invoice below is now {-daysUntilDue} day(s) overdue.")
        };

        var body =
            $"Hello {invoice.Client!.Name},\n\n" +
            $"{intro}\n\n" +
            $"Invoice: {invoice.InvoiceNumber}\n" +
            $"Amount: {invoice.Currency} {total:N2}\n" +
            $"Due date: {due:dd MMM yyyy}\n\n" +
            $"If you have already paid, please ignore this message. Otherwise, please arrange payment " +
            $"as soon as possible, or contact {ownerEmail} with any questions.\n\n" +
            "Thank you.";

        return (subject, body);
    }
}