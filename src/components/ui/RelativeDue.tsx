import { useTranslation } from "react-i18next";

export interface RelativeDueProps {
  dueDate: string;
  paidDate?: string | null;
  now?: Date;
  locale?: string;
  timeZone?: string;
  className?: string;
}

const calendarOrdinal = (date: string): number => {
  const [year, month, day] = date.split("-").map(Number);
  return Date.UTC(year ?? 1970, (month ?? 1) - 1, day ?? 1) / 86_400_000;
};

const calendarDateInZone = (date: Date, timeZone: string): string => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = Object.fromEntries(
    parts.map(({ type, value: partValue }) => [type, partValue]),
  );
  return `${value.year}-${value.month}-${value.day}`;
};

const formatCalendarDate = (
  date: string,
  locale: string,
  options: Intl.DateTimeFormatOptions,
) => {
  const [year, month, day] = date.split("-").map(Number);
  return new Intl.DateTimeFormat(locale, {
    ...options,
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year ?? 1970, (month ?? 1) - 1, day ?? 1)));
};

export function RelativeDue({
  dueDate,
  paidDate,
  now = new Date(),
  locale = typeof navigator === "undefined" ? "en" : navigator.language,
  timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone,
  className = "",
}: RelativeDueProps) {
  const { t } = useTranslation();
  const fullDate = formatCalendarDate(dueDate, locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  if (paidDate) {
    const paidLabel = formatCalendarDate(paidDate, locale, {
      day: "numeric",
      month: "short",
    });
    return (
      <span
        className={["relative-due", "relative-due--paid", className]
          .filter(Boolean)
          .join(" ")}
      >
        <span>{t("due.paid", { date: paidLabel })}</span>
        <span className="relative-due__date">{fullDate}</span>
      </span>
    );
  }

  const days =
    calendarOrdinal(dueDate) -
    calendarOrdinal(calendarDateInZone(now, timeZone));
  const label =
    days === 0
      ? t("due.today")
      : days === 1
        ? t("due.tomorrow")
        : days > 1
          ? t("due.inDays", { count: days })
          : t("due.late", { count: Math.abs(days) });
  const tone = days < 0 ? "late" : days <= 3 ? "soon" : "normal";

  return (
    <span
      className={["relative-due", `relative-due--${tone}`, className]
        .filter(Boolean)
        .join(" ")}
    >
      <span>{label}</span>
      <span className="relative-due__date">{fullDate}</span>
    </span>
  );
}
