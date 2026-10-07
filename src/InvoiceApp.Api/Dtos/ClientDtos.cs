using System.ComponentModel.DataAnnotations;

namespace InvoiceApp.Api.Dtos;

public class ClientRequest
{
    [Required, MaxLength(200)] public string Name { get; set; } = "";
    [Required, EmailAddress, MaxLength(200)] public string Email { get; set; } = "";
}

public class ClientResponse
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string Email { get; set; } = "";
}