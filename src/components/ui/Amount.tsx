import { formatMoney, type CurrencyDisplay } from "../../lib/money";

export interface AmountProps {
  value: number;
  currency: string;
  locale?: string;
  compactWhole?: boolean;
  currencyDisplay?: CurrencyDisplay;
  className?: string;
}

export function Amount({
  value,
  currency,
  locale = "en",
  compactWhole = false,
  currencyDisplay = "narrowSymbol",
  className = "",
}: AmountProps) {
  return (
    <span className={["ui-amount", className].filter(Boolean).join(" ")}>
      {formatMoney(value, currency, locale, { compactWhole, currencyDisplay })}
    </span>
  );
}
