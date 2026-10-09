import { useId } from "react";

export interface MarkProps {
  size?: number;
  className?: string;
}

export function Mark({ size = 24, className = "" }: MarkProps) {
  const clipId = `taskflow-mark-${useId()}`;
  return (
    <svg
      aria-hidden="true"
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
    >
      <defs>
        <clipPath id={clipId}>
          <circle cx="12" cy="12" r="9.5" />
        </clipPath>
      </defs>
      <path
        d="M12 2.5a9.5 9.5 0 0 0 0 19V2.5Z"
        fill="var(--color-ink)"
        clipPath={`url(#${clipId})`}
      />
      <circle
        cx="12"
        cy="12"
        r="9.5"
        stroke="var(--color-ink)"
        strokeWidth="1.5"
      />
    </svg>
  );
}
