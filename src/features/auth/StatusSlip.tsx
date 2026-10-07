import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { InvoiceStatus } from "../../api/types";
import { Amount } from "../../components/ui/Amount";
import { Mark } from "../../components/ui/Mark";
import { StatusMark } from "../../components/ui/StatusMark";

const steps: Array<{ status: InvoiceStatus; afterMs: number }> = [
  { status: "Sent", afterMs: 1600 },
  { status: "Overdue", afterMs: 3200 },
  { status: "Paid", afterMs: 4800 },
];

const prefersReducedMotion = (): boolean =>
  typeof window === "undefined" ||
  (typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches);

export function StatusSlip() {
  const { t } = useTranslation();
  const [status, setStatus] = useState<InvoiceStatus>(() =>
    prefersReducedMotion() ? "Paid" : "Draft",
  );

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const timers = steps.map(({ status: nextStatus, afterMs }) =>
      window.setTimeout(() => setStatus(nextStatus), afterMs),
    );
    return () => timers.forEach(window.clearTimeout);
  }, []);

  return (
    <aside className="auth-visual" aria-label={t("auth.statusSlipAmount")}>
      <div className="status-slip">
        <div className="status-slip__brand">
          <Mark size={20} />
          <span>{t("brand")}</span>
        </div>
        <div className="status-slip__number">{t("auth.statusSlipNumber")}</div>
        <div className="status-slip__divider" />
        <div className="status-slip__party">
          <span>{t("auth.statusSlipBilledTo")}</span>
          <strong>{t("auth.statusSlipBusiness")}</strong>
        </div>
        <div className="status-slip__amount-label">
          {t("auth.statusSlipAmount")}
        </div>
        <Amount value={2400} currency="NGN" className="status-slip__amount" />
        <div className="status-slip__status" key={status}>
          <StatusMark status={status} />
        </div>
      </div>
    </aside>
  );
}
