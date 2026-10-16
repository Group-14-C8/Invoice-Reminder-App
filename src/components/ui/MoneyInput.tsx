import { useEffect, useRef, useState, type InputHTMLAttributes } from "react";
import {
  type CurrencyDisplay,
  currencyFractionDigits,
  currencySymbol,
  formatMoneyDraft,
  formatMoneyInput,
  parseMoney,
} from "../../lib/money";
import { env } from "../../config/env";

export interface MoneyInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "value" | "onChange"
> {
  value: number | null;
  currency: string;
  locale?: string;
  currencyDisplay?: CurrencyDisplay;
  onValueChange: (value: number | null) => void;
}

export function MoneyInput({
  value,
  currency,
  locale = typeof navigator === "undefined" ? "en" : navigator.language,
  currencyDisplay = env.currencyMode === "single" ? "narrowSymbol" : "code",
  onValueChange,
  className = "",
  onBlur,
  onFocus,
  ...props
}: MoneyInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState(
    value === null ? "" : formatMoneyInput(value, currency, locale),
  );
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused)
      setDraft(value === null ? "" : formatMoneyInput(value, currency, locale));
  }, [currency, isFocused, locale, value]);

  const normalizeDraft = (): void => {
    const parsed = parseMoney(draft, currency, locale);
    if (parsed === null) {
      setDraft("");
      onValueChange(null);
      return;
    }

    const rounded = Number(parsed.toFixed(currencyFractionDigits(currency)));
    onValueChange(rounded);
    setDraft(formatMoneyInput(rounded, currency, locale));
  };

  return (
    <div className="ui-money-input">
      <span className="ui-money-input__prefix" aria-hidden="true">
        {currencySymbol(currency, locale, currencyDisplay)}
      </span>
      <input
        {...props}
        ref={inputRef}
        className={["ui-input", "ui-money-input__control", className]
          .filter(Boolean)
          .join(" ")}
        type="text"
        inputMode="decimal"
        value={draft}
        onFocus={(event) => {
          setIsFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setIsFocused(false);
          normalizeDraft();
          onBlur?.(event);
        }}
        onChange={(event) => {
          const next = event.currentTarget.value;
          if (next.includes("-")) return;
          const caret = event.currentTarget.selectionStart ?? next.length;
          const digitsBeforeCaret = next
            .slice(0, caret)
            .replace(/\D/g, "").length;
          const formatted = formatMoneyDraft(next, currency, locale);
          setDraft(formatted);
          onValueChange(parseMoney(formatted, currency, locale));
          requestAnimationFrame(() => {
            const input = inputRef.current;
            if (!input || document.activeElement !== input) return;
            let nextCaret = 0;
            let digitsSeen = 0;
            while (
              nextCaret < formatted.length &&
              digitsSeen < digitsBeforeCaret
            ) {
              if (/\d/.test(formatted[nextCaret] ?? "")) digitsSeen += 1;
              nextCaret += 1;
            }
            input.setSelectionRange(nextCaret, nextCaret);
          });
        }}
        aria-label={props["aria-label"]}
      />
    </div>
  );
}
