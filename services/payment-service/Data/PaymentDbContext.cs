using Microsoft.EntityFrameworkCore;
using PaymentService.Models;

namespace PaymentService.Data;

public class PaymentDbContext(DbContextOptions<PaymentDbContext> options) : DbContext(options)
{
    public DbSet<Transaction> Transactions => Set<Transaction>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Transaction>(e =>
        {
            e.ToTable("transactions");
            e.HasKey(t => t.Id);
            e.Property(t => t.Amount).HasPrecision(18, 2);
            e.Property(t => t.Status).HasMaxLength(32);
            e.Property(t => t.StripePaymentIntentId).HasMaxLength(256);
            e.HasIndex(t => t.StripePaymentIntentId).IsUnique();
            e.HasIndex(t => t.UserId);
        });
    }
}
