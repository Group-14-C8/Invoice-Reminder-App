import { useState } from "react";
import {
  CalendarBlank,
  Check,
  FileText,
  MagnifyingGlass,
  Plus,
  X,
} from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import type { InvoiceStatus } from "../../api/types";
import { env } from "../../config/env";
import { Amount } from "./Amount";
import { Button } from "./Button";
import { DateField } from "./DateField";
import { Dialog } from "./Dialog";
import { Drawer } from "./Drawer";
import { EmptyState } from "./EmptyState";
import { Field } from "./Field";
import { IconButton } from "./IconButton";
import { Input } from "./Input";
import { Mark } from "./Mark";
import { Menu } from "./Menu";
import { MoneyInput } from "./MoneyInput";
import { RelativeDue } from "./RelativeDue";
import { Segmented } from "./Segmented";
import { Select } from "./Select";
import { Skeleton } from "./Skeleton";
import { StatusMark } from "./StatusMark";
import { Textarea } from "./Textarea";
import { notify } from "./notify";
import { ToastViewport } from "./Toast";

const statuses: InvoiceStatus[] = ["Unpaid", "Overdue", "Paid"];

const isoDate = (offset: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  const localDate = new Date(
    date.getTime() - date.getTimezoneOffset() * 60_000,
  );
  return localDate.toISOString().slice(0, 10);
};

