import { useNavigate, useParams } from "react-router-dom";
import { InvoiceEditor } from "./InvoiceEditor";

export function InvoiceEditPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  return (
    <InvoiceEditor
      invoiceId={id}
      mode="edit"
      onSaved={(invoice) => navigate(`/invoices/${invoice.id}`)}
      onCancel={() => navigate(`/invoices/${id}`)}
    />
  );
}
