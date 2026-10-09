import { useEffect, useMemo } from "react";
import { useBlocker, useBeforeUnload } from "react-router-dom";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../../api/http";
import { normalizeClients, normalizeInvoice } from "../../api/adapters";
import { endpoints } from "../../api/endpoints";
import type { Invoice, InvoiceRequestDto } from "../../api/types";
import { Button } from "../../components/ui/Button";
import { DateField } from "../../components/ui/DateField";
import { Field } from "../../components/ui/Field";
import { Input } from "../../components/ui/Input";
import { Mark } from "../../components/ui/Mark";
import { MoneyInput } from "../../components/ui/MoneyInput";
import { Select } from "../../components/ui/Select";
import { notify } from "../../components/ui/notify";
import { invoiceSchema, type InvoiceFormValues } from "./schemas";
import { invoiceTotal } from "../../lib/invoice";
import { formatMoney } from "../../lib/money";

interface InvoiceEditorProps {
  onSaved?: (invoice: Invoice) => void;
  onCancel?: () => void;
}

export function InvoiceEditor({ onSaved, onCancel }: InvoiceEditorProps) {
  const queryClient = useQueryClient();
  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: async () =>
      normalizeClients(await apiRequest<unknown>(endpoints.clients.list)),
  });

  const defaultValues = useMemo<InvoiceFormValues>(() => {
    const issue = new Date().toISOString().slice(0, 10);
    const due = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
    return {
      clientId: clients[0]?.id ?? "",
      issueDate: issue,
      dueDate: due,
      currency: "NGN",
      items: [{ description: "", quantity: 1, unitPrice: 0 }],
    };
  }, [clients]);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
    reset,
  } = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues,
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const values = watch();
  const blocker = useBlocker(() => isDirty);

  useBeforeUnload(
    (event) => {
      if (!isDirty) return;
      event.preventDefault();
      event.returnValue = "";
    },
    { capture: true },
  );

  useEffect(() => {
    if (blocker.state === "blocked") {
      const confirmed = window.confirm(
        "You have unsaved changes. Leave anyway?",
      );
      if (confirmed) blocker.proceed();
      else blocker.reset();
    }
  }, [blocker]);

  useEffect(() => reset(defaultValues), [defaultValues, reset]);

  const total = useMemo(
    () => invoiceTotal(values.items ?? [], values.currency),
    [values.currency, values.items],
  );
  const selectedClient = clients.find(
    (client) => client.id === values.clientId,
  );
  const currency = values.currency || "NGN";
  const formatCurrency = (amount: number): string =>
    formatMoney(amount, currency, "en-NG", { compactWhole: true });

  const onSubmit = handleSubmit(async (payload) => {
    try {
      const request: InvoiceRequestDto = {
        clientId: Number(payload.clientId),
        issueDate: `${payload.issueDate}T00:00:00`,
        dueDate: `${payload.dueDate}T00:00:00`,
        currency: payload.currency.toUpperCase(),
        items: payload.items.map(({ description, quantity, unitPrice }) => ({
          description,
          quantity,
          unitPrice,
        })),
      };
      const invoice = normalizeInvoice(
        await apiRequest<unknown>(endpoints.invoices.create, {
          method: "POST",
          body: JSON.stringify(request),
        }),
      );
      await queryClient.invalidateQueries({ queryKey: ["invoices"] });
      notify.success("Invoice created");
      onSaved?.(invoice);
    } catch (error) {
      notify.error(
        error instanceof Error ? error.message : "Unable to save invoice",
      );
    }
  });

  return (
    <section className="invoice-editor">
      <div className="invoice-editor__form">
        <div className="invoice-editor__header">
          <h1>New invoice</h1>
          {onCancel && (
            <Button variant="secondary" onClick={onCancel}>
              Back
            </Button>
          )}
        </div>

        <div className="form-grid">
          <Field
            id="invoice-client"
            label="Client"
            error={errors.clientId?.message}
          >
            <Select
              id="invoice-client"
              value={values.clientId}
              onValueChange={(value) =>
                setValue("clientId", value, { shouldValidate: true })
              }
              options={clients.map((client) => ({
                value: client.id,
                label: client.name,
              }))}
            />
          </Field>
          <Field
            id="invoice-issue-date"
            label="Issued"
            error={errors.issueDate?.message}
          >
            <DateField
              id="invoice-issue-date"
              value={values.issueDate ?? ""}
              onChange={(value) => setValue("issueDate", value)}
            />
          </Field>
          <Field
            id="invoice-due-date"
            label="Due"
            error={errors.dueDate?.message}
          >
            <DateField
              id="invoice-due-date"
              value={values.dueDate ?? ""}
              onChange={(value) => setValue("dueDate", value)}
              presets={[7, 14, 30]}
              issueDate={values.issueDate}
            />
          </Field>
        </div>

        <div className="invoice-items">
          <div className="invoice-items__header">
            <h2>Items</h2>
            <Button
              variant="secondary"
              onClick={() =>
                append({ description: "", quantity: 1, unitPrice: 0 })
              }
            >
              Add item
            </Button>
          </div>
          <div className="invoice-items__columns" aria-hidden="true">
            <span>Description</span>
            <span>Qty</span>
            <span>Unit price</span>
            <span>Line total</span>
            <span />
          </div>
          {fields.map((field, index) => {
            const itemErrors = errors.items?.[index];
            return (
              <div className="invoice-item-row" key={field.id ?? index}>
                <div className="invoice-item-row__field invoice-item-row__field--description">
                  <span className="invoice-item-row__mobile-label">
                    Description
                  </span>
                  <Input
                    {...register(`items.${index}.description` as const)}
                    placeholder="Describe the work"
                    aria-label={`Item description ${index + 1}`}
                    aria-invalid={Boolean(itemErrors?.description)}
                  />
                  {itemErrors?.description?.message && (
                    <p className="invoice-item-row__error" role="alert">
                      {itemErrors.description.message}
                    </p>
                  )}
                </div>
                <div className="invoice-item-row__field invoice-item-row__field--quantity">
                  <span className="invoice-item-row__mobile-label">Qty</span>
                  <Input
                    type="number"
                    min={1}
                    step="1"
                    {...register(`items.${index}.quantity`, {
                      valueAsNumber: true,
                    })}
                    aria-label={`Item quantity ${index + 1}`}
                    aria-invalid={Boolean(itemErrors?.quantity)}
                  />
                  {itemErrors?.quantity?.message && (
                    <p className="invoice-item-row__error" role="alert">
                      {itemErrors.quantity.message}
                    </p>
                  )}
                </div>
                <div className="invoice-item-row__field invoice-item-row__field--price">
                  <span className="invoice-item-row__mobile-label">
                    Unit price
                  </span>
                  <MoneyInput
                    value={values.items?.[index]?.unitPrice ?? 0}
                    currency={currency}
                    onValueChange={(next) =>
                      setValue(`items.${index}.unitPrice`, Number(next ?? 0), {
                        shouldValidate: true,
                      })
                    }
                    aria-label={`Item price ${index + 1}`}
                    aria-invalid={Boolean(itemErrors?.unitPrice)}
                  />
                  {itemErrors?.unitPrice?.message && (
                    <p className="invoice-item-row__error" role="alert">
                      {itemErrors.unitPrice.message}
                    </p>
                  )}
                </div>
                <div className="invoice-item-row__field invoice-item-row__field--total">
                  <span className="invoice-item-row__mobile-label">
                    Line total
                  </span>
                  <strong className="invoice-item-row__total">
                    {formatCurrency(
                      (values.items?.[index]?.quantity ?? 0) *
                        (values.items?.[index]?.unitPrice ?? 0),
                    )}
                  </strong>
                </div>
                <div className="invoice-item-row__remove">
                  <Button
                    variant="quiet"
                    onClick={() => remove(index)}
                    disabled={fields.length === 1}
                    aria-label={`Remove item ${index + 1}`}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="invoice-editor__footer">
          <div className="invoice-total-box">
            <span>Total</span>
            <strong>{formatCurrency(total)}</strong>
          </div>
          <div className="invoice-actions">
            {onCancel && (
              <Button variant="secondary" type="button" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="button" onClick={() => void onSubmit()}>
              Save invoice
            </Button>
          </div>
        </div>
      </div>
      <aside className="invoice-paper-preview" aria-label="Invoice preview">
        <div className="invoice-paper-preview__header">
          <div className="invoice-paper-preview__brand">
            <Mark size={20} />
            <span>TaskFlow</span>
          </div>
          <span className="invoice-paper-preview__eyebrow">Preview</span>
        </div>
        <div className="invoice-paper-preview__number">
          <span>Invoice</span>
          <strong>Assigned on save</strong>
        </div>
        <div className="invoice-paper-preview__meta">
          <div>
            <span>Issued</span>
            <strong>{values.issueDate || "Not set"}</strong>
          </div>
          <div>
            <span>Due</span>
            <strong>{values.dueDate || "Not set"}</strong>
          </div>
        </div>
        <div className="invoice-paper-preview__client">
          <span>Billed to</span>
          <strong>{selectedClient?.name ?? "Choose a client"}</strong>
          {selectedClient?.email && <small>{selectedClient.email}</small>}
        </div>
        <div className="invoice-paper-preview__items">
          <div className="invoice-paper-preview__items-header">
            <span>Item</span>
            <span>Amount</span>
          </div>
          {(values.items ?? []).map((item, index) => (
            <div className="invoice-paper-preview__item" key={index}>
              <span>{item.description || "New item"}</span>
              <small>
                {item.quantity || 0} × {formatCurrency(item.unitPrice || 0)}
              </small>
              <strong>
                {formatCurrency((item.quantity || 0) * (item.unitPrice || 0))}
              </strong>
            </div>
          ))}
        </div>
        <div className="invoice-paper-preview__total">
          <span>Total</span>
          <strong>{formatCurrency(total)}</strong>
        </div>
      </aside>
    </section>
  );
}
