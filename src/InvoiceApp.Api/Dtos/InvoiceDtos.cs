using System.ComponentModel.DataAnnotations;

namespace InvoiceApp.Api.Dtos;

public class InvoiceItemRequest
{
    [Required, MaxLength(300)] public string Description { get; set; } = "";
    [Range(1, 100000)] public int Quantity { get; set; }
    [Range(0.01, 1000000000)] public decimal UnitPrice { get; set; }
}

public class InvoiceRequest
{
    [Range(1, int.MaxValue)] public int ClientId { get; set; }
    public DateTime? IssueDate { get; set; }          // defaults to today
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