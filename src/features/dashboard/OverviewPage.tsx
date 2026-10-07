import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { apiRequest } from "../../api/http";
import { endpoints } from "../../api/endpoints";
import type { Invoice, UserSummary } from "../../api/types";
import { Amount } from "../../components/ui/Amount";
import { RelativeDue } from "../../components/ui/RelativeDue";
import { Segmented } from "../../components/ui/Segmented";

const toCalendarDay = (value: string): number => {
  const [year, month, day] = value.split("-").map(Number);
  return Date.UTC(year ?? 1970, (month ?? 1) - 1, day ?? 1) / 86_400_000;
};

const startOfToday = (): number => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return (
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86_400_000
  );
};

const tickValues = [-30, -14, -7, 0, 7, 14, 30];

export function OverviewPage() {
  const [currency, setCurrency] = useState("NGN");
  const { data: summary } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => apiRequest<UserSummary>(endpoints.dashboard),
  });
  const { data: invoices = [] } = useQuery({
    queryKey: ["invoices"],
    queryFn: async () => apiRequest<Invoice[]>(endpoints.invoices.list),
  });

  const currencies = useMemo(() => {
    const values = new Set<string>();
    for (const entry of summary?.byCurrency ?? []) {
      values.add(entry.currency);
    }
    for (const invoice of invoices) {
      if (invoice.currency) values.add(invoice.currency);
    }
    return [...values].sort((left, right) => left.localeCompare(right));
  }, [invoices, summary?.byCurrency]);

  const activeCurrency = currencies.includes(currency)
    ? currency
    : (summary?.currency ?? currencies[0] ?? "NGN");

  const ledger = useMemo(() => {
    const bucket = summary?.byCurrency?.find(
      (entry) => entry.currency === activeCurrency,
    );
    if (bucket) {
      return {
        totalUnpaid: bucket.totalUnpaid,
        totalOverdue: bucket.totalOverdue,
        totalPaid: bucket.totalPaid,
      };
    }

    return {
      totalUnpaid: summary?.totalUnpaid ?? 0,
      totalOverdue: summary?.totalOverdue ?? 0,
      totalPaid: summary?.totalPaid ?? 0,
    };
  }, [activeCurrency, summary]);

  const horizonInvoices = useMemo(() => {
    return invoices
      .filter((invoice) => invoice.currency === activeCurrency)
      .filter(
        (invoice) => invoice.status !== "Draft" && invoice.status !== "Paid",
      )
      .map((invoice) => ({
        ...invoice,
        days: Math.round(toCalendarDay(invoice.dueDate) - startOfToday()),
      }))
      .sort((left, right) => left.days - right.days);
  }, [activeCurrency, invoices]);

  const overdue = useMemo(
    () =>
      [...horizonInvoices]
        .filter((invoice) => invoice.status === "Overdue")
        .sort(
          (left, right) =>
            toCalendarDay(left.dueDate) - toCalendarDay(right.dueDate),
        )
        .slice(0, 5),
    [horizonInvoices],
  );

  const overtimeSummary = `${overdue.length} invoices overdue, ${horizonInvoices.filter((invoice) => invoice.days > 0 && invoice.days <= 30).length} due in the next 30 days`;

  return (
    <section className="dashboard-page">
      <header className="dashboard-header">
        <h1>Overview</h1>
        <Link className="ui-button ui-button--primary" to="/invoices/new">
          New invoice
        </Link>
      </header>

      {currencies.length > 1 && (
        <Segmented
          label="Select dashboard currency"
          value={activeCurrency}
          options={currencies.map((code) => ({ value: code, label: code }))}
          onValueChange={setCurrency}
        />
      )}

      <div className="dashboard-strip" role="status" aria-live="polite">
        <div className="dashboard-strip__item">
          <span className="dashboard-strip__label">Owed to you</span>
          <strong className="dashboard-strip__value dashboard-strip__value--hero">
            <Amount
              value={ledger.totalUnpaid}
              currency={activeCurrency}
              compactWhole
            />
          </strong>
        </div>
        <div className="dashboard-strip__item">
          <span className="dashboard-strip__label">Overdue</span>
          <strong className="dashboard-strip__value dashboard-strip__value--brick">
            <Amount
              value={ledger.totalOverdue}
              currency={activeCurrency}
              compactWhole
            />
          </strong>
        </div>
        <div className="dashboard-strip__item">
          <span className="dashboard-strip__label">Paid</span>
          <strong className="dashboard-strip__value dashboard-strip__value--fern">
            <Amount
              value={ledger.totalPaid}
              currency={activeCurrency}
              compactWhole
            />
          </strong>
        </div>
      </div>

      <section className="dashboard-horizon" aria-label={overtimeSummary}>
        <div className="dashboard-horizon__topline">
          <span>Overdue</span>
          <span>Coming up</span>
        </div>
        <div className="dashboard-horizon__track">
          <div className="dashboard-horizon__today" aria-hidden="true">
            Today
          </div>
          <div className="dashboard-horizon__today-line" aria-hidden="true" />
          {horizonInvoices.length === 0 ? (
            <p className="dashboard-empty-copy">
              Nothing due in the next 30 days.
            </p>
          ) : (
            horizonInvoices.map((invoice) => {
              const safeDays = Math.max(-30, Math.min(30, invoice.days));
              const left = ((safeDays + 30) / 60) * 100;
              const height = Math.max(
                16,
                Math.min(150, Math.sqrt(invoice.totalAmount / 10_000) * 16),
              );
              const tone =
                invoice.status === "Overdue"
                  ? "brick"
                  : invoice.days <= 3
                    ? "amber"
                    : "ink";
              const colors: Record<string, string> = {
                brick: "var(--color-brick)",
                amber: "var(--color-amber)",
                ink: "var(--color-ink)",
              };

              return (
                <Link
                  key={invoice.id}
                  to={`/invoices/${invoice.id}`}
                  className="dashboard-horizon__mark"
                  style={{
                    left: `${left}%`,
                    height: `${height}px`,
                    ["--mark-color" as string]: colors[tone],
                  }}
                  title={`${invoice.clientName ?? "Client"} · ${invoice.invoiceNumber}`}
                  aria-label={`${invoice.clientName ?? "Client"}, ${invoice.invoiceNumber}, ${invoice.status}`}
                />
              );
            })
          )}
          <div className="dashboard-horizon__axis" aria-hidden="true">
            {tickValues.map((tick) => {
              const position = ((tick + 30) / 60) * 100;
              const label = tick === 0 ? "Today" : `${Math.abs(tick)} days`;

              return (
                <span
                  key={tick}
                  className="dashboard-horizon__tick"
                  style={{ left: `${position}%` }}
                >
                  {label}
                </span>
              );
            })}
          </div>
        </div>
        <div className="dashboard-horizon__legend" aria-label="Legend">
          <span className="dashboard-horizon__legend-item">
            <span className="dashboard-horizon__dot dashboard-horizon__dot--brick" />
            Overdue
          </span>
          <span className="dashboard-horizon__legend-item">
            <span className="dashboard-horizon__dot dashboard-horizon__dot--amber" />
            Due soon
          </span>
          <span className="dashboard-horizon__legend-item">
            <span className="dashboard-horizon__dot dashboard-horizon__dot--ink" />
            Upcoming
          </span>
        </div>
      </section>

      <section className="dashboard-overdue-list">
        <div className="dashboard-section-header">
          <h2>Overdue</h2>
          <Link to="/invoices?status=Overdue">View all overdue</Link>
        </div>
        {overdue.length === 0 ? (
          <p className="dashboard-empty-copy">No overdue invoices.</p>
        ) : (
          <div>
            {overdue.map((invoice) => (
              <div className="dashboard-list-row" key={invoice.id}>
                <div>
                  <strong>{invoice.clientName ?? "Client"}</strong>
                  <small>{invoice.invoiceNumber}</small>
                </div>
                <RelativeDue
                  dueDate={invoice.dueDate}
                  paidDate={invoice.paidDate ?? null}
                />
                <Amount
                  value={invoice.totalAmount}
                  currency={invoice.currency ?? activeCurrency}
                />
              </div>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
