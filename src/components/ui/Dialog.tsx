import * as RadixDialog from "@radix-ui/react-dialog";
import { X } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

export interface DialogProps {
  title: string;
  description?: string;
  trigger?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  closeLabel?: string;
}

export function Dialog({
  title,
  description,
  trigger,
  children,
  footer,
  open,
  onOpenChange,
  closeLabel,
}: DialogProps) {
  const { t } = useTranslation();
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      {trigger && <RadixDialog.Trigger asChild>{trigger}</RadixDialog.Trigger>}
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="ui-overlay" />
        <RadixDialog.Content className="ui-dialog">
          <header className="ui-dialog__header">
            <div>
              <RadixDialog.Title className="ui-dialog__title">
                {title}
              </RadixDialog.Title>
              {description && (
                <RadixDialog.Description className="ui-dialog__description">
                  {description}
                </RadixDialog.Description>
              )}
            </div>
            <RadixDialog.Close asChild>
              <button
                className="ui-icon-button ui-dialog__close"
                type="button"
                aria-label={closeLabel ?? t("accessibility.close")}
              >
                <X size={18} />
              </button>
            </RadixDialog.Close>
          </header>
          {children && <div className="ui-dialog__body">{children}</div>}
          {footer && <footer className="ui-dialog__footer">{footer}</footer>}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
