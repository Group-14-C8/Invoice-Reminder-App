using InvoiceApp.Api.Models;

namespace InvoiceApp.Api.Services;

public static class ReminderTypes
{
    public const string BeforeDue = "BeforeDue";
    public const string OnDue = "OnDue";
    public const string Overdue = "Overdue";
}

public static class ReminderRules
{
    public const int DaysBeforeDue = 3;
    public const int MaxOverdueReminders = 3;
    public const int OverdueIntervalDays = 7;

    // Returns the reminder type to send today, or null if nothing is due.
    public static string? GetDueReminder(Invoice invoice, DateTime today, IReadOnlyCollection<ReminderLog> alreadySent)
    {
        if (invoice.Status == InvoiceStatus.Paid) return null;

        var daysUntilDue = (invoice.DueDate.Date - today).Days;

        if (daysUntilDue > 0)
        {
            var inWindow = daysUntilDue <= DaysBeforeDue;
            var alreadyDone = alreadySent.Any(r => r.Type == ReminderTypes.BeforeDue);
            return inWindow && !alreadyDone ? ReminderTypes.BeforeDue : null;
        }

        if (daysUntilDue == 0)
            return alreadySent.Any(r => r.Type == ReminderTypes.OnDue) ? null : ReminderTypes.OnDue;

        // Past the due date
        var overdueLogs = alreadySent.Where(r => r.Type == ReminderTypes.Overdue).ToList();
        if (overdueLogs.Count >= MaxOverdueReminders) return null;
        if (overdueLogs.Count == 0) return ReminderTypes.Overdue;

        var lastSent = overdueLogs.Max(r => r.SentAt).Date;
        return (today - lastSent).Days >= OverdueIntervalDays ? ReminderTypes.Overdue : null;
    }
}