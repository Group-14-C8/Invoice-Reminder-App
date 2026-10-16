import { useTranslation } from "react-i18next";

export interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  className?: string;
  label?: string;
}

export function Skeleton({
  width = "100%",
  height = 16,
  className = "",
  label,
}: SkeletonProps) {
  const { t } = useTranslation();
  return (
    <span
      className={["ui-skeleton", className].filter(Boolean).join(" ")}
      style={{ width, height }}
      role="status"
      aria-label={label ?? t("kit.loading")}
    />
  );
}
