import * as RadixSelect from "@radix-ui/react-select";
import { CaretDown, Check } from "@phosphor-icons/react";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  id?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  "aria-label"?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
}

export function Select({
  id,
  value,
  defaultValue,
  onValueChange,
  options,
  placeholder,
  disabled,
  ...accessibilityProps
}: SelectProps) {
  return (
    <RadixSelect.Root
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      disabled={disabled}
    >
      <RadixSelect.Trigger
        {...accessibilityProps}
        id={id}
        className="ui-select__trigger"
      >
        <RadixSelect.Value placeholder={placeholder} />
        <RadixSelect.Icon aria-hidden="true">
          <CaretDown size={16} weight="regular" />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>
      <RadixSelect.Portal>
        <RadixSelect.Content
          className="ui-select__content"
          position="popper"
          sideOffset={6}
        >
          <RadixSelect.Viewport className="ui-select__viewport">
            {options.map((option) => (
              <RadixSelect.Item
                className="ui-select__item"
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                <RadixSelect.ItemText>{option.label}</RadixSelect.ItemText>
                <RadixSelect.ItemIndicator className="ui-select__indicator">
                  <Check size={16} weight="bold" />
                </RadixSelect.ItemIndicator>
              </RadixSelect.Item>
            ))}
          </RadixSelect.Viewport>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  );
}
