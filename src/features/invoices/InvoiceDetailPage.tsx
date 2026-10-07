import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { apiRequest } from "../../api/http";
import { endpoints } from "../../api/endpoints";
import type { Invoice } from "../../api/types";
import { Button } from "../../components/ui/Button";
import { Mark } from "../../components/ui/Mark";
import { RelativeDue } from "../../components/ui/RelativeDue";
import { Skeleton } from "../../components/ui/Skeleton";
import { StatusMark } from "../../components/ui/StatusMark";
import { notify } from "../../components/ui/notify";
import { effectiveStatus, invoiceTotal, nextReminder } from "../../lib/invoice";
import { formatMoney } from "../../lib/money";

export function InvoiceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    data: invoice,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["invoice", id],
    queryFn: async () =>
      apiRequest<Invoice>(endpoints.invoices.detail(id ?? "")),
    enabled: Boolean(id),
  });

  const reminder = useMemo(
    () => (invoice ? nextReminder(invoice) : null),
    [invoice],
  );

  const markPaid = useMutation({
    mutationFn: async () =>
      apiRequest<Invoice>(endpoints.invoices.markPaid(id ?? ""), {
        method: "POST",
      }),
    onSuccess: async (updated) => {
      await queryClient.invalidateQueries({ queryKey: ["invoice", id] });
      await queryClient.invalidateQueries({ queryKey: ["invoices"] });
      notify.success(
        updated.status === "Paid" ? "Marked as paid" : "Invoice updated",
      );
    },
  });

  const deleteInvoice = useMutation({
    mutationFn: async () =>
      apiRequest<void>(endpoints.invoices.remove(id ?? ""), {
        method: "DELETE",
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["invoices"] });
      navigate("/invoices");
    },
  });

  if (isLoading) {
    return (
      <section className="page-section">
        <Skeleton width="100%" height={240} />
      </section>
    );
  }

  if (isError || !invoice) {
    return (
      <section className="page-section">
        <div className="form-error-inline" role="alert">
          <p>We couldn’t load this invoice.</p>
          <Button onClick={() => void refetch()}>Retry</Button>
        </div>
      </section>
    );
  }

  const computedStatus = effectiveStatus(invoice);

  const currency = invoice.currency ?? "NGN";
  const amountText = (amount: number): string =>
    formatMoney(amount, currency, "en-NG", { compactWhole: true });
  const invoiceDate = (value: string): string =>
    new Intl.DateTimeFormat("en-NG", { dateStyle: "medium" }).format(
      new Date(`${value}T00:00:00`),
    );

  return (
    <section className="invoice-detail">
      <header className="invoice-detail__header">
        <Link className="invoice-detail__back" to="/invoices">
          Back to invoices
        </Link>
        <StatusMark status={computedStatus} />
      </header>
      <div className="invoice-detail__layout">
        <article className="invoice-detail__paper">
          <div className="invoice-detail__brand">
            <div className="invoice-detail__brand-mark">
              <Mark size={22} />
              <span>TaskFlow</span>
            </div>
            <span className="invoice-detail__document-label">Invoice</span>
          </div>
          <div className="invoice-detail__title-row">
            <div>
              <span className="invoice-detail__label">Invoice number</span>
              <h1>{invoice.invoiceNumber}</h1>
            </div>
            <strong className="invoice-detail__headline-total">
              {amountText(invoiceTotal(invoice.items, currency))}
            </strong>
          </div>
          <div className="invoice-detail__meta">
            <div>
              <span className="invoice-detail__label">Billed to</span>
              <strong>{invoice.clientName ?? "Client"}</strong>
            </div>
            <div>
              <span className="invoice-detail__label">Issued</span>
              <time dateTime={invoice.issueDate}>
                {invoiceDate(invoice.issueDate)}
              </time>
            </div>
            <div>
              <span className="invoice-detail__label">Due</span>
              <time dateTime={invoice.dueDate}>
                {invoiceDate(invoice.dueDate)}
              </time>
            </div>
          </div>
          <table className="invoice-detail__items">
            <thead>
              <tr>
                <th>Description</th>
                <th>Qty</th>
                <th>Unit price</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, index) => (
                <tr key={item.id ?? `${item.description}-${index}`}>
                  <td>{item.description}</td>
                  <td>{item.quantity}</td>
                  <td>{amountText(item.unitPrice)}</td>
                  <td>{amountText(item.quantity * item.unitPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {invoice.notes && (
            <div className="invoice-detail__notes">
              <span className="invoice-detail__label">Notes</span>
              <p>{invoice.notes}</p>
            </div>
          )}
          <div className="invoice-detail__total">
            <span>Total</span>
            <strong>{amountText(invoiceTotal(invoice.items, currency))}</strong>
          </div>
        </article>

        <aside className="invoice-detail__sidebar">
          <section className="invoice-detail__status-block">
            <h2>Payment status</h2>
            <StatusMark status={computedStatus} />
            <RelativeDue
              dueDate={invoice.dueDate}
              paidDate={invoice.paidDate ?? null}
            />
          </section>
          <section className="invoice-detail__reminder">
            <span className="invoice-detail__label">Reminder</span>
            <p>{reminder ? reminder.label : "No next reminder"}</p>
          </section>
          {markPaid.isError && (
            <p className="form-error-inline" role="alert">
              We couldn’t update this invoice. Try again.
            </p>
          )}
          {deleteInvoice.isError && (
            <p className="form-error-inline" role="alert">
              We couldn’t delete this invoice. Try again.
            </p>
          )}
          <div className="invoice-detail__actions">
            {invoice.status === "Draft" && (
              <Button onClick={() => navigate(`/invoices/${invoice.id}/edit`)}>
                Edit invoice
              </Button>
            )}
            {invoice.status !== "Paid" && (
              <Button
                variant="secondary"
                loading={markPaid.isPending}
                onClick={() => void markPaid.mutateAsync()}
              >
                Mark as paid
              </Button>
            )}
            {invoice.status === "Draft" && (
              <Button
                variant="danger"
                loading={deleteInvoice.isPending}
                onClick={() => void deleteInvoice.mutateAsync()}
              >
                Delete invoice
              </Button>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}
