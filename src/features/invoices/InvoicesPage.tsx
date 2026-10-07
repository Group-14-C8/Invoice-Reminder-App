import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CaretDown, DotsThree } from "@phosphor-icons/react";
import { apiRequest } from "../../api/http";
import { endpoints } from "../../api/endpoints";
import type { Invoice, InvoiceStatus } from "../../api/types";
import { Amount } from "../../components/ui/Amount";
import { EmptyState } from "../../components/ui/EmptyState";
import { Menu } from "../../components/ui/Menu";
import { RelativeDue } from "../../components/ui/RelativeDue";
import { Skeleton } from "../../components/ui/Skeleton";
import { StatusMark } from "../../components/ui/StatusMark";
import { notify } from "../../components/ui/notify";

const statusOptions: Array<"All" | InvoiceStatus> = [
  "All",
  "Draft",
  "Sent",
  "Overdue",
  "Paid",
];

const sortLabels: Record<"dueDate" | "amount" | "issueDate", string> = {
  dueDate: "Due date",
  amount: "Amount",
  issueDate: "Issue date",
};

export function InvoicesPage() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<"All" | InvoiceStatus>("All");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"dueDate" | "amount" | "issueDate">(
    "dueDate",
  );

  const query = useQuery({
    queryKey: ["invoices"],
    queryFn: async () => apiRequest<Invoice[]>(endpoints.invoices.list),
  });

  const counts = useMemo(() => {
    const next = {
      All: query.data?.length ?? 0,
      Draft: 0,
      Sent: 0,
      Overdue: 0,
      Paid: 0,
    };
    for (const invoice of query.data ?? []) {
      next[invoice.status] += 1;
    }
    return next;
  }, [query.data]);

  const filters = useMemo(() => {
    const filtered = (query.data ?? []).filter((invoice) => {
      const matchesStatus = status === "All" || invoice.status === status;
      const matchesSearch =
        `${invoice.invoiceNumber} ${invoice.clientName ?? ""}`
          .toLowerCase()
          .includes(search.toLowerCase());
      return matchesStatus && matchesSearch;
    });

    filtered.sort((a, b) => {
      if (sort === "amount") return b.totalAmount - a.totalAmount;
      if (sort === "issueDate") return a.issueDate.localeCompare(b.issueDate);
      return a.dueDate.localeCompare(b.dueDate);
    });

    return filtered;
  }, [query.data, search, sort, status]);

  const markPaid = useMutation({
    mutationFn: async (id: string) =>
      apiRequest<Invoice>(endpoints.invoices.markPaid(id), { method: "POST" }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["invoices"] });
      notify.success("Marked as paid");
    },
  });

  const deleteInvoice = useMutation({
    mutationFn: async (id: string) =>
      apiRequest<void>(endpoints.invoices.remove(id), { method: "DELETE" }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["invoices"] });
      notify.success("Invoice deleted");
    },
  });

  const sendInvoice = useMutation({
    mutationFn: async (id: string) =>
      apiRequest<{ email?: string }>(endpoints.invoices.send(id), {
        method: "POST",
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["invoices"] });
      notify.success("Invoice sent");
    },
  });

  const sortMenu = (
    <Menu
      label="Sort invoices"
      trigger={
        <button className="toolbar__sort-button" type="button">
          <span>Sort: {sortLabels[sort]}</span>
          <CaretDown size={16} weight="regular" aria-hidden="true" />
        </button>
      }
      items={[
        { label: "Due date", onSelect: () => setSort("dueDate") },
        { label: "Amount", onSelect: () => setSort("amount") },
        { label: "Issue date", onSelect: () => setSort("issueDate") },
      ]}
    />
  );

  return (
    <section className="page-section">
      <header className="page-header">
        <h1>Invoices</h1>
        <Link className="ui-button ui-button--primary" to="/invoices/new">
          New invoice
        </Link>
      </header>

      <div className="toolbar">
        <div
          className="ui-segmented"
          role="tablist"
          aria-label="Invoice status filter"
        >
          {statusOptions.map((option) => (
            <button
              key={option}
              type="button"
              className={
                status === option
                  ? "ui-segmented__option ui-segmented__option--active"
                  : "ui-segmented__option"
              }
              aria-pressed={status === option}
              onClick={() => setStatus(option)}
            >
              <span>{option}</span>
              <span className="ui-segmented__count">{counts[option]}</span>
            </button>
          ))}
        </div>
        <div className="toolbar__search">
          <input
            aria-label="Search invoices"
            value={search}
            onChange={(event) => setSearch(event.currentTarget.value)}
            placeholder="Search invoices"
            className="ui-input"
          />
        </div>
        {sortMenu}
      </div>

      {query.isLoading ? (
        <div className="skeleton-stack" aria-label="Loading invoices">
          <Skeleton width="100%" height={52} />
          <Skeleton width="100%" height={52} />
          <Skeleton width="100%" height={52} />
        </div>
      ) : filters.length === 0 ? (
        <EmptyState
          title="No invoices yet."
          description="Create one and it will appear here."
        />
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Invoice</th>
              <th>Client</th>
              <th>Due</th>
              <th>Amount</th>
              <th>Status</th>
              <th className="data-table__actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filters.map((invoice) => (
              <tr key={invoice.id}>
                <td>
                  <Link to={`/invoices/${invoice.id}`}>
                    {invoice.invoiceNumber}
                  </Link>
                </td>
                <td>{invoice.clientName ?? "Client"}</td>
                <td>
                  <RelativeDue
                    dueDate={invoice.dueDate}
                    paidDate={invoice.paidDate ?? null}
                  />
                </td>
                <td className="data-table__amount">
                  <Amount
                    value={invoice.totalAmount}
                    currency={invoice.currency ?? "NGN"}
                  />
                </td>
                <td>
                  <StatusMark status={invoice.status} />
                </td>
                <td className="data-table__actions">
                  <Menu
                    label={`Edit ${invoice.invoiceNumber}`}
                    trigger={
                      <button
                        type="button"
                        className="ui-icon-button"
                        aria-label={`More actions for ${invoice.invoiceNumber}`}
                      >
                        <DotsThree
                          size={18}
                          weight="regular"
                          aria-hidden="true"
                        />
                      </button>
                    }
                    items={[
                      {
                        label: "View",
                        onSelect: () => {
                          window.location.assign(`/invoices/${invoice.id}`);
                        },
                      },
                      ...(invoice.status === "Draft"
                        ? [
                            {
                              label: "Edit",
                              onSelect: () => {
                                window.location.assign(
                                  `/invoices/${invoice.id}/edit`,
                                );
                              },
                            },
                            {
                              label: "Send",
                              onSelect: () => {
                                void sendInvoice.mutateAsync(invoice.id);
                              },
                            },
                            {
                              label: "Delete",
                              destructive: true,
                              onSelect: () => {
                                void deleteInvoice.mutateAsync(invoice.id);
                              },
                            },
                          ]
                        : []),
                      ...(invoice.status !== "Paid" &&
                      invoice.status !== "Draft"
                        ? [
                            {
                              label: "Mark as paid",
                              onSelect: () => {
                                void markPaid.mutateAsync(invoice.id);
                              },
                            },
                          ]
                        : []),
                    ]}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
