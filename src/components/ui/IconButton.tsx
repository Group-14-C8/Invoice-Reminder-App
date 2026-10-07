import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  size?: "md" | "sm";
  children: ReactNode;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton(
    { label, size = "md", className = "", children, ...props },
    ref,
  ) {
    return (
      <button
        {...props}
        ref={ref}
        type={props.type ?? "button"}
        className={["ui-icon-button", `ui-icon-button--${size}`, className]
          .filter(Boolean)
          .join(" ")}
        aria-label={label}
        title={label}
      >
        {children}
      </button>
    );
  },
);
