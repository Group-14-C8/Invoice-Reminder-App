import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "quiet" | "danger";
export type ButtonSize = "md" | "sm";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "primary",
      size = "md",
      loading = false,
      icon,
      className = "",
      children,
      disabled,
      ...props
    },
    ref,
  ) {
    const classes = [
      "ui-button",
      `ui-button--${variant}`,
      `ui-button--${size}`,
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <button
        {...props}
        ref={ref}
        className={classes}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
      >
        {loading && <span className="ui-button__spinner" aria-hidden="true" />}
        <span
          className={
            loading
              ? "ui-button__label ui-button__label--loading"
              : "ui-button__label"
          }
        >
          {icon}
          {children}
        </span>
      </button>
    );
  },
);
