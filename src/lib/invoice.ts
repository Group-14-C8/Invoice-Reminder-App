import { currencyFractionDigits } from "./money";
import type { InvoiceItem } from "../api/types";

export const invoiceTotal = (
  items: InvoiceItem[],
  currency = "NGN",
): number => {
  const decimals = currencyFractionDigits(currency);
  const factor = 10 ** decimals;
  const total = items.reduce((sum, item) => {
    const qty = Number(item.quantity) || 0;
    const price = Number(item.unitPrice) || 0;
    return sum + qty * price;
  }, 0);
  return Math.round(total * factor) / factor;
};
