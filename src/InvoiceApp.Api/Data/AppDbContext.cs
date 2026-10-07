using InvoiceApp.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace InvoiceApp.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Client> Clients => Set<Client>();
    public DbSet<Invoice> Invoices => Set<Invoice>();
    public DbSet<InvoiceItem> InvoiceItems => Set<InvoiceItem>();
    public DbSet<ReminderLog> ReminderLogs => Set<ReminderLog>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<User>().HasIndex(u => u.Email).IsUnique();

        b.Entity<Invoice>().HasIndex(i => new { i.UserId, i.InvoiceNumber }).IsUnique();

        b.Entity<InvoiceItem>().Property(i => i.UnitPrice).HasPrecision(18, 2);

        // Users own clients and invoices; don't cascade-delete (avoids SQL Server cycle errors)
        b.Entity<Client>().HasOne<User>().WithMany()
            .HasForeignKey(c => c.UserId).OnDelete(DeleteBehavior.Restrict);
        b.Entity<Invoice>().HasOne<User>().WithMany()
            .HasForeignKey(i => i.UserId).OnDelete(DeleteBehavior.Restrict);
        b.Entity<Invoice>().HasOne(i => i.Client).WithMany()
            .HasForeignKey(i => i.ClientId).OnDelete(DeleteBehavior.Restrict);

        // Items and reminder logs belong to an invoice
        b.Entity<InvoiceItem>().HasOne<Invoice>().WithMany(i => i.Items)
            .HasForeignKey(i => i.InvoiceId).OnDelete(DeleteBehavior.Cascade);
        b.Entity<ReminderLog>().HasOne<Invoice>().WithMany()
            .HasForeignKey(r => r.InvoiceId).OnDelete(DeleteBehavior.Cascade);
    }
}