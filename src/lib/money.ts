export type CurrencyDisplay = "symbol" | "narrowSymbol" | "code";

export const currencyFractionDigits = (currency: string): number => {
  try {
    return (
      new Intl.NumberFormat(undefined, {
        style: "currency",
        currency,
      }).resolvedOptions().maximumFractionDigits ?? 2
    );
  } catch {
    return 2;
  }
};

export const formatMoney = (
  amount: number,
  currency: string,
  locale = "en",
  options: { compactWhole?: boolean; currencyDisplay?: CurrencyDisplay } = {},
): string => {
  const fractionDigits = currencyFractionDigits(currency);
  const compactWhole = options.compactWhole && Number.isInteger(amount);

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    currencyDisplay: options.currencyDisplay ?? "narrowSymbol",
    minimumFractionDigits: compactWhole ? 0 : fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(amount);
};

const localeSeparators = (
  locale: string,
): { decimal: string; group: string } => {
  const parts = new Intl.NumberFormat(locale).formatToParts(12345.6);
  return {
    decimal: parts.find((part) => part.type === "decimal")?.value ?? ".",
    group: parts.find((part) => part.type === "group")?.value ?? ",",
  };
};

export const formatMoneyInput = (
  amount: number,
  currency: string,
  locale = "en",
): string =>
  new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: currencyFractionDigits(currency),
  }).format(amount);

export const formatMoneyDraft = (
  input: string,
  currency: string,
  locale = "en",
): string => {
  const maxFractionDigits = currencyFractionDigits(currency);
  const separators = [...input.matchAll(/[.,]/g)];
  const last = separators.at(-1);
  const localeDecimal = localeSeparators(locale).decimal;
  const hasBothSeparators =
    separators.some((match) => match[0] === ".") &&
    separators.some((match) => match[0] === ",");
  const trailingDigits = last
    ? input.slice((last.index ?? -1) + 1).replace(/\D/g, "").length
    : 0;
  const isFraction = Boolean(
    maxFractionDigits > 0 &&
    last &&
    (hasBothSeparators || last[0] === localeDecimal),
  );
  const decimalIndex = isFraction ? (last?.index ?? -1) : -1;
  const integerInput = input.slice(
    0,
    decimalIndex < 0 ? undefined : decimalIndex,
  );
  const fractionInput = input.slice(decimalIndex + 1);
  const integerDigits = integerInput.replace(/\D/g, "");
  const fractionDigits = isFraction
    ? fractionInput.replace(/\D/g, "").slice(0, maxFractionDigits)
    : "";
  const groupedInteger = integerDigits
    ? new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(
        Number(integerDigits),
      )
    : "0";
  const hasDecimalEntry =
    isFraction && (trailingDigits > 0 || decimalIndex === input.length - 1);

  return hasDecimalEntry
    ? `${groupedInteger}${localeDecimal}${fractionDigits}`
    : groupedInteger;
};

export const parseMoney = (
  input: string,
  _currency: string,
  locale = "en",
): number | null => {
  const value = input.trim();
  if (!value || value.includes("-")) return null;

  const separators = [...value.matchAll(/[.,]/g)];
  const lastSeparator = separators.at(-1)?.index;
  let decimalSeparator: string | undefined;
  if (
    separators.some((match) => match[0] === ".") &&
    separators.some((match) => match[0] === ",")
  ) {
    decimalSeparator = value[lastSeparator ?? -1];
  } else if (separators.length > 0) {
    const localeParts = localeSeparators(locale);
    const onlySeparator = separators[0]?.[0];
    const isLocaleDecimal = onlySeparator === localeParts.decimal;
    if (isLocaleDecimal) decimalSeparator = onlySeparator;
  }

  let normalized = value.replace(/[^\d.,]/g, "");
  if (decimalSeparator) {
    const decimalIndex = normalized.lastIndexOf(decimalSeparator);
    normalized = `${normalized.slice(0, decimalIndex).replace(/[.,]/g, "")}.${normalized.slice(decimalIndex + 1).replace(/[.,]/g, "")}`;
  } else {
    normalized = normalized.replace(/[.,]/g, "");
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

export const currencySymbol = (
  currency: string,
  locale = "en",
  display: CurrencyDisplay = "narrowSymbol",
): string => {
  return (
    new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      currencyDisplay: display,
    })
      .formatToParts(0)
      .find((part) => part.type === "currency")?.value ?? currency
  );
};
