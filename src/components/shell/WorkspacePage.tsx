import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";

const pageCopy: Record<string, { title: string; description: string }> = {
  "/overview": {
    title: "workspace.overviewTitle",
    description: "workspace.overviewDescription",
  },
  "/invoices": {
    title: "nav.invoices",
    description: "workspace.invoicesDescription",
  },
  "/invoices/new": {
    title: "nav.newInvoice",
    description: "workspace.invoicesDescription",
  },
  "/clients": {
    title: "nav.clients",
    description: "workspace.clientsDescription",
  },
  "/platform": {
    title: "nav.platform",
    description: "workspace.platformDescription",
  },
};

export function WorkspacePage() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const copy = pageCopy[pathname] ?? pageCopy["/overview"]!;

  return (
    <section className="workspace-placeholder">
      <header className="workspace-heading">
        <h1>{t(copy.title)}</h1>
      </header>
      <p>{t(copy.description)}</p>
    </section>
  );
}
