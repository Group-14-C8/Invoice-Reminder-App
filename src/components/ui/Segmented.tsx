import { useId } from "react";

export interface SegmentedOption {
  value: string;
  label: string;
  count?: number;
  disabled?: boolean;
}

export interface SegmentedProps {
  value: string;
  options: SegmentedOption[];
  onValueChange: (value: string) => void;
  label?: string;
  className?: string;
}

export function Segmented({
  value,
  options,
  onValueChange,
  label,
  className = "",
}: SegmentedProps) {
  const id = useId();
  return (
    <div
      className={["ui-segmented", className].filter(Boolean).join(" ")}
      role="group"
      aria-label={label}
    >
      {options.map((option, index) => (
        <button
          className="ui-segmented__option"
          type="button"
          key={option.value}
          id={`${id}-${index}`}
          aria-pressed={option.value === value}
          disabled={option.disabled}
          onClick={() => onValueChange(option.value)}
        >
          <span>{option.label}</span>
          {option.count !== undefined && (
            <span className="ui-segmented__count">{option.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}
