import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { DotsThree } from "@phosphor-icons/react";
import type { ReactNode } from "react";

export interface MenuItem {
  label: string;
  onSelect: () => void;
  disabled?: boolean;
  destructive?: boolean;
  icon?: ReactNode;
}

export interface MenuProps {
  label: string;
  items: MenuItem[];
  trigger?: ReactNode;
}

export function Menu({ label, items, trigger }: MenuProps) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        {trigger ?? (
          <button
            className="ui-icon-button"
            type="button"
            aria-label={label}
            title={label}
          >
            <DotsThree size={20} weight="regular" />
          </button>
        )}
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content className="ui-menu" align="end" sideOffset={6}>
          {items.map((item) => (
            <DropdownMenu.Item
              key={item.label}
              className={
                item.destructive
                  ? "ui-menu__item ui-menu__item--danger"
                  : "ui-menu__item"
              }
              disabled={item.disabled}
              onSelect={item.onSelect}
            >
              {item.icon}
              <span>{item.label}</span>
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
