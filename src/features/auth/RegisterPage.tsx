import { useState } from "react";
import { Eye, EyeSlash } from "@phosphor-icons/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { HttpError, NetworkError, ValidationError } from "../../api/http";
import { Button } from "../../components/ui/Button";
import { Field } from "../../components/ui/Field";
import { IconButton } from "../../components/ui/IconButton";
import { Input } from "../../components/ui/Input";
import { notify } from "../../components/ui/notify";
import { useAuth } from "./useAuth";
import { AuthPage } from "./LoginPage";
import { registerSchema, type RegisterFields } from "./schemas";

export function RegisterPage() {
  const { t } = useTranslation();
  const { register: registerAccount } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const schema = registerSchema(t);
  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors, isSubmitting, isSubmitted },
  } = useForm<RegisterFields>({
    resolver: zodResolver(schema),
    mode: "onBlur",
    reValidateMode: "onChange",
  });
  const password = watch("password", "");
  const passwordHint = /[0-9\W]/u.test(password)
    ? t("auth.passwordStrengthReady")
    : t("auth.passwordStrengthHint");

  const onSubmit = handleSubmit(async (values) => {
    try {
      const result = await registerAccount(values);
      if (result.token) {
        navigate(result.user.role === "Admin" ? "/platform" : "/overview", {
          replace: true,
        });
      } else {
        notify.message(t("auth.registerContinue"));
        navigate("/login", { replace: true });
      }
    } catch (error) {
      if (error instanceof ValidationError) {
        applyRegisterErrors(error, setError, t("auth.genericError"));
        return;
      }
      const message =
        error instanceof NetworkError
          ? t("auth.networkError")
          : error instanceof HttpError
            ? error.message
            : t("auth.genericError");
      setError("root.server", { type: "server", message });
    }
  });

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <AuthPage
      title={t("auth.registerTitle")}
      subtitle={t("auth.registerSubline")}
    >
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
          id="register-email"
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
          <label className="ui-field__label" htmlFor="register-password">
            {t("auth.password")}
          </label>
          <div className="auth-password-row">
            <Input
              {...register("password")}
              id="register-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              aria-describedby={
                errors.password
                  ? "register-password-error"
                  : "register-password-hint"
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
          <p
            className="ui-field__hint"
            id="register-password-hint"
            aria-live="polite"
          >
            {passwordHint}
          </p>
          {errors.password?.message && (
            <p
              className="ui-field__error"
              id="register-password-error"
              role="alert"
            >
              {errors.password.message}
            </p>
          )}
        </div>
        <Button type="submit" loading={isSubmitting} className="auth-submit">
          {t("auth.registerButton")}
        </Button>
        <p className="auth-switch">
          {t("auth.alreadyRegistered")}{" "}
          <Link to="/login">{t("auth.loginLink")}</Link>
        </p>
      </form>
    </AuthPage>
  );
}

function applyRegisterErrors(
  error: ValidationError,
  setError: ReturnType<typeof useForm<RegisterFields>>["setError"],
  fallback: string,
): void {
  const fields: Record<string, keyof RegisterFields> = {
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
