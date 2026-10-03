namespace InvoiceApp.Api.Models;

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
    public string Description { get; set; } = ""; // Decription of invoice item
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
}

public class ReminderLog
{
    public int Id { get; set; }
    public int InvoiceId { get; set; }
    public DateTime SentAt { get; set; } = DateTime.UtcNow;
    public string Type { get; set; } = ""; // For type such as "BeforeDue", "OnDue", "Overdue"
}