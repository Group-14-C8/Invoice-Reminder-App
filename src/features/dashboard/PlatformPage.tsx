import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "../../api/http";
import { endpoints } from "../../api/endpoints";
import type { AdminSummary } from "../../api/types";
import { Amount } from "../../components/ui/Amount";

const statuses: Array<"Draft" | "Sent" | "Paid" | "Overdue"> = [
  "Draft",
  "Sent",
  "Paid",
  "Overdue",
];

export function PlatformPage() {
  const { data: summary } = useQuery({
    queryKey: ["admin-summary"],
    queryFn: async () => apiRequest<AdminSummary>(endpoints.admin.summary),
  });

  const maxTotal = Math.max(
    ...statuses.map((status) => summary?.invoicesByStatus?.[status] ?? 0),
    1,
  );

  return (
    <section className="dashboard-page">
      <header className="dashboard-header dashboard-header--platform">
        <div>
          <p className="eyebrow">Platform overview</p>
          <h1>Platform</h1>
        </div>
      </header>

      <div className="dashboard-strip dashboard-strip--platform">
        <div className="dashboard-strip__item">
          <span className="dashboard-strip__label">
            Overdue across all users
          </span>
          <strong className="dashboard-strip__value dashboard-strip__value--hero dashboard-strip__value--brick">
            <Amount
              value={summary?.totalOverdue ?? 0}
              currency="NGN"
              compactWhole
            />
          </strong>
        </div>
        <div className="dashboard-strip__item">
          <span className="dashboard-strip__label">Users</span>
          <strong className="dashboard-strip__value">
            {summary?.userCount ?? 0}
          </strong>
        </div>
      </div>

      <section className="platform-bar">
        {statuses.map((status) => {
          const count = summary?.invoicesByStatus?.[status] ?? 0;
          const width = (count / maxTotal) * 100;
          return (
            <div
              key={status}
              className={`platform-bar__segment platform-bar__segment--${status.toLowerCase()}`}
              style={{ width: `${width}%` }}
            >
              <span>{status}</span>
              <strong>{count}</strong>
            </div>
          );
        })}
      </section>

      <section className="dashboard-overdue-list">
        <div className="dashboard-section-header">
          <h2>Top overdue users</h2>
        </div>
        {(summary?.topOverdueUsers ?? []).length === 0 ? (
          <p className="dashboard-empty-copy">No overdue users.</p>
        ) : (
          <div className="dashboard-list-table">
            {(summary?.topOverdueUsers ?? []).map((user) => (
              <div className="dashboard-list-row" key={user.userId}>
                <div>
                  <strong>{user.fullName}</strong>
                  <small>{user.businessName ?? "Business"}</small>
                </div>
                <Amount
                  value={user.overdueAmount}
                  currency={user.currency ?? "NGN"}
                />
              </div>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