export function ComponentKitPage() {
  const { t } = useTranslation();
  const [filter, setFilter] = useState("All");
  const [amount, setAmount] = useState<number | null>(1250);
  const [dueDate, setDueDate] = useState(isoDate(14));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <main className="kit-page">
      <header className="kit-page__header">
        <div className="kit-page__brand">
          <Mark />
          <span>{t("brand")}</span>
        </div>
        <h1>{t("kit.title")}</h1>
        <p>{t("kit.description")}</p>
      </header>

      <section className="kit-section" aria-labelledby="kit-buttons">
        <h2 id="kit-buttons">{t("kit.buttons")}</h2>
        <div className="kit-row">
          <Button>{t("kit.save")}</Button>
          <Button variant="secondary">{t("kit.cancel")}</Button>
          <Button variant="quiet">{t("nav.preferences")}</Button>
          <Button variant="danger">{t("accessibility.dismiss")}</Button>
          <Button size="sm">{t("kit.confirm")}</Button>
          <Button loading>{t("kit.loading")}</Button>
          <Button disabled>{t("kit.cancel")}</Button>
          <IconButton label={t("kit.search")}>
            <MagnifyingGlass size={20} />
          </IconButton>
          <IconButton label={t("accessibility.close")} size="sm">
            <X size={18} />
          </IconButton>
        </div>
      </section>

      <section className="kit-section" aria-labelledby="kit-inputs">
        <h2 id="kit-inputs">{t("kit.inputs")}</h2>
        <div className="kit-grid">
          <Field
            id="kit-email"
            label={t("kit.fieldLabel")}
            hint={t("kit.fieldHint")}
          >
            <Input
              type="email"
              autoComplete="email"
              defaultValue="ana@bluepinelabs.com"
            />
          </Field>
          <Field
            id="kit-email-error"
            label={t("kit.fieldLabel")}
            error={t("kit.fieldError")}
          >
            <Input type="email" defaultValue="ana@" />
          </Field>
          <Field id="kit-search" label={t("kit.search")}>
            <Input type="search" placeholder={t("kit.search")} />
          </Field>
          <Field id="kit-disabled" label={t("kit.disabled")}>
            <Input disabled value={t("kit.disabledValue")} readOnly />
          </Field>
          <Field id="kit-notes" label={t("kit.notes")}>
            <Textarea rows={3} placeholder={t("kit.notes")} />
          </Field>
          <Field id="kit-select" label={t("kit.selectStatus")}>
            <Select
              defaultValue="Unpaid"
              options={statuses.map((status) => ({
                value: status,
                label: t(`status.${status.toLowerCase()}`),
              }))}
              placeholder={t("kit.selectStatus")}
            />
          </Field>
          <Field id="kit-select-disabled" label={t("kit.disabledSelect")}>
            <Select
              disabled
              value="Paid"
              options={[{ value: "Paid", label: t("status.paid") }]}
            />
          </Field>
        </div>
      </section>

      <section className="kit-section" aria-labelledby="kit-money">
        <h2 id="kit-money">{t("kit.money")}</h2>
        <div className="kit-grid kit-grid--money">
          <Field id="kit-date" label={t("kit.dueDate")}>
            <DateField
              value={dueDate}
              issueDate={isoDate(0)}
              onChange={setDueDate}
            />
          </Field>
          <Field
            id="kit-money-input"
            label={t("preferences.defaultCurrency")}
            hint={env.defaultCurrency}
          >
            <MoneyInput
              value={amount}
              currency={env.defaultCurrency}
              onValueChange={setAmount}
            />
          </Field>
          <div className="kit-example">
            <span className="kit-example__label">{t("kit.amountExample")}</span>
            <Amount
              value={amount ?? 0}
              currency={env.defaultCurrency}
              compactWhole
            />
          </div>
          <div className="kit-example">
            <span className="kit-example__label">{t("kit.relativeDue")}</span>
            <RelativeDue dueDate={isoDate(0)} />
          </div>
          <div className="kit-example">
            <span className="kit-example__label">{t("kit.relativeDue")}</span>
            <RelativeDue dueDate={isoDate(-11)} />
          </div>
          <div className="kit-example">
            <span className="kit-example__label">{t("kit.relativeDue")}</span>
            <RelativeDue dueDate={isoDate(-7)} paidDate={isoDate(-3)} />
          </div>
        </div>
      </section>

      <section className="kit-section" aria-labelledby="kit-status">
        <h2 id="kit-status">{t("kit.statuses")}</h2>
        <div className="kit-row kit-row--status">
          {statuses.map((status) => (
            <StatusMark status={status} key={status} />
          ))}
        </div>
      </section>

      <section className="kit-section" aria-labelledby="kit-filters">
        <h2 id="kit-filters">{t("kit.filters")}</h2>
        <Segmented
          label={t("kit.filters")}
          value={filter}
          onValueChange={setFilter}
          options={[
            { value: "All", label: t("kit.all"), count: 8 },
            { value: "Unpaid", label: t("status.unpaid"), count: 5 },
            { value: "Overdue", label: t("status.overdue"), count: 1 },
            { value: "Paid", label: t("status.paid"), count: 2 },
          ]}
        />
      </section>

      <section className="kit-section" aria-labelledby="kit-overlays">
        <h2 id="kit-overlays">{t("kit.overlays")}</h2>
        <div className="kit-row">
          <Menu
            label={t("accessibility.openMenu")}
            items={[
              {
                label: t("kit.view"),
                onSelect: () => notify.message(t("kit.view")),
                icon: <FileIcon />,
              },
              {
                label: t("kit.disabled"),
                onSelect: () => undefined,
                disabled: true,
              },
              {
                label: t("kit.delete"),
                onSelect: () => notify.error(t("kit.delete")),
                destructive: true,
              },
            ]}
          />
          <Dialog
            title={t("kit.dialogTitle")}
            description={t("kit.dialogDescription")}
            trigger={<Button variant="secondary">{t("kit.openDialog")}</Button>}
            footer={
              <Button onClick={() => setDialogOpen(false)}>
                {t("kit.confirm")}
              </Button>
            }
            open={dialogOpen}
            onOpenChange={setDialogOpen}
          >
            <p className="kit-dialog-copy">{t("kit.dialogBody")}</p>
          </Dialog>
          <Button variant="secondary" onClick={() => setDrawerOpen(true)}>
            {t("kit.openDrawer")}
          </Button>
          <Drawer
            title={t("kit.drawerTitle")}
            description={t("kit.drawerDescription")}
            open={drawerOpen}
            onOpenChange={setDrawerOpen}
            footer={
              <Button variant="secondary" onClick={() => setDrawerOpen(false)}>
                {t("kit.cancel")}
              </Button>
            }
          >
            <Field id="kit-drawer-client" label={t("kit.fieldLabel")}>
              <Input defaultValue="ana@bluepinelabs.com" />
            </Field>
          </Drawer>
        </div>
      </section>

      <section className="kit-section" aria-labelledby="kit-feedback">
        <h2 id="kit-feedback">{t("kit.feedback")}</h2>
        <div className="kit-row">
          <Button
            variant="secondary"
            onClick={() => notify.success(t("kit.toastSuccess"))}
          >
            {t("kit.toastSuccess")}
          </Button>
          <Button
            variant="secondary"
            onClick={() => notify.error(t("kit.toastError"))}
          >
            {t("kit.toastError")}
          </Button>
          <Skeleton width={160} height={20} />
          <Skeleton width={72} height={32} className="ui-skeleton--pill" />
        </div>
        <EmptyState
          title={t("kit.emptyTitle")}
          description={t("kit.emptyDescription")}
          icon={<CalendarBlank size={24} />}
          action={
            <Button icon={<Plus size={18} />}>{t("nav.newInvoice")}</Button>
          }
        />
      </section>

      <section
        className="kit-section kit-section--last"
        aria-labelledby="kit-layout"
      >
        <h2 id="kit-layout">{t("kit.layout")}</h2>
        <div className="kit-row kit-row--mark">
          <Mark size={24} />
          <Mark size={32} />
          <span className="kit-mark-word">{t("brand")}</span>
          <span className="sr-only">
            <Check />
            {t("kit.confirm")}
            <X />
            {t("accessibility.close")}
          </span>
        </div>
      </section>
      <ToastViewport />
    </main>
  );
}

function FileIcon() {
  return <FileText size={16} aria-hidden="true" />;
}
