import { useRef } from "react";
import { useTranslation } from "react-i18next";
import type { InvoiceStatus } from "../../api/types";

export interface StatusMarkProps {
  status: InvoiceStatus;
  className?: string;
  animated?: boolean;
}

const statusKeys: Record<InvoiceStatus, string> = {
  Draft: "status.draft",
  Sent: "status.sent",
  Overdue: "status.overdue",
  Paid: "status.paid",
};

export function StatusMark({
  status,
  className = "",
  animated = true,
}: StatusMarkProps) {
  const { t } = useTranslation();
  const label = t(statusKeys[status]);
  const previousStatus = useRef(status);
  const paidTransition =
    animated && previousStatus.current === "Sent" && status === "Paid";
  previousStatus.current = status;

  return (
    <span
      className={[
        "status-mark",
        `status-mark--${status.toLowerCase()}`,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <svg
        className={
          animated
            ? "status-mark__shape"
            : "status-mark__shape status-mark__shape--still"
        }
        aria-hidden="true"
        width="16"
        height="16"
        viewBox="0 0 16 16"
      >
        <circle className="status-mark__outline" cx="8" cy="8" r="6.5" />
        {status === "Sent" && (
          <path
            className="status-mark__fill"
            d="M8 1.5a6.5 6.5 0 0 0 0 13V1.5Z"
          />
        )}
        {status === "Overdue" && (
          <>
            <circle
              className={
                paidTransition
                  ? "status-mark__fill status-mark__fill--transition"
                  : "status-mark__fill"
              }
              cx="8"
              cy="8"
              r="6.5"
            />
            <circle className="status-mark__notch" cx="13.2" cy="2.8" r="2" />
          </>
        )}
        {status === "Paid" && (
          <>
            <circle className="status-mark__fill" cx="8" cy="8" r="6.5" />
            <path className="status-mark__check" d="m4.8 8.1 2.1 2.1 4.4-4.5" />
          </>
        )}
      </svg>
      <span>{label}</span>
    </span>
  );
}
