using InvoiceApp.Api.Data;
using InvoiceApp.Api.Dtos;
using InvoiceApp.Api.Extensions;
using InvoiceApp.Api.Models;
using InvoiceApp.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace InvoiceApp.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/invoices")]
public class InvoicesController : ControllerBase
{
    private readonly AppDbContext _db;

    public InvoicesController(AppDbContext db) => _db = db;

    // GET /api/invoices?status=unpaid|paid|overdue   ("unpaid" includes overdue ones)
    [HttpGet]
    public async Task<ActionResult<List<InvoiceResponse>>> GetAll([FromQuery] string? status)
    {
        var userId = User.GetUserId();
        var today = DateTime.UtcNow.Date;

        var query = _db.Invoices.AsNoTracking()
            .Include(i => i.Client)
            .Include(i => i.Items)
            .Where(i => i.UserId == userId);

        switch (status?.Trim().ToLowerInvariant())
        {
            case "paid": query = query.Where(i => i.Status == InvoiceStatus.Paid); break;
            case "unpaid": query = query.Where(i => i.Status == InvoiceStatus.Unpaid); break;
            case "overdue": query = query.Overdue(today); break;
        }

        var invoices = await query
            .OrderByDescending(i => i.IssueDate)
            .ThenByDescending(i => i.Id)
            .ToListAsync();

        return Ok(invoices.Select(i => ToResponse(i, today)).ToList());
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<InvoiceResponse>> Get(int id)
    {
        var userId = User.GetUserId();
        var invoice = await _db.Invoices.AsNoTracking()
            .Include(i => i.Client)
            .Include(i => i.Items)
            .FirstOrDefaultAsync(i => i.Id == id && i.UserId == userId);

        return invoice is null ? NotFound() : Ok(ToResponse(invoice, DateTime.UtcNow.Date));
    }

    [HttpPost]
    public async Task<ActionResult<InvoiceResponse>> Create(InvoiceRequest request)
    {
        var userId = User.GetUserId();
        var today = DateTime.UtcNow.Date;

        var client = await _db.Clients.FirstOrDefaultAsync(c => c.Id == request.ClientId && c.UserId == userId);
        if (client is null) return BadRequest(new { message = "Client not found." });

        var issueDate = (request.IssueDate ?? today).Date;
        var dueDate = request.DueDate.Date;
        if (dueDate < issueDate)
            return BadRequest(new { message = "Due date cannot be before the issue date." });

        // Simple per-user numbering: INV-0001, INV-0002 ...
        var count = await _db.Invoices.CountAsync(i => i.UserId == userId);
        string number;
        do
        {
            count++;
            number = $"INV-{count:D4}";
        } while (await _db.Invoices.AnyAsync(i => i.UserId == userId && i.InvoiceNumber == number));

        var invoice = new Invoice
        {
            UserId = userId,
            ClientId = client.Id,
            Client = client,
            InvoiceNumber = number,
            IssueDate = issueDate,
            DueDate = dueDate,
            Currency = request.Currency.ToUpperInvariant(),
            Items = request.Items.Select(x => new InvoiceItem
            {
                Description = x.Description.Trim(),
                Quantity = x.Quantity,
                UnitPrice = x.UnitPrice
            }).ToList()
        };

        _db.Invoices.Add(invoice);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(Get), new { id = invoice.Id }, ToResponse(invoice, today));
    }

    [HttpPost("{id:int}/mark-paid")]
    public async Task<ActionResult<InvoiceResponse>> MarkPaid(int id)
    {
        var userId = User.GetUserId();
        var invoice = await _db.Invoices
            .Include(i => i.Client)
            .Include(i => i.Items)
            .FirstOrDefaultAsync(i => i.Id == id && i.UserId == userId);

        if (invoice is null) return NotFound();
        if (invoice.Status == InvoiceStatus.Paid)
            return Conflict(new { message = "Invoice is already paid." });

        invoice.Status = InvoiceStatus.Paid;
        invoice.PaidDate = DateTime.UtcNow.Date;
        await _db.SaveChangesAsync();

        return Ok(ToResponse(invoice, DateTime.UtcNow.Date));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var userId = User.GetUserId();
        var invoice = await _db.Invoices.FirstOrDefaultAsync(i => i.Id == id && i.UserId == userId);
        if (invoice is null) return NotFound();

        if (invoice.Status == InvoiceStatus.Paid)
            return Conflict(new { message = "Paid invoices cannot be deleted." });

        _db.Invoices.Remove(invoice);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    private static InvoiceResponse ToResponse(Invoice i, DateTime today)
    {
        var overdue = InvoiceRules.IsOverdue(i, today);
        return new InvoiceResponse
        {
            Id = i.Id,
            InvoiceNumber = i.InvoiceNumber,
            ClientId = i.ClientId,
            ClientName = i.Client?.Name ?? "",
            IssueDate = i.IssueDate,
            DueDate = i.DueDate,
            Status = i.Status.ToString(),
            IsOverdue = overdue,
            DaysOverdue = overdue ? (today - i.DueDate.Date).Days : 0,
            PaidDate = i.PaidDate,
            Currency = i.Currency,
            Total = i.Items.Sum(x => x.Quantity * x.UnitPrice),
            Items = i.Items.Select(x => new InvoiceItemResponse
            {
                Id = x.Id,
                Description = x.Description,
                Quantity = x.Quantity,
                UnitPrice = x.UnitPrice,
                LineTotal = x.Quantity * x.UnitPrice
            }).ToList()
        };
    }
}