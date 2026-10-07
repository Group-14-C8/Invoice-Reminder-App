using System.Net;
using System.Net.Mail;
using InvoiceApp.Api.Data;
using InvoiceApp.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace InvoiceApp.Api.Services;

public interface IEmailSender
{
    Task SendAsync(string to, string subject, string body, CancellationToken ct = default);
}

// Demo mode: prints the email to the console instead of sending it.
public class LogEmailSender : IEmailSender
{
    private readonly ILogger<LogEmailSender> _logger;

    public LogEmailSender(ILogger<LogEmailSender> logger) => _logger = logger;

    public Task SendAsync(string to, string subject, string body, CancellationToken ct = default)
    {
        _logger.LogInformation("[DEMO EMAIL] To: {To} | Subject: {Subject}\n{Body}", to, subject, body);
        return Task.CompletedTask;
    }
}

// Real mode: sends through any SMTP server.
public class SmtpEmailSender : IEmailSender
{
    private readonly IConfiguration _config;

    public SmtpEmailSender(IConfiguration config) => _config = config;

    public async Task SendAsync(string to, string subject, string body, CancellationToken ct = default)
    {
        using var client = new SmtpClient(_config["Email:SmtpHost"], _config.GetValue("Email:SmtpPort", 587))
        {
            EnableSsl = true,
            Credentials = new NetworkCredential(_config["Email:SmtpUsername"], _config["Email:SmtpPassword"])
        };

        using var message = new MailMessage
        {
            From = new MailAddress(_config["Email:FromAddress"]!, _config["Email:FromName"]),
            Subject = subject,
            Body = body
        };
        message.To.Add(to);

        await client.SendMailAsync(message, ct);
    }
}