import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import {
  ChartPieSlice,
  FileText,
  GearSix,
  House,
  Plus,
  SignOut,
  UsersThree,
} from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { endpoints } from "../../api/endpoints";
import { apiRequest } from "../../api/http";
import type { Role } from "../../api/types";
import { env } from "../../config/env";
import {
  readPreferences,
  savePreferences,
  type UserPreferences,
} from "../../features/auth/prefs";
import { Button } from "../ui/Button";
import { Dialog } from "../ui/Dialog";
import { Field } from "../ui/Field";
import { Input } from "../ui/Input";
import { Mark } from "../ui/Mark";
import { Menu } from "../ui/Menu";
import { Select } from "../ui/Select";
import { ToastViewport } from "../ui/Toast";

export interface AppShellProps {
  role?: Role;
  onLogout?: () => void;
  user?: {
    fullName: string;
    businessName: string;
  };
}

const navigation = [
  { to: "/overview", key: "nav.overview", icon: House, end: true },
  { to: "/invoices", key: "nav.invoices", icon: FileText },
  { to: "/clients", key: "nav.clients", icon: UsersThree },
] as const;

export function AppShell({
  role = "User",
  onLogout,
  user = { fullName: "Account", businessName: "" },
}: AppShellProps) {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [preferences, setPreferences] =
    useState<UserPreferences>(readPreferences);
  const healthQuery = useQuery({
    queryKey: ["health"],
    queryFn: async () => apiRequest<string>(endpoints.health),
    retry: false,
    refetchOnWindowFocus: true,
    staleTime: 30_000,
  });
  const showNewInvoice =
    role === "User" && (pathname === "/overview" || pathname === "/invoices");
  const isPlatformUser = role === "Admin";
  const mainNavigation = isPlatformUser
    ? [{ to: "/platform", key: "nav.platform", icon: ChartPieSlice, end: true }]
    : [...navigation];

  const updatePreference = <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K],
  ): void => {
    const next = { ...preferences, [key]: value };
    setPreferences(next);
    savePreferences(next);
  };

  const brand = (
    <Link
      className="shell-brand"
      to={isPlatformUser ? "/platform" : "/overview"}
      aria-label={t(isPlatformUser ? "nav.platform" : "nav.overview")}
    >
      <Mark />
      <span>{t("brand")}</span>
    </Link>
  );

  const navLinks = mainNavigation.map(
    ({ to, key, icon: Icon, ...navProps }) => (
      <NavLink
        className={({ isActive }) =>
          isActive
            ? "shell-nav__link shell-nav__link--active"
            : "shell-nav__link"
        }
        to={to}
        key={to}
        {...navProps}
      >
        <Icon size={20} weight="regular" aria-hidden="true" />
        <span>{t(key)}</span>
      </NavLink>
    ),
  );

  const preferencesForm = (
    <div className="preferences-fields">
      <Field id="preference-currency" label={t("preferences.defaultCurrency")}>
        {env.currencyMode === "multi" ? (
          <Select
            value={preferences.defaultCurrency}
            onValueChange={(value) =>
              updatePreference("defaultCurrency", value)
            }
            options={supportedCurrencies()}
          />
        ) : (
          <Input
            value={env.defaultCurrency}
            readOnly
            aria-label={t("preferences.defaultCurrency")}
          />
        )}
      </Field>
      <Field id="preference-language" label={t("preferences.language")}>
        <Select
          value={preferences.language}
          onValueChange={(value) => updatePreference("language", value as "en")}
          options={[{ value: "en", label: t("preferences.english") }]}
        />
      </Field>
      <Field id="preference-timezone" label={t("preferences.timezone")}>
        <Input
          id="preference-timezone"
          value={preferences.timeZone}
          onChange={(event) =>
            updatePreference("timeZone", event.currentTarget.value)
          }
          autoComplete="off"
          list="supported-timezones"
        />
        <datalist id="supported-timezones">
          {supportedTimeZones().map((timeZone) => (
            <option key={timeZone} value={timeZone} />
          ))}
        </datalist>
      </Field>
    </div>
  );

  const mobileAccountMenu = [
    {
      label: t("nav.preferences"),
      onSelect: () => setPreferencesOpen(true),
      icon: <GearSix size={18} weight="regular" aria-hidden="true" />,
    },
    {
      label: t("nav.logout"),
      onSelect: () => onLogout?.(),
      icon: <SignOut size={18} weight="regular" aria-hidden="true" />,
    },
  ];

  return (
    <div className="shell-layout">
      <aside className="shell-rail" aria-label={t("shell.primaryNavigation")}>
        {brand}
        <nav className="shell-nav">{navLinks}</nav>
        <div className="shell-user">
          <div className="shell-user__identity">
            <span className="shell-user__name">{user.fullName}</span>
            <span className="shell-user__business">{user.businessName}</span>
          </div>
          <button
            className="shell-user__action"
            type="button"
            onClick={() => setPreferencesOpen(true)}
          >
            <GearSix size={18} weight="regular" aria-hidden="true" />
            <span>{t("nav.preferences")}</span>
          </button>
          <button
            className="shell-user__action"
            type="button"
            onClick={onLogout}
          >
            <SignOut size={18} weight="regular" aria-hidden="true" />
            <span>{t("nav.logout")}</span>
          </button>
        </div>
      </aside>

      <div className="shell-main-column">
        <header className="shell-mobile-header">
          {brand}
          <Menu
            label={t("accessibility.openAccountMenu")}
            items={mobileAccountMenu}
          />
        </header>
        <main className="shell-main">
          <Outlet />
        </main>
      </div>

      {!isPlatformUser && (
        <nav
          className="shell-bottom-tabs"
          aria-label={t("shell.primaryNavigation")}
        >
          {navigation.map(({ to, key, icon: Icon, ...navProps }) => (
            <NavLink
              className={({ isActive }) =>
                isActive
                  ? "shell-bottom-tabs__link shell-bottom-tabs__link--active"
                  : "shell-bottom-tabs__link"
              }
              to={to}
              key={to}
              {...navProps}
            >
              <Icon size={20} weight="regular" aria-hidden="true" />
              <span>{t(key)}</span>
            </NavLink>
          ))}
        </nav>
      )}

      {showNewInvoice && (
        <Link
          className="shell-new-invoice"
          to="/invoices/new"
          aria-label={t("nav.newInvoice")}
        >
          <Plus size={20} weight="bold" aria-hidden="true" />
          <span>{t("nav.newInvoice")}</span>
        </Link>
      )}

      <Dialog
        title={t("preferences.title")}
        description={t("preferences.description")}
        open={preferencesOpen}
        onOpenChange={setPreferencesOpen}
        footer={
          <Button variant="secondary" onClick={() => setPreferencesOpen(false)}>
            {t("preferences.close")}
          </Button>
        }
      >
        {preferencesForm}
      </Dialog>
      <ToastViewport />
      {healthQuery.isError && <HealthChip />}
    </div>
  );
}

function HealthChip() {
  const { t } = useTranslation();

  return (
    <div className="health-chip" role="status" aria-live="polite">
      {t("shell.healthUnavailable")}
    </div>
  );
}

function supportedCurrencies() {
  const codes =
    typeof Intl.supportedValuesOf === "function"
      ? Intl.supportedValuesOf("currency")
      : ["EUR", "GBP", "INR", "JPY", "KES", "NGN", "USD"];
  return [...new Set([env.defaultCurrency, ...codes])].map((code) => ({
    value: code,
    label: `${code} ${new Intl.DisplayNames([navigator.language], { type: "currency" }).of(code) ?? code}`,
  }));
}

function supportedTimeZones(): string[] {
  const timeZones = Intl as typeof Intl & {
    supportedValuesOf?: (key: "timeZone") => string[];
  };
  return (
    timeZones.supportedValuesOf?.("timeZone") ?? [
      Intl.DateTimeFormat().resolvedOptions().timeZone,
    ]
  );
}
