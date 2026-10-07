using InvoiceApp.Api.Models;
using InvoiceApp.Api.Services;

namespace InvoiceApp.Tests;

public class ReminderRulesTests
{
    private static readonly DateTime Today = new(2026, 10, 7);
    private static readonly ReminderLog[] None = Array.Empty<ReminderLog>();

    private static Invoice Unpaid(int daysFromToday) =>
        new() { Status = InvoiceStatus.Unpaid, DueDate = Today.AddDays(daysFromToday) };

    private static ReminderLog Sent(string type, int daysAgo) =>
        new() { Type = type, SentAt = Today.AddDays(-daysAgo) };

    [Fact]
    public void Due_in_3_days_sends_before_due()
    {
        Assert.Equal(ReminderTypes.BeforeDue, ReminderRules.GetDueReminder(Unpaid(3), Today, None));
    }

    [Fact]
    public void Due_in_5_days_sends_nothing()
    {
        Assert.Null(ReminderRules.GetDueReminder(Unpaid(5), Today, None));
    }

    [Fact]
    public void Before_due_is_sent_only_once()
    {
        var logs = new[] { Sent(ReminderTypes.BeforeDue, 1) };
        Assert.Null(ReminderRules.GetDueReminder(Unpaid(2), Today, logs));
    }

    [Fact]
    public void Due_today_sends_on_due()
    {
        Assert.Equal(ReminderTypes.OnDue, ReminderRules.GetDueReminder(Unpaid(0), Today, None));
    }

    [Fact]
    public void Past_due_with_no_overdue_reminder_sends_overdue()
    {
        Assert.Equal(ReminderTypes.Overdue, ReminderRules.GetDueReminder(Unpaid(-1), Today, None));
    }

    [Theory]
    [InlineData(3, null)]
    [InlineData(7, ReminderTypes.Overdue)]
    public void Overdue_reminders_are_seven_days_apart(int daysSinceLast, string? expected)
    {
        var logs = new[] { Sent(ReminderTypes.Overdue, daysSinceLast) };
        Assert.Equal(expected, ReminderRules.GetDueReminder(Unpaid(-10), Today, logs));
    }

    [Fact]
    public void No_more_than_three_overdue_reminders()
    {
        var logs = new[]
        {
            Sent(ReminderTypes.Overdue, 21),
            Sent(ReminderTypes.Overdue, 14),
            Sent(ReminderTypes.Overdue, 7)
        };
        Assert.Null(ReminderRules.GetDueReminder(Unpaid(-30), Today, logs));
    }

    [Fact]
    public void Paid_invoice_never_gets_a_reminder()
    {
        var invoice = new Invoice { Status = InvoiceStatus.Paid, DueDate = Today.AddDays(-5) };
        Assert.Null(ReminderRules.GetDueReminder(invoice, Today, None));
    }
}