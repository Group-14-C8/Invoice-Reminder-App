import { useEffect, useState } from "react";
import type { InvoiceStatus } from "../../api/types";
import { Mark } from "../../components/ui/Mark";
import { StatusMark } from "../../components/ui/StatusMark";

const steps: Array<{ status: InvoiceStatus; afterMs: number }> = [
  { status: "Overdue", afterMs: 3200 },
  { status: "Paid", afterMs: 4800 },
];

const prefersReducedMotion = (): boolean =>
  typeof window === "undefined" ||
  (typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches);

export function StatusSlip() {
  const [status, setStatus] = useState<InvoiceStatus>(() =>
    prefersReducedMotion() ? "Paid" : "Unpaid",
  );

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const timers = steps.map(({ status: nextStatus, afterMs }) =>
      window.setTimeout(() => setStatus(nextStatus), afterMs),
    );
    return () => timers.forEach(window.clearTimeout);
  }, []);

  return (
    <aside className="auth-visual" aria-label="Invoice payment status">
      <div className="status-slip">
        <div className="status-slip__brand">
          <Mark size={20} />
          <span>TaskFlow</span>
        </div>
        <div className="status-slip__divider" />
        <div className="status-slip__status" key={status}>
          <StatusMark status={status} />
        </div>
      </div>
    </aside>
  );
}
