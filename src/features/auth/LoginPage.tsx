import { useEffect, useState } from "react";
import { Eye, EyeSlash } from "@phosphor-icons/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { HttpError, NetworkError, ValidationError } from "../../api/http";
import { Button } from "../../components/ui/Button";
import { Field } from "../../components/ui/Field";
import { IconButton } from "../../components/ui/IconButton";
import { Input } from "../../components/ui/Input";
import { Mark } from "../../components/ui/Mark";
import { notify } from "../../components/ui/notify";
import { useAuth } from "./useAuth";
import { StatusSlip } from "./StatusSlip";
import { loginSchema, type LoginFields } from "./schemas";

const roleHome = (role: "User" | "Admin"): string =>
  role === "Admin" ? "/platform" : "/overview";

const safeNextPath = (value: string | null): string | null =>
  value?.startsWith("/") && !value.startsWith("//") ? value : null;

export function LoginPage() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const schema = loginSchema(t);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting, isSubmitted },
  } = useForm<LoginFields>({
    resolver: zodResolver(schema),
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  useEffect(() => {
    if (searchParams.get("reason") !== "session-ended") return;
    notify.error(t("auth.sessionEnded"));
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("reason");
    setSearchParams(nextParams, { replace: true });
  }, [searchParams, setSearchParams, t]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      const result = await login(values);
      const next = safeNextPath(searchParams.get("next"));
      navigate(
        result.user.role === "Admin"
          ? roleHome("Admin")
          : (next ?? roleHome("User")),
        { replace: true },
      );
    } catch (error) {
      if (error instanceof ValidationError) {
        applyServerErrors(error, setError, t("auth.genericError"));
        return;
      }
      const message =
        error instanceof NetworkError
          ? t("auth.networkError")
          : error instanceof HttpError
            ? error.message ||
              (error.status === 401
                ? t("auth.wrongCredentials")
                : t("auth.genericError"))
            : t("auth.genericError");
      setError("root.server", { type: "server", message });
    }
  });

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <AuthPage title={t("auth.loginTitle")} subtitle={t("auth.loginSubline")}>
      <form className="auth-form" onSubmit={onSubmit} noValidate>
        {isSubmitted && hasErrors && (
          <div className="auth-error-summary" role="alert" aria-live="polite">
            {t("auth.formErrorSummary")}
          </div>
        )}
        {errors.root?.server?.message && (
          <div className="auth-server-error" role="alert" aria-live="polite">
            {errors.root.server.message}
          </div>
        )}
        <Field
          id="login-email"
          label={t("auth.email")}
          error={errors.email?.message}
        >
          <Input
            {...register("email")}
            type="email"
            autoComplete="email"
            inputMode="email"
          />
        </Field>
        <div className="ui-field">
          <label className="ui-field__label" htmlFor="login-password">
            {t("auth.password")}
          </label>
          <div className="auth-password-row">
            <Input
              {...register("password")}
              id="login-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              aria-describedby={
                errors.password ? "login-password-error" : undefined
              }
              aria-invalid={Boolean(errors.password)}
            />
            <IconButton
              label={
                showPassword ? t("auth.hidePassword") : t("auth.showPassword")
              }
              className="auth-password-toggle"
              onClick={() => setShowPassword((visible) => !visible)}
            >
              {showPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
            </IconButton>
          </div>
          {errors.password?.message && (
            <p
              className="ui-field__error"
              id="login-password-error"
              role="alert"
            >
              {errors.password.message}
            </p>
          )}
        </div>
        <Button type="submit" loading={isSubmitting} className="auth-submit">
          {t("auth.loginButton")}
        </Button>
        <p className="auth-switch">
          {t("auth.newHere")}{" "}
          <Link to="/register">{t("auth.createAccountLink")}</Link>
        </p>
      </form>
    </AuthPage>
  );
}

export function AuthPage({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <main className="auth-layout">
      <section className="auth-form-panel">
        <Link className="auth-brand" to="/login" aria-label={t("brand")}>
          <Mark />
          <span>{t("brand")}</span>
        </Link>
        <div className="auth-form-content">
          <h1>{title}</h1>
          <p className="auth-subtitle">{subtitle}</p>
          {children}
        </div>
      </section>
      <StatusSlip />
    </main>
  );
}

function applyServerErrors(
  error: ValidationError,
  setError: ReturnType<typeof useForm<LoginFields>>["setError"],
  fallback: string,
): void {
  const fields: Record<string, "email" | "password"> = {
    email: "email",
    password: "password",
  };
  let mapped = false;
  for (const [key, messages] of Object.entries(error.errors)) {
    const field = fields[key.toLowerCase()];
    const message = messages[0] ?? fallback;
    if (field) {
      setError(field, { type: "server", message });
      mapped = true;
    } else {
      setError("root.server", { type: "server", message });
      mapped = true;
    }
  }
  if (!mapped) setError("root.server", { type: "server", message: fallback });
}
