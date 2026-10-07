import { useNavigate } from "react-router-dom";
import { InvoiceEditor } from "./InvoiceEditor";

export function InvoiceCreatePage() {
  const navigate = useNavigate();
  return (
    <InvoiceEditor
      mode="create"
      onSaved={(invoice) => navigate(`/invoices/${invoice.id}`)}
      onCancel={() => navigate("/invoices")}
    />
  );
}
