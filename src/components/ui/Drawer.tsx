import * as RadixDialog from "@radix-ui/react-dialog";
import { X } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

export interface DrawerProps {
  title: string;
  description?: string;
  trigger?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function Drawer({
  title,
  description,
  trigger,
  children,
  footer,
  open,
  onOpenChange,
}: DrawerProps) {
  const { t } = useTranslation();
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      {trigger && <RadixDialog.Trigger asChild>{trigger}</RadixDialog.Trigger>}
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="ui-overlay" />
        <RadixDialog.Content className="ui-drawer">
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
                className="ui-icon-button"
                type="button"
                aria-label={t("accessibility.close")}
              >
                <X size={18} />
              </button>
            </RadixDialog.Close>
          </header>
          {children && <div className="ui-drawer__body">{children}</div>}
          {footer && <footer className="ui-dialog__footer">{footer}</footer>}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
