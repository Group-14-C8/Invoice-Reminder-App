using InvoiceApp.Api.Data;
using InvoiceApp.Api.Dtos;
using InvoiceApp.Api.Extensions;
using InvoiceApp.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace InvoiceApp.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/clients")]
public class ClientsController : ControllerBase
{
    private readonly AppDbContext _db;

    public ClientsController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<List<ClientResponse>>> GetAll()
    {
        var userId = User.GetUserId();
        var clients = await _db.Clients
            .Where(c => c.UserId == userId)
            .OrderBy(c => c.Name)
            .Select(c => new ClientResponse { Id = c.Id, Name = c.Name, Email = c.Email })
            .ToListAsync();
        return Ok(clients);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ClientResponse>> Get(int id)
    {
        var userId = User.GetUserId();
        var client = await _db.Clients.FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);
        return client is null ? NotFound() : Ok(ToResponse(client));
    }

    [HttpPost]
    public async Task<ActionResult<ClientResponse>> Create(ClientRequest request)
    {
        var client = new Client
        {
            UserId = User.GetUserId(),
            Name = request.Name.Trim(),
            Email = request.Email.Trim().ToLowerInvariant()
        };

        _db.Clients.Add(client);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(Get), new { id = client.Id }, ToResponse(client));
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<ClientResponse>> Update(int id, ClientRequest request)
    {
        var userId = User.GetUserId();
        var client = await _db.Clients.FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);
        if (client is null) return NotFound();

        client.Name = request.Name.Trim();
        client.Email = request.Email.Trim().ToLowerInvariant();
        await _db.SaveChangesAsync();

        return Ok(ToResponse(client));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var userId = User.GetUserId();
        var client = await _db.Clients.FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);
        if (client is null) return NotFound();

        if (await _db.Invoices.AnyAsync(i => i.ClientId == id))
            return Conflict(new { message = "This client has invoices and cannot be deleted." });

        _db.Clients.Remove(client);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    private static ClientResponse ToResponse(Client c) =>
        new() { Id = c.Id, Name = c.Name, Email = c.Email };
}