import { useTranslation } from "react-i18next";
import { Input } from "./Input";

export interface DateFieldProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  issueDate?: string;
  presets?: number[];
  disabled?: boolean;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
}

const addCalendarDays = (dateValue: string, days: number): string => {
  const [year, month, day] = dateValue.split("-").map(Number);
  const date = new Date(
    Date.UTC(year ?? 1970, (month ?? 1) - 1, day ?? 1 + days),
  );
  date.setUTCDate(date.getUTCDate() + days);
  return [
    date.getUTCFullYear(),
    `${date.getUTCMonth() + 1}`.padStart(2, "0"),
    `${date.getUTCDate()}`.padStart(2, "0"),
  ].join("-");
};

export function DateField({
  id,
  value,
  onChange,
  issueDate,
  presets = [7, 14, 30],
  disabled,
  ...accessibilityProps
}: DateFieldProps) {
  const { t } = useTranslation();
  const baseDate =
    issueDate ??
    new Intl.DateTimeFormat("en-CA", {
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  const selectedDays = presets.find(
    (days) => addCalendarDays(baseDate, days) === value,
  );

  return (
    <div className="ui-date-field">
      <Input
        {...accessibilityProps}
        id={id}
        type="date"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.currentTarget.value)}
      />
      {presets.length > 0 && (
        <div
          className="ui-date-field__presets"
          role="group"
          aria-label={t("kit.datePresets")}
        >
          {presets.map((days) => (
            <button
              className="ui-date-field__preset"
              type="button"
              key={days}
              disabled={disabled}
              aria-pressed={selectedDays === days}
              onClick={() => onChange(addCalendarDays(baseDate, days))}
            >
              {t("kit.days", { count: days })}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
