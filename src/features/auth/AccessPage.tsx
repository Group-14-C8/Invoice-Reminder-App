import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Mark } from "../../components/ui/Mark";

export function ForbiddenPage() {
  const { t } = useTranslation();
  return (
    <main className="auth-message-page">
      <Link className="auth-brand" to="/" aria-label={t("brand")}>
        <Mark />
        <span>{t("brand")}</span>
      </Link>
      <section>
        <h1>{t("access.forbiddenTitle")}</h1>
        <p>{t("access.forbiddenDescription")}</p>
        <Link className="ui-button ui-button--primary" to="/">
          {t("access.returnHome")}
        </Link>
      </section>
    </main>
  );
}

export function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <main className="auth-message-page">
      <Link className="auth-brand" to="/" aria-label={t("brand")}>
        <Mark />
        <span>{t("brand")}</span>
      </Link>
      <section>
        <h1>{t("access.notFoundTitle")}</h1>
        <p>{t("access.notFoundDescription")}</p>
        <Link className="ui-button ui-button--primary" to="/">
          {t("access.returnHome")}
        </Link>
      </section>
    </main>
  );
}
