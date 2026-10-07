namespace InvoiceApp.Api.Services;

public class ReminderWorker : BackgroundService
{
    private readonly IServiceScopeFactory _scopes;
    private readonly ILogger<ReminderWorker> _logger;
    private readonly TimeSpan _interval;

    public ReminderWorker(IServiceScopeFactory scopes, ILogger<ReminderWorker> logger, IConfiguration config)
    {
        _scopes = scopes;
        _logger = logger;
        _interval = TimeSpan.FromMinutes(config.GetValue("Reminders:IntervalMinutes", 60));
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // Give the app a few seconds to finish starting, then check now and on every tick.
        await Task.Delay(TimeSpan.FromSeconds(10), stoppingToken);

        using var timer = new PeriodicTimer(_interval);
        do
        {
            await RunOnce(stoppingToken);
        }
        while (await timer.WaitForNextTickAsync(stoppingToken));
    }

    private async Task RunOnce(CancellationToken ct)
    {
        try
        {
            using var scope = _scopes.CreateScope();
            var reminders = scope.ServiceProvider.GetRequiredService<ReminderService>();
            var sent = await reminders.RunAsync(ct);
            _logger.LogInformation("Reminder check finished: {Count} reminder(s) sent", sent);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            // Never let a failed run crash the whole API.
            _logger.LogError(ex, "Reminder check failed");
        }
    }
}